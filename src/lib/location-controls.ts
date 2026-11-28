import { normalizeLocationQuery } from './location-query';

const form = document.querySelector<HTMLFormElement>('#location-search')!;
const query = document.querySelector<HTMLInputElement>('#location-query')!;
const region = document.querySelector<HTMLSelectElement>('#location-region')!;
const district = document.querySelector<HTMLSelectElement>('#location-district')!;
const type = document.querySelector<HTMLSelectElement>('#location-type')!;
const filters = document.querySelector<HTMLDetailsElement>('#location-filters')!;
const filterCount = document.querySelector<HTMLElement>('#location-filter-count')!;
const resultHeading = document.querySelector<HTMLElement>('#location-results-title')!;
const resultCount = document.querySelector<HTMLElement>('#location-count')!;
const active = document.querySelector<HTMLElement>('#location-active')!;
const activeLabel = document.querySelector<HTMLElement>('#location-active-label')!;
const empty = document.querySelector<HTMLElement>('#location-empty')!;
const clear = document.querySelector<HTMLButtonElement>('#location-clear')!;
const districts = [...document.querySelectorAll<HTMLAnchorElement>('[data-district-link]')];
const buildings = [...document.querySelectorAll<HTMLDetailsElement>('.location-building')].map(element => ({
  element,
  district: element.dataset.district,
  named: element.hasAttribute('data-named'),
  count: element.querySelector<HTMLElement>('[data-group-count]')!,
  recordLabel: element.querySelector<HTMLElement>('[data-record-label]')!,
  tags: [...element.querySelectorAll<HTMLElement>('[data-group-type]')].map(tag => ({
    element: tag,
    type: tag.dataset.groupType ?? '',
    count: tag.querySelector('b')!,
  })),
  records: [...element.querySelectorAll<HTMLElement>('.location-record')].map(record => ({
    element: record,
    type: record.dataset.recordType ?? '',
    searchText: record.dataset.searchText ?? '',
  })),
}));
const number = new Intl.NumberFormat('en-US');
const regionalPlaces = [...document.querySelectorAll<HTMLDetailsElement>('[data-regional-place]')];
const regionLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-region-link]')];

function applyFilters() {
  const terms = normalizeLocationQuery(query.value).split(' ').filter(Boolean);
  let visibleBuildings = 0;
  let visibleRecords = 0;
  for (const building of buildings) {
    const inDistrict = (!region.value || region.value === 'looty-bay') && (!district.value || district.value === building.district);
    const typeCounts = new Map<string, number>();
    let count = 0;
    for (const record of building.records) {
      const match = inDistrict && (!type.value || record.type === type.value) && terms.every(term => record.searchText.includes(term));
      record.element.hidden = !match;
      if (!match) continue;
      count++;
      typeCounts.set(record.type, (typeCounts.get(record.type) ?? 0) + 1);
    }
    building.element.hidden = count === 0;
    building.count.textContent = number.format(count);
    building.recordLabel.textContent = count === 1 ? 'record' : 'records';
    let shown = 0;
    for (const tag of building.tags) {
      const typeCount = typeCounts.get(tag.type) ?? 0;
      tag.element.hidden = typeCount === 0 || shown >= 3;
      if (!tag.element.hidden) shown++;
      tag.count.textContent = number.format(typeCount);
    }
    visibleRecords += count;
    if (count && building.named) visibleBuildings++;
  }

  let visiblePlaces = 0;
  for (const place of regionalPlaces) {
    const match = (!region.value || region.value === place.dataset.region) && !district.value && !type.value && terms.every(term => place.dataset.searchText?.includes(term));
    place.hidden = !match;
    if (match) visiblePlaces++;
  }
  for (const section of document.querySelectorAll<HTMLElement>('[data-result-region]')) {
    section.hidden = !regionalPlaces.some(place => place.dataset.region === section.dataset.resultRegion && !place.hidden);
  }
  const cityFiltersEnabled = !region.value || region.value === 'looty-bay';
  district.disabled = type.disabled = !cityFiltersEnabled;
  resultCount.textContent = [
    visibleBuildings ? number.format(visibleBuildings) + (visibleBuildings === 1 ? ' building' : ' buildings') : '',
    visibleRecords || !visiblePlaces ? number.format(visibleRecords) + (visibleRecords === 1 ? ' record' : ' records') : '',
    visiblePlaces ? number.format(visiblePlaces) + (visiblePlaces === 1 ? ' regional place' : ' regional places') : '',
  ].filter(Boolean).join(' · ');

  for (const section of document.querySelectorAll<HTMLElement>('[data-result-district]')) {
    section.hidden = !buildings.some(building => building.district === section.dataset.resultDistrict && !building.element.hidden);
  }

  const labels = [query.value.trim() ? 'Search: “' + query.value.trim() + '”' : '', region.value ? region.selectedOptions[0].textContent : '', district.value, type.value].filter(Boolean);
  activeLabel.textContent = labels.join(' · ');
  active.hidden = labels.length === 0;
  empty.hidden = visibleRecords + visiblePlaces > 0;
  filterCount.textContent = String(labels.length);
  filterCount.hidden = !labels.length;
  for (const link of districts) {
    if (link.dataset.districtLink === district.value) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
  for (const link of regionLinks) {
    if (link.dataset.regionLink === region.value) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  }
}

function readFilters() {
  const params = new URLSearchParams(location.search);
  query.value = (params.get('q') ?? '').slice(0, query.maxLength);
  region.value = params.get('region') ?? '';
  if (region.selectedIndex < 0) region.value = '';
  district.value = params.get('district') ?? '';
  type.value = params.get('type') ?? '';
  if (district.selectedIndex < 0) district.value = '';
  if (type.selectedIndex < 0) type.value = '';
  if (region.value && region.value !== 'looty-bay') district.value = type.value = '';
  applyFilters();
  if (location.hash.startsWith('#record-')) revealRecord();
  else if (location.hash.startsWith('#building-')) revealBuilding();
  else if (location.hash.startsWith('#place-')) {
    const place = document.getElementById(location.hash.slice(1));
    if (place instanceof HTMLDetailsElement && !place.hidden) {
      place.open = true;
      place.scrollIntoView({ block: 'start' });
    }
  }
  else if (location.hash === '#location-results') resultHeading.scrollIntoView({ block: 'start' });
}

function updateResults({ jump = false } = {}) {
  applyFilters();
  const next = new URL(location.href);
  for (const [key, value] of [['q', query.value.trim()], ['region', region.value], ['district', district.value], ['type', type.value]]) {
    if (value) next.searchParams.set(key, value);
    else next.searchParams.delete(key);
  }
  next.hash = jump ? 'location-results' : '';
  if (next.href !== location.href) history.pushState(null, '', next);
  if (jump) {
    resultHeading.scrollIntoView({ block: 'start' });
    resultHeading.focus({ preventScroll: true });
  }
}

function revealRecord() {
  const record = document.getElementById(location.hash.slice(1));
  if (!(record instanceof HTMLDetailsElement)) return;
  const building = record.closest<HTMLDetailsElement>('.location-building');
  if (!building) return;
  // Direct record links stay usable when their point is outside the current filters.
  if (record.closest('[hidden]')) {
    query.value = region.value = district.value = type.value = '';
    const direct = new URL(location.href);
    for (const key of ['q', 'region', 'district', 'type']) direct.searchParams.delete(key);
    history.replaceState(null, '', direct);
    applyFilters();
  }
  building.open = true;
  record.open = true;
  record.scrollIntoView({ block: 'start' });
}

function revealBuilding() {
  const building = document.getElementById(location.hash.slice(1));
  if (!(building instanceof HTMLDetailsElement) || building.hidden) return;
  building.open = true;
  building.scrollIntoView({ block: 'start' });
  building.querySelector('summary')?.focus({ preventScroll: true });
}

form.addEventListener('submit', event => {
  event.preventDefault();
  updateResults({ jump: true });
});
for (const input of [district, type]) input.addEventListener('change', () => updateResults());
region.addEventListener('change', () => {
  district.value = type.value = '';
  updateResults({ jump: true });
});

clear.addEventListener('click', () => {
  query.value = region.value = district.value = type.value = '';
  updateResults({ jump: true });
});
for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-district-link], [data-location-example], [data-region-link]')) {
  link.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    query.value = link.dataset.locationExample ?? '';
    region.value = link.hasAttribute('data-region-link') ? link.dataset.regionLink ?? '' : link.dataset.districtLink || link.dataset.buildingLink ? 'looty-bay' : '';
    district.value = link.dataset.districtLink ?? '';
    type.value = '';
    updateResults({ jump: true });
    if (link.dataset.buildingLink) {
      const next = new URL(location.href);
      next.hash = link.dataset.buildingLink;
      history.replaceState(null, '', next);
      revealBuilding();
    }
  });
}

if (matchMedia('(max-width: 830px)').matches) filters.open = false;
window.addEventListener('popstate', readFilters);
window.addEventListener('hashchange', readFilters);
readFilters();
