import { locationRecords } from './location-records';
import { normalizeLocationQuery } from './location-query';

const buildingNames: Record<string, string> = {
  'Коттедж №3': 'Cottage No. 3',
  'Коттедж №4': 'Cottage No. 4',
  'Коттедж №5': 'Cottage No. 5',
  'Особняк аристократа': "Aristocrat’s Mansion",
  'Элитный коттедж': 'Luxury Cottage',
  'Гранд-отель': 'Grand Hotel',
  'Стрип-клуб': 'Strip Club',
  'Ювелирный магазин: Запад': 'Jewelry Store: West',
  'Ювелирный магазин: Восток': 'Jewelry Store: East',
  'Оружейный магазин: Запад': 'Gun Shop: West',
  'Оружейный магазин: Восток': 'Gun Shop: East',
  'Аптека · Санни-Бич': 'Sunny Beach Pharmacy',
  'Аптека · Даунтаун': 'Downtown Pharmacy',
  'Отель Reef': 'Reef Hotel',
  'Отель Seasons': 'Seasons Hotel',
  'Минимаркет · Санни-Бич': 'Sunny Beach Convenience Store',
  'Минимаркет · Даунтаун · север': 'North Downtown Convenience Store',
  'Минимаркет · Даунтаун · центр': 'Central Downtown Convenience Store',
  'Магазин электроники · Санни-Бич': 'Sunny Beach Electronics Store',
  'Магазин электроники · Даунтаун': 'Downtown Electronics Store',
  'Магазин экипировки: Запад': 'Equipment Store: West',
  'Магазин экипировки: Восток': 'Equipment Store: East',
  'Кафе Ocean Breeze': 'Ocean Breeze Café',
  'Кафе Rusty Burgers': 'Rusty Burgers Café',
  'Арт-галерея': 'Art Gallery',
  'Полицейский участок': 'Police Station',
  'Автозаправка': 'Gas Station',
  'Банк Лути-Бей': 'Looty Bay Bank',
};

const districtAliases: Record<string, string> = {
  'Lauren Hills': 'Loraine Hills',
  Parkside: 'Palmside',
};

const typeAliases: Record<string, string> = {
  'Cash withdrawal': 'atm atms cash machine cash withdrawal',
  'Access point': 'entry entrance door',
  'Loot node': 'search node',
  'Cash node': 'cash pile',
};

const featuredBuildings = ['Looty Bay Bank', 'Grand Hotel', 'Art Gallery', "Aristocrat’s Mansion"];
const districtOrder = ['Sunny Beach', 'Downtown', 'Parkside', 'Lauren Hills'];

export const locationTypes = [...new Set(locationRecords.map(record => record.type))].sort();
const districtCounts = new Map<string, number>();
const buildingGroups = new Map<string, {
  name: string;
  district: string;
  sourceName: string;
  records: Array<(typeof locationRecords)[number] & { searchText: string }>;
}>();

for (const record of locationRecords) {
  districtCounts.set(record.district, (districtCounts.get(record.district) ?? 0) + 1);
  const groupKey = JSON.stringify([record.district, record.building]);
  const name = buildingNames[record.building] ?? (record.building || 'Other district records');
  const group = buildingGroups.get(groupKey) ?? { name, district: record.district, sourceName: record.building, records: [] };
  const searchText = normalizeLocationQuery([
    'Looty Bay city', record.name, name, record.building, record.district, districtAliases[record.district],
    record.type, typeAliases[record.type],
  ].join(' '));
  group.records.push({ ...record, searchText });
  buildingGroups.set(groupKey, group);
}

export const locationDistricts = [...districtCounts].map(([name, count]) => ({
  name, count, order: districtOrder.indexOf(name),
})).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

export const locationGroups = [...buildingGroups.values()].map(group => {
  const types = new Map<string, number>();
  for (const record of group.records) types.set(record.type, (types.get(record.type) ?? 0) + 1);
  return {
    ...group,
    featured: featuredBuildings.indexOf(group.name),
    types: [...types].sort(([aName, aCount], [bName, bCount]) => bCount - aCount || aName.localeCompare(bName)),
    records: group.records.sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)),
  };
}).sort((a, b) =>
  Number(!a.sourceName) - Number(!b.sourceName) ||
  (a.featured < 0 ? featuredBuildings.length : a.featured) - (b.featured < 0 ? featuredBuildings.length : b.featured) ||
  a.name.localeCompare(b.name) || a.district.localeCompare(b.district)
);
