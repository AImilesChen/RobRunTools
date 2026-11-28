import bank from '../../assets/locations/bank.jpg';
import hotel from '../../assets/locations/hotel.webp';
import gallery from '../../assets/locations/gallery.webp';
import perfume from '../../assets/item-icons/perfume_2.webp';
import comic from '../../assets/item-icons/comics_3.webp';
import magazine from '../../assets/item-icons/journal_5.webp';
import directoryArt0 from '../../assets/item-icons/alcohol_box_1.webp';
import directoryArt1 from '../../assets/item-icons/cargo_minimarket.webp';
import directoryArt2 from '../../assets/item-icons/alcohol_5.webp';
import directoryArt3 from '../../assets/item-icons/alcohol_4.webp';
import directoryArt4 from '../../assets/item-icons/alcohol_2.webp';
import directoryArt5 from '../../assets/item-icons/alcohol_14.webp';
import directoryArt6 from '../../assets/item-icons/electronics_box_1.webp';
import directoryArt7 from '../../assets/item-icons/camera_3.webp';
import directoryArt8 from '../../assets/item-icons/afak_1.webp';
import directoryArt9 from '../../assets/item-icons/first_aid_cabinet_1.webp';
import directoryArt10 from '../../assets/item-icons/jewelry_pouch_1.webp';
import directoryArt11 from '../../assets/item-icons/necklace_2.webp';
import directoryArt12 from '../../assets/item-icons/car_spare_parts_1.webp';
import directoryArt13 from '../../assets/item-icons/weaponparts_box_1.webp';
import directoryArt14 from '../../assets/item-icons/rc556_m3.webp';
import directoryArt15 from '../../assets/item-icons/gas_grenade_1.webp';
import directoryArt16 from '../../assets/item-icons/equip_carbine_1.webp';
import directoryArt17 from '../../assets/item-icons/equip_carbine_4.webp';
import directoryArt18 from '../../assets/item-icons/watch_4.webp';
import directoryArt19 from '../../assets/item-icons/cigar_1.webp';
import directoryArt20 from '../../assets/item-icons/antique_6.webp';
import directoryArt21 from '../../assets/item-icons/antique_set_1.webp';
import directoryArt22 from '../../assets/item-icons/safe.webp';
import directoryArt23 from '../../assets/item-icons/picture_tube_1.webp';
import directoryArt24 from '../../assets/item-icons/antique_4.webp';
import directoryArt25 from '../../assets/item-icons/atm.webp';
import directoryArt26 from '../../assets/item-icons/cargo_box.webp';
import directoryArt27 from '../../assets/item-icons/cash_1.webp';
import directoryArt28 from '../../assets/item-icons/figurine.webp';

const directoryArtwork = {
  "Central Downtown Convenience Store": { image: directoryArt0, alt: "Alcohol can game artwork" },
  "North Downtown Convenience Store": { image: directoryArt1, alt: "Convenience store cargo game artwork" },
  "Sunny Beach Convenience Store": { image: directoryArt2, alt: "Bottle game artwork" },
  "Rusty Burgers Café": { image: directoryArt3, alt: "Drink bottle game artwork" },
  "Ocean Breeze Café": { image: directoryArt4, alt: "Beverage game artwork" },
  "Strip Club": { image: directoryArt5, alt: "Spirits bottle game artwork" },
  "Sunny Beach Electronics Store": { image: directoryArt6, alt: "Electronics container game artwork" },
  "Downtown Electronics Store": { image: directoryArt7, alt: "Camera game artwork" },
  "Sunny Beach Pharmacy": { image: directoryArt8, alt: "Medical kit game artwork" },
  "Downtown Pharmacy": { image: directoryArt9, alt: "First aid cabinet game artwork" },
  "Jewelry Store: West": { image: directoryArt10, alt: "Jewelry pouch game artwork" },
  "Jewelry Store: East": { image: directoryArt11, alt: "Necklace game artwork" },
  "Gas Station": { image: directoryArt12, alt: "Car parts game artwork" },
  "Gun Shop: West": { image: directoryArt13, alt: "Weapon parts container game artwork" },
  "Gun Shop: East": { image: directoryArt14, alt: "Rifle game artwork" },
  "Police Station": { image: directoryArt15, alt: "Gas grenade game artwork" },
  "Equipment Store: West": { image: directoryArt16, alt: "Carabiner set game artwork" },
  "Equipment Store: East": { image: directoryArt17, alt: "Tactical carabiner game artwork" },
  "Reef Hotel": { image: directoryArt18, alt: "Watch game artwork" },
  "Seasons Hotel": { image: directoryArt19, alt: "Cigarette pack game artwork" },
  "Aristocrat’s Mansion": { image: directoryArt20, alt: "Collectible antique game artwork" },
  "Luxury Cottage": { image: directoryArt21, alt: "Antiques game artwork" },
  "Cottage No. 3": { image: directoryArt22, alt: "Safe game artwork" },
  "Cottage No. 4": { image: directoryArt23, alt: "Painting game artwork" },
  "Cottage No. 5": { image: directoryArt24, alt: "Statue game artwork" },
  "@Sunny Beach": { image: directoryArt25, alt: "ATM game artwork" },
  "@Downtown": { image: directoryArt26, alt: "Cargo box game artwork" },
  "@Parkside": { image: directoryArt27, alt: "Cash game artwork" },
  "@Lauren Hills": { image: directoryArt28, alt: "Figurine game artwork" },
};

// Each directory card has its own image assignment. No shared category fallback.
export function buildingIllustration(name: string, named: boolean, district: string) {
  const photo = buildingPhotos[name as keyof typeof buildingPhotos];
  if (photo) return { image: photo.image, alt: photo.alt, label: 'Building reference' };
  const key = named ? name : '@' + district;
  const art = directoryArtwork[key as keyof typeof directoryArtwork];
  if (!art) throw new Error('Missing directory artwork for ' + key);
  return { ...art, label: named ? 'Type artwork' : 'Point type artwork' };
}
export const buildingPhotos = {
  'Looty Bay Bank': { image: bank, alt: 'Inside the vault at Looty Bay Bank', caption: 'Bank vault · interior gameplay', source: 'https://robrungame.app/guides/rob-run-bank-heist/' },
  'Grand Hotel': { image: hotel, alt: 'Grand Hotel entrance and towers in ROB RUN', caption: 'Grand Hotel · building artwork', source: 'https://robrunbase.com/place/grand-hotel' },
  'Art Gallery': { image: gallery, alt: 'Art Gallery facade in ROB RUN', caption: 'Art Gallery · building artwork', source: 'https://robrunbase.com/place/galeria-de-arte' },
};
export const districtStories = {
  'Sunny Beach': { code: 'SB', title: 'Hotels & the waterfront', description: 'Explore Grand Hotel, the beach cafés and the western shops.', buildings: 'Grand Hotel · Ocean Breeze Café', photo: buildingPhotos['Grand Hotel'], alias: '' },
  Downtown: { code: 'DT', title: 'The bank & the city shops', description: 'Start with Looty Bay Bank, then browse the stores and gas station.', buildings: 'Looty Bay Bank · Gas Station', photo: buildingPhotos['Looty Bay Bank'], alias: '' },
  Parkside: { code: 'PK', title: 'Art & public buildings', description: 'Browse Art Gallery and Police Station records in one district.', buildings: 'Art Gallery · Police Station', photo: buildingPhotos['Art Gallery'], alias: 'Also called Palmside' },
  'Lauren Hills': { code: 'LH', title: 'Villas & private residences', description: 'Find the cottages, Luxury Cottage and Aristocrat’s Mansion.', buildings: 'Luxury Cottage · Aristocrat’s Mansion', photo: null, alias: 'Also called Loraine Hills' },
};
export const residentialItems = [{ image: perfume, name: 'FLERS Perfume' }, { image: comic, name: 'DIGITAL SOUL Comic Book' }, { image: magazine, name: 'OPALINE Magazine' }];
export const featuredStories = [
  { name: 'Looty Bay Bank', eyebrow: '01 / Downtown', description: 'Look inside the bank’s vault records, containers and access points.', ...buildingPhotos['Looty Bay Bank'] },
  { name: 'Grand Hotel', eyebrow: '02 / Sunny Beach', description: 'A landmark hotel with jewelry search nodes and other recorded points.', ...buildingPhotos['Grand Hotel'] },
  { name: 'Art Gallery', eyebrow: '03 / Parkside', description: 'Explore the gallery’s painting, antique and container records.', ...buildingPhotos['Art Gallery'] },
];
export const buildingAnchor = (name: string, district: string) => 'building-' + (district + '-' + name).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
