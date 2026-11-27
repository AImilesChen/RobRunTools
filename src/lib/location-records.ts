import points from '../data/map-points.json';

const districts: Record<string, string> = {
  'Санни-Бич': 'Sunny Beach',
  'Даунтаун': 'Downtown',
  'Парксайд': 'Parkside',
  'Лорен-Хиллз': 'Lauren Hills',
};

const types: Record<string, string> = {
  LootNodeView: 'Loot node',
  RandomLootView: 'Random loot',
  ContainerEntityView: 'Container',
  LootObjectView: 'Loot object',
  AccessEntityView: 'Access point',
  LocationEventCargoContainerView: 'Cargo container',
  CumulativeChargerView: 'Charger',
  CashLootNodeView: 'Cash node',
  CashWithdrawalEntityView: 'Cash withdrawal',
};

export const locationRecords = points.map(point => ({
  ...point,
  district: districts[point.district] ?? point.district,
  type: types[point.type] ?? point.type,
}));

export function locationRecordUrl(id: string) {
  return `/locations/#record-${encodeURIComponent(id)}`;
}
