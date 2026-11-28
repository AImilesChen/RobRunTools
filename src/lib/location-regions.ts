import data from '../data/regional-places.json';
import { normalizeLocationQuery } from './location-query';
import motelArt from '../../assets/item-icons/vip_key_1.webp';
import barArt from '../../assets/item-icons/roulette.webp';
import prisonArt from '../../assets/item-icons/room_key_1.webp';
import plotArt from '../../assets/item-icons/plot_sale_1.webp';
import baseArt from '../../assets/item-icons/home_2.webp';
import planArt from '../../assets/item-icons/evict_plot_1.webp';
import taxArt from '../../assets/item-icons/cargo_cashbag.webp';
import alternateArt from '../../assets/item-icons/plot_sale_2.webp';
import buyerArt from '../../assets/item-icons/cargo_manifest_1_cumulative.webp';
import hangarArt from '../../assets/item-icons/storage_building_1.webp';

export const locationRegions = [
  { id: 'looty-bay', name: 'Looty Bay', code: 'LB', description: 'City buildings and 927 recorded points across four districts.' },
  { id: 'motel', name: 'Lenny’s Motel', code: 'LM', description: 'The motel hub, Lenny’s bar, services and roulette.' },
  { id: 'prison', name: 'Prison', code: 'PR', description: 'The federal institution and its dedicated grounds layout.' },
  { id: 'settlement', name: 'Settlements', code: 'ST', description: 'Land plots, player bases, tax services and alternate layouts.' },
  { id: 'sales-center', name: 'Sales Center', code: 'SC', description: 'District headquarters, trading services and the hangar.' },
];
const artwork = {
  'lennys-motel': { image: motelArt, alt: 'Key game artwork illustrating the motel hub' },
  lair: { image: barArt, alt: 'Roulette table game artwork' },
  prison: { image: prisonArt, alt: 'Key game artwork illustrating the prison area' },
  'land-plot': { image: plotArt, alt: 'Land plot title game artwork' },
  'my-base': { image: baseArt, alt: 'Player house game artwork' },
  'plot-plan': { image: planArt, alt: 'Plot notice game artwork' },
  'tax-point': { image: taxArt, alt: 'Cash bag game artwork illustrating the tax point' },
  'settlement-alternate': { image: alternateArt, alt: 'Land plot title game artwork illustrating an alternate layout' },
  'sales-center-buyer': { image: buyerArt, alt: 'Cargo manifest game artwork' },
  hangar: { image: hangarArt, alt: 'Warehouse game artwork illustrating the hangar' },
};
export const regionalPlaces = data.map(place => ({
  ...place,
  artwork: artwork[place.id as keyof typeof artwork],
  searchText: normalizeLocationQuery([place.name, place.type, locationRegions.find(region => region.id === place.region)?.name, ...place.aliases, place.description].join(' ')),
}));
