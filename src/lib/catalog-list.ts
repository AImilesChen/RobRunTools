import { getAll, toggle } from './favorites';
import { batchEstimateLimit } from './estimate-selection';

const search = document.querySelector<HTMLInputElement>('#item-query')!;
const lookup = document.querySelector<HTMLFormElement>('#item-lookup')!;
const lookupExamples = document.querySelector<HTMLElement>('#item-lookup-examples');
const category = document.querySelector<HTMLSelectElement>('#item-category')!;
const rarity = document.querySelector<HTMLSelectElement>('#item-rarity')!;
const sort = document.querySelector<HTMLSelectElement>('#item-sort')!;
const filters = document.querySelector<HTMLDetailsElement>('#item-filters')!;
const quickCategories = document.querySelector<HTMLElement>('.catalog-quick-categories')!;
const categoryButtons = [...quickCategories.querySelectorAll<HTMLButtonElement>('[data-category-filter]')];
const filterCount = document.querySelector<HTMLElement>('#filter-count')!;
const clear = document.querySelector<HTMLButtonElement>('#clear-item-filters')!;
const results = document.querySelector<HTMLElement>('#item-results')!;
const resultsStatus = document.querySelector<HTMLElement>('#catalog-count')!;
const empty = document.querySelector<HTMLElement>('#filter-empty')!;
const grid = document.querySelector<HTMLElement>('#item-grid')!;
const more = document.querySelector<HTMLButtonElement>('#show-more-items')!;
const estimates = document.querySelector<HTMLFormElement>('#estimate-selection')!;
const estimateCount = document.querySelector<HTMLElement>('#estimate-count')!;
const favoritesFeedback = document.querySelector<HTMLElement>('#favorite-feedback')!;
const favorites = [...grid.querySelectorAll<HTMLButtonElement>('.fav-btn')];
const choices = [...grid.querySelectorAll<HTMLInputElement>('input[name="add"]')];
const gridColumns = () => Number(getComputedStyle(grid).getPropertyValue('--catalog-columns'));
const batchSize = (columnCount: number) => columnCount === 5 ? 40 : columnCount >= 3 ? 36 : 24;
let columns = gridColumns();
let showCount = batchSize(columns);

function normalized(text: string) {
  return text.normalize('NFKD').toLowerCase().replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

const cards = [...grid.querySelectorAll<HTMLElement>('.item-card')].map(element => ({
  element,
  category: element.dataset.category ?? '',
  rarity: element.dataset.rarity ?? '',
  title: element.dataset.name ?? '',
  names: [normalized(element.dataset.name ?? ''), normalized(element.dataset.nameRu ?? '')].filter(Boolean),
  descriptiveTerms: normalized((element.dataset.categoryName ?? '') + ' ' + (element.dataset.category ?? '')),
  price: element.dataset.price ? Number(element.dataset.price) : null,
}));

function comparePrices(left: number | null, right: number | null, asc: boolean) {
  if (left === null) return Number(right !== null);
  if (right === null) return -1;
  return asc ? left - right : right - left;
}

function applyFilters() {
  const query = normalized(search.value);
  const terms = query ? query.split(' ') : [];
  const categoryFilter = category.value;
  const rarityFilter = rarity.value;
  const sortBy = sort.value;
  const matches = cards.flatMap(card => {
    if (categoryFilter && card.category !== categoryFilter) return [];
    if (rarityFilter && card.rarity !== rarityFilter) return [];
    if (!terms.every(term => card.names.some(name => name.includes(term)) || card.descriptiveTerms.includes(term))) return [];
    const rank = card.names.includes(query) ? 0
      : card.names.some(name => name.startsWith(query)) ? 1
      : card.names.some(name => terms.every(term => name.includes(term))) ? 2 : 3;
    return [{ card, rank }];
  });
  matches.sort((a, b) => {
    const names = a.card.title.localeCompare(b.card.title);
    if (sortBy === 'name') return names;
    if (sortBy === 'auto' && query && a.rank !== b.rank) return a.rank - b.rank;
    return comparePrices(a.card.price, b.card.price, sortBy === 'value-asc') || names;
  });

  const displayed = matches.slice(0, showCount).map(({ card }) => card.element);
  const visible = new Set(displayed);
  for (const { element } of cards) element.hidden = !visible.has(element);
  grid.append(...displayed);
  // Borrow a card from the previous row when the final result would sit alone.
  grid.toggleAttribute('data-balance-tail', columns >= 3 && displayed.length > columns && displayed.length % columns === 1);
  const total = matches.length;
  resultsStatus.textContent = total > displayed.length
    ? 'Showing ' + displayed.length + ' of ' + total + ' items'
    : total + (total === 1 ? ' item' : ' items');
  empty.hidden = total !== 0;
  more.hidden = total <= displayed.length;
  const activeFilters = Number(Boolean(categoryFilter)) + Number(Boolean(rarityFilter));
  filterCount.hidden = activeFilters === 0;
  filterCount.textContent = String(activeFilters);
  clear.hidden = !query && !search.value && activeFilters === 0 && sortBy === 'auto';
  sort.options[0].textContent = query ? 'Best match' : 'Price ↓ (auto)';
  for (const button of categoryButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === categoryFilter));
  }
  return displayed;
}

function chooseFromUrl(select: HTMLSelectElement, stored: string | null) {
  const candidate = [...select.options].find(option => option.value === stored);
  select.value = candidate?.value ?? select.options[0].value;
}

function readAddress() {
  const params = new URLSearchParams(location.search);
  search.value = params.get('q') ?? '';
  chooseFromUrl(category, params.get('category'));
  chooseFromUrl(rarity, params.get('rarity'));
  chooseFromUrl(sort, params.get('sort'));
}

function saveAddress() {
  const current = new URL(location.href);
  const fields = {
    q: search.value.trim(),
    category: category.value,
    rarity: rarity.value,
    sort: sort.value === 'auto' ? '' : sort.value,
  };
  for (const [key, value] of Object.entries(fields)) {
    if (value) current.searchParams.set(key, value);
    else current.searchParams.delete(key);
  }
  if (current.href !== location.href) history.replaceState(history.state, '', current);
}

function refreshResults() {
  showCount = batchSize(columns);
  applyFilters();
  saveAddress();
}

function focusResults() {
  results.focus({ preventScroll: true });
  results.scrollIntoView({ block: 'start' });
}

search.addEventListener('input', refreshResults);
lookup.addEventListener('submit', event => {
  event.preventDefault();
  refreshResults();
  focusResults();
});
if (lookupExamples) {
  for (const button of lookupExamples.querySelectorAll<HTMLButtonElement>('[data-item-example]')) {
    button.addEventListener('click', () => {
      search.value = button.dataset.itemExample ?? '';
      category.value = rarity.value = '';
      sort.value = 'auto';
      refreshResults();
      focusResults();
    });
  }
  lookupExamples.hidden = false;
}
for (const field of [category, rarity, sort]) field.addEventListener('change', refreshResults);
for (const button of categoryButtons) {
  button.addEventListener('click', () => {
    category.value = button.dataset.categoryFilter ?? '';
    refreshResults();
  });
}
quickCategories.hidden = false;

clear.addEventListener('click', () => {
  search.value = category.value = rarity.value = '';
  sort.value = 'auto';
  refreshResults();
  search.focus();
});

more.addEventListener('click', () => {
  const firstNew = showCount;
  showCount += batchSize(columns);
  const displayed = applyFilters();
  displayed[firstNew]?.querySelector('a')?.focus();
});

new ResizeObserver(() => {
  const nextColumns = gridColumns();
  if (nextColumns === columns) return;
  showCount = showCount === batchSize(columns)
    ? batchSize(nextColumns)
    : Math.max(batchSize(nextColumns), Math.ceil(showCount / nextColumns) * nextColumns);
  columns = nextColumns;
  applyFilters();
}).observe(grid);

function refreshEstimateCount(message?: string) {
  const count = choices.filter(choice => choice.checked).length;
  estimates.hidden = count === 0;
  estimateCount.textContent = message ?? (count + (count === 1 ? ' item selected' : ' items selected'));
}

for (const choice of choices) choice.closest('label')!.hidden = false;
grid.addEventListener('change', event => {
  const choice = event.target;
  if (!(choice instanceof HTMLInputElement) || choice.name !== 'add') return;
  if (choice.checked && choices.filter(input => input.checked).length > batchEstimateLimit) {
    choice.checked = false;
    refreshEstimateCount('Select up to ' + batchEstimateLimit + ' items per estimate.');
    return;
  }
  refreshEstimateCount();
});
document.querySelector<HTMLButtonElement>('#estimate-clear')!.addEventListener('click', () => {
  for (const choice of choices) choice.checked = false;
  refreshEstimateCount();
  search.focus();
});

function refreshFavorites() {
  const savedIds = new Set(getAll());
  for (const button of favorites) {
    const saved = savedIds.has(button.dataset.id ?? '');
    button.textContent = saved ? '★' : '☆';
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', (saved ? 'Remove saved item: ' : 'Save item: ') + button.dataset.label);
  }
}

grid.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>('.fav-btn');
  if (!button) return;
  try {
    toggle(button.dataset.id ?? '');
    favoritesFeedback.hidden = true;
    refreshFavorites();
  } catch {
    favoritesFeedback.hidden = false;
    favoritesFeedback.textContent = 'This browser could not update your saved items.';
  }
});

function restorePage() {
  readAddress();
  applyFilters();
  refreshFavorites();
  refreshEstimateCount();
}

window.addEventListener('popstate', () => {
  showCount = batchSize(columns);
  restorePage();
});
window.addEventListener('pageshow', event => { if (event.persisted) restorePage(); });
restorePage();

