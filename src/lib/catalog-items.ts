import itemData from '../data/items.json';
import { homeGameplayPreview } from './home-game-media.mjs';
import homeMedia from '../../assets/home-gameplay/sources.json';
import catalogMedia from '../../assets/item-icons/sources.json';

export type CatalogItem = (typeof itemData)[number];

export const itemRarities: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  epic: 'Epic',
  legendary: 'Legendary',
  exotic: 'Exotic',
  none: 'Rarity not provided',
};

export function referencePrice(item: CatalogItem) {
  return item.priceMin ?? item.priceMax;
}

export function compareReferencePrice(a: CatalogItem, b: CatalogItem) {
  return (referencePrice(b) ?? -1) - (referencePrice(a) ?? -1) || a.name.localeCompare(b.name);
}

export const catalogItems = [...itemData].sort(compareReferencePrice);

const categoryIndex = new Map<string, { slug: string; label: string; count: number }>();
for (const item of itemData) {
  const category = categoryIndex.get(item.category);
  if (category) category.count++;
  else categoryIndex.set(item.category, { slug: item.category, label: item.categoryName, count: 1 });
}

export const catalogCategories = [...categoryIndex.values()].sort((a, b) => a.label.localeCompare(b.label));

export function catalogItemArt(item: CatalogItem) {
  if (!homeGameplayPreview) return null;

  const icon = catalogMedia[item.id as keyof typeof catalogMedia];
  if (icon) return { src: '/catalog-art/' + icon.file, width: icon.width, height: icon.height };
  const home = homeMedia[item.id as keyof typeof homeMedia];
  if (home?.source.startsWith('https://robrunwiki.net/assets/items/')) return { src: '/gameplay-home/' + home.file, width: home.width, height: home.height };

  return null;
}

