import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const write = (path, data) => writeFileSync(new URL('../' + path, import.meta.url), JSON.stringify(data, null, 2) + '\n');
const raw = read('raw-data/map-spots-source.json');
const records = read('src/data/map-points.json');
const items = read('src/data/items.json');
const checkedAt = '2026-11-28';
const imageMetadata = read('assets/maps/sources.json').images;
const referencePins = read('raw-data/map-reference-pins.json').pins;
mkdirSync(new URL('../docs/map-plan-2026-11-28/',import.meta.url),{recursive:true});

// Record matches are explicit building-level links. They do not assert that a
// coordinate is the same object as any one of the independent CSV records.
const curated = [
  ['nightclub','strip-club','Strip Club','Sunny Beach','Стрип-клуб','Entertainment'],
  ['liquor-sunny','sunny-beach-convenience-store','Sunny Beach Convenience Store','Sunny Beach','Минимаркет · Санни-Бич','Shop'],
  ['hotel-sunny-west','reef-hotel','Reef Hotel','Sunny Beach','Отель Reef','Hotel'],
  ['noble-mansion','aristocrats-mansion','Aristocrat’s Mansion','Lauren Hills','Особняк аристократа','Home'],
  ['grand-hotel','grand-hotel','Grand Hotel','Sunny Beach','Гранд-отель','Landmark'],
  ['cafe-pier','ocean-breeze-cafe','Ocean Breeze Café','Sunny Beach','Кафе Ocean Breeze','Café'],
  ['elite-cottage','luxury-cottage','Luxury Cottage','Lauren Hills','Элитный коттедж','Home'],
  ['cottage','cottage-south-west','Cottage · south-west','Lauren Hills',null,'Home'],
  ['hotel-sunny-east','seasons-hotel','Seasons Hotel','Sunny Beach','Отель Seasons','Hotel'],
  ['loraine-house-se','cottage-south-east','Cottage · south-east','Lauren Hills',null,'Home'],
  ['loraine-house-ne','cottage-north-east','Cottage · north-east','Lauren Hills',null,'Home'],
  ['gas-station','gas-station','Gas Station','Downtown','Автозаправка','Shop'],
  ['cafe-downtown','rusty-burgers-cafe','Rusty Burgers Café','Downtown','Кафе Rusty Burgers','Café'],
  ['liquor-downtown','central-downtown-convenience-store','Central Downtown Convenience Store','Downtown','Минимаркет · Даунтаун · центр','Shop'],
  ['liquor-downtown-north','north-downtown-convenience-store','North Downtown Convenience Store','Downtown','Минимаркет · Даунтаун · север','Shop'],
  ['art-gallery','art-gallery','Art Gallery','Parkside','Арт-галерея','Landmark'],
  ['police-station','police-station','Police Station','Parkside','Полицейский участок','Service'],
  ['looty-bay-bank','looty-bay-bank','Looty Bay Bank','Downtown','Банк Лути-Бей','Landmark'],
  ['jeweler-sunny','jewelry-store-west','Jewelry Store: West','Sunny Beach','Ювелирный магазин: Запад','Shop'],
  ['gun-shop-sunny','gun-shop-west','Gun Shop: West','Sunny Beach','Оружейный магазин: Запад','Shop'],
  ['equipment-sunny','equipment-store-west','Equipment Store: West','Sunny Beach','Магазин экипировки: Запад','Shop'],
  ['pharmacy-sunny','sunny-beach-pharmacy','Sunny Beach Pharmacy','Sunny Beach','Аптека · Санни-Бич','Shop'],
  ['electronics-sunny','sunny-beach-electronics-store','Sunny Beach Electronics Store','Sunny Beach','Магазин электроники · Санни-Бич','Shop'],
  ['electronics-downtown','downtown-electronics-store','Downtown Electronics Store','Downtown','Магазин электроники · Даунтаун','Shop'],
  ['equipment-downtown','equipment-store-east','Equipment Store: East','Downtown','Магазин экипировки: Восток','Shop'],
  ['jeweler-downtown','jewelry-store-east','Jewelry Store: East','Downtown','Ювелирный магазин: Восток','Shop'],
  ['pharmacy-downtown','downtown-pharmacy','Downtown Pharmacy','Downtown','Аптека · Даунтаун','Shop'],
  ['gun-shop-downtown','gun-shop-east','Gun Shop: East','Downtown','Оружейный магазин: Восток','Shop'],
];

const profiles = {
  'looty-bay-bank': {
    intro: 'Find the bank in northern Downtown, on the east island of Looty Bay. Compare its building records with the separately recorded map points, then follow the item references for tools and valuables.',
    location: 'The bank is on the north side of Downtown, just above the main bridge road. Its map marker represents the building area, rather than a verified entrance.',
    purpose: 'A major vault location and a banking reference point in Downtown.',
    source: 'https://robrunwiki.com/en/buildings/city_bank/',
    itemNames: ['Gold Bar','Bank Money Bag','Deposit Box Keys','Drill'],
    access: 'The community building reference associates a Drill with the bank vault and a bank ID card with the gold vault. These are different access requirements. Check the linked source before preparing a visit.',
    notes: ['Deposit boxes, vault objects and loot nodes are separate kinds of records; their counts do not describe a guaranteed payout.', 'Potential rewards depend on the game configuration and the server. A map point shows where an object was recorded, not whether it is available now.'],
  },
  'grand-hotel': {
    intro: 'Locate Grand Hotel in Sunny Beach, explore the building’s recorded points, and check the related valuables and hacking-tool references before visiting.',
    location: 'Grand Hotel occupies the large building on the west island, north of the Sunny Beach shop blocks. Use the marker to locate the building area, then inspect the surrounding map points.',
    purpose: 'A major hotel and vehicle-theft location in Sunny Beach.',
    source: 'https://robrunwiki.com/en/buildings/city_hotel_grand/',
    itemNames: ['PRIDE Ring','AMINA Earrings','POLEX Watch','USB Hacking Tool','Mini Drill'],
    access: 'The community reference lists a Grand Hotel keycard for a locked room. It also describes large safes and a computer inside; consult the source for the current requirements.',
    notes: ['Valuables listed by the building reference are potential rewards, not a complete inventory or a promise for every visit.', 'The source identifies this location with a vehicle-theft job. The website does not track an active job or server state.'],
  },
  'art-gallery': {
    intro: 'Find the Art Gallery in Parkside, also called Palmside in some community sources. Browse its object references and related art, valuables and tools.',
    location: 'The gallery is on the southern part of the central island. The community marker locates the building area; individual markers give the separately recorded object references.',
    purpose: 'A major exhibit-theft location on Looty Bay’s central island.',
    source: 'https://robrunwiki.com/en/buildings/city_gallery/',
    itemNames: ['Stone Maiden Statue','Golden Cat Statue','Deity Statue','USB Hacking Tool','Mini Drill'],
    access: 'The community reference lists an Art Gallery keycard for the vault and describes large safes and a computer. Use the item references to inspect tools; exact requirements should be checked against the linked source.',
    notes: ['Parkside and Palmside are source-name variants for the central city district in these datasets.', 'Art and container references are recorded objects and potential rewards. The map does not show current loot availability or a respawn timer.'],
  },
  'police-station': {
    intro: 'Locate the Police Station on the central island, review its building records and see the related weapon and tool references. This map is a static community reference.',
    location: 'The station is on the central island, northwest of the southern bridge crossing. Some sources call this district Parkside, while others use Palmside or Palm Side.',
    purpose: 'A police-duty location with a locked armory reference.',
    source: 'https://robrunwiki.com/en/buildings/city_police_station/',
    itemNames: ['RC 5.56 Mk3','Powder','USB Hacking Tool','Gas Grenade'],
    access: 'The community building reference identifies a Police Station ID card for the armory. Items reported only by players are not treated here as confirmed armory contents.',
    notes: ['A weapon reference is not a guarantee that the same weapon will be present in a rack on your visit.', 'Use the current in-game prompts for police duty. This website neither connects to your game account nor reports live police positions.'],
  },
};

const occurrences = new Map();
const spots = raw.spots.map(([x,y,ti,pi]) => {
  if (!raw.types[ti] || !Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1320 || y < 0 || y > 1020) throw new Error('Invalid source coordinate');
  const hash = createHash('sha256').update(`${raw.build}:${x}:${y}:${ti}:${pi}`).digest('hex').slice(0,16);
  const occurrence = (occurrences.get(hash) ?? 0) + 1;
  occurrences.set(hash, occurrence);
  return {
    id: 'point-' + hash + (occurrence > 1 ? `-${occurrence}` : ''),
    mapId: 'looty-bay', type: raw.types[ti],
    placeId: pi >= 0 && pi < raw.places.length ? raw.places[pi] : null,
    u: x / 1320, v: y / 1020,
  };
});
const places = curated.map(([id,slug,name,district,building,type]) => {
  const own = spots.filter(s => s.placeId === id);
  const sourceName = raw.places.includes(id) ? id : null;
  if (!sourceName || !own.length) throw new Error('Missing source place ' + id);
  const recordIds = building ? records.filter(r => r.building === building).map(r => r.id) : [];
  const buildingRecords = records.filter(r => recordIds.includes(r.id));
  const recordTerms = [...new Set(buildingRecords.map(record => record.name))];
  if (buildingRecords.some(record => record.type === 'CashWithdrawalEntityView')) recordTerms.push('ATM ATMs cash withdrawal');
  const p = profiles[slug];
  const itemIds = (p?.itemNames ?? []).map(n => {
    const item = items.find(i => i.name === n);
    if (!item) throw new Error('Missing related item ' + n);
    return item.id;
  });
  const marker = referencePins.find(pin => pin.map === 'looty-bay' && pin.sourceId === id);
  return { id,slug,mapId:'looty-bay',name,district,type,
    aliases:[building, raw.places.find(s => s === id), district === 'Parkside' ? 'Palmside Palm Side' : district === 'Lauren Hills' ? 'Loraine Hills' : null,...recordTerms,...(p?.itemNames??[])].filter(Boolean),
    u:marker ? marker.x/1320 : own.reduce((a,s)=>a+s.u,0)/own.length,v:marker ? marker.y/1020 : own.reduce((a,s)=>a+s.v,0)/own.length,
    pointCount:own.length,recordIds,recordBuilding:building,
    recordMatch:building ? 'building-level' : 'unmatched-numbering',
    source:'https://robrunwiki.net/map/',checkedAt,
    profile:p ? {...p,itemNames:undefined,itemIds} : null,
    summary:p?.purpose ?? `A ${type.toLowerCase()} reference in ${district}. Explore its recorded map objects and available building records.`,
  };
});

const serviceTypes = [
  ['ATM','s-atm','#d5f839'],['Parking terminal','s-parking','#e9e9de'],
  ['Fence van','s-fence','#91ed8f'],['Cargo exchange','s-cargo-exchange','#f6bd6a'],
  ['Conquest point','s-conquest','#d79ef1'],['Cargo event','s-cargo-event','#f4a67e'],
];
const publishedTypes = raw.types.map((id,index)=>({id,name:read('src/data/map-spots.json').types.find(t=>t.id===id).name,color:raw.colors[index]}));
for(const [name,id,color] of serviceTypes)publishedTypes.push({id,name,color});
const originalPointCount=spots.length;
for(const pin of referencePins.filter(pin=>pin.map==='looty-bay')){
  const split=pin.label.lastIndexOf(': ');const name=pin.label.slice(0,split);const type=pin.label.slice(split+2);
  const serviceType=serviceTypes.find(t=>t[0]===type);
  if(serviceType){
    const normalized=name.toLowerCase();
    let district=normalized.includes('downtown')?'Downtown':normalized.includes('sunny')?'Sunny Beach':normalized.includes('loraine')?'Lauren Hills':normalized.includes('palmside')?'Parkside':null;
    const knownPlace=places.find(place=>normalized.includes(place.name.toLowerCase()) || (place.id==='nightclub'&&normalized.includes('strip club')) || (place.id==='art-gallery'&&normalized.includes('art gallery')));
    if(knownPlace)district=knownPlace.district;
    spots.push({id:'reference-'+pin.sourceId,mapId:'looty-bay',type:serviceType[1],placeId:knownPlace?.id??null,name,district,u:pin.x/1320,v:pin.y/1020,source:'https://robrunwiki.net/map/',origin:'service-reference'});
  }else if(type==='Service'&&!places.some(place=>place.id===pin.sourceId)){
    places.push({id:pin.sourceId,slug:pin.sourceId,mapId:'looty-bay',name,district:'Parkside',type:'Service',aliases:['Palmside Palm Side'],u:pin.x/1320,v:pin.y/1020,pointCount:0,recordIds:[],recordBuilding:null,recordMatch:'not-applicable',source:'https://robrunwiki.net/map/',checkedAt,profile:null,summary:'A hospital service reference on Looty Bay’s central island. The marker is a community snapshot, not a live availability indicator.'});
  }
}
const regionalConfigs=[
  {id:'motel',sourceMap:'lennys-motel',path:'/map/motel/',name:'Lenny’s Motel',label:'Hub & service markers',width:1000,height:1000,title:'ROB RUN Motel Map: Lenny’s Hub & Services',description:'Locate Lenny, the ATM and recorded service markers on the ROB RUN motel map. Browse the static hub layout and related location references.',intro:'Explore the motel hub, from Lenny to the recorded ATM and vehicle markers.',note:'This is a static community layout reference. Vehicle and helicopter markers record possible spawn positions; they do not show availability on your server.'},
  {id:'prison',sourceMap:'prison',path:'/map/prison/',name:'Prison',label:'Layout & activity markers',width:900,height:700,title:'ROB RUN Prison Map: Layout & Activity References',description:'Explore the ROB RUN prison layout with recorded activity and service markers. Find the phone, yard and other named references on a static map.',intro:'Find named activity and service markers around the prison layout.',note:'The layout and markers are community references. A named activity marker does not describe its current availability, timing, access requirements or effect.'},
  {id:'sales-center',sourceMap:'sales-center',path:'/map/sales-center/',name:'Sales Center',label:'Trading & layout markers',width:1000,height:1000,title:'ROB RUN Sales Center Map: Trading & Layout References',description:'Browse the ROB RUN Sales Center layout, including recorded buyers, cargo exchange and other service markers. A static reference without live stock or occupancy.',intro:'Explore the recorded trading, vehicle and utility markers around the Sales Center.',note:'Markers record a layout reference, not live buyers, stock, treasures or available vehicles. District labels and services may change with game updates.'},
].map(config=>({...config,coordinateOrigin:'top-left',version:'Community layout reference',checkedAt,source:'https://robrunwiki.net/map/'}));
for(const config of regionalConfigs){
  for(const pin of referencePins.filter(pin=>pin.map===config.sourceMap)){
    if(pin.x<0||pin.x>config.width||pin.y<0||pin.y>config.height)throw new Error('Regional point out of bounds: '+pin.sourceId);
    const split=pin.label.lastIndexOf(': ');const name=pin.label.slice(0,split);const type=pin.label.slice(split+2);
    places.push({id:pin.sourceId,slug:pin.sourceId,mapId:config.id,name,district:type,type,aliases:[config.name],u:pin.x/config.width,v:pin.y/config.height,pointCount:0,recordIds:[],recordBuilding:null,recordMatch:'not-applicable',source:config.source,checkedAt,profile:null,referenceUrl:`/locations/?region=${config.id}#location-results`,summary:`${name} is a ${type.toLowerCase()} marker recorded on the ${config.name} reference layout. It does not show live availability or server state.`});
  }
}

const world = [
  ['dustbowl','Dustbowl',520,153,1], ['redstone','Redstone',713,203,1],
  ['rivertown','Rivertown',580,268,2], ['fallrock','Fallrock',455,348,2],
  ['highlands','Highlands',578,357,3], ['el-peso','El Peso',675,375,2],
  ['fairfield','Fairfield',326,303,1], ['rustvale','Rustvale',370,457,1],
  ['loneford','Loneford',870,329,1], ['cascadas','Cascadas',808,492,1],
  ['world-looty-bay','Looty Bay',1080,477,null],
].map(([id,name,x,y,level])=>({id,slug:id,mapId:'world',name,type:level?'District':'City',district:level?`Level ${level}`:'Destination',level,u:x/1200,v:y/594,pointCount:0,recordIds:[],recordBuilding:null,recordMatch:'not-applicable',aliases:[],source:'https://store.steampowered.com/news/app/4262460/view/717917092255368502',checkedAt,profile:null,summary:level?`${name} is marked as a Level ${level} district on Kefir’s world-map reference. This view shows its region, not live ownership, free plots or individual settlement boundaries.`:'Looty Bay is the coastal city shown on the east of the world map. Open the city map to explore buildings and recorded points.'}));

write('src/data/map-places.json',[...places,...world]);
write('src/data/map-points-published.json',spots);
write('src/data/map-types.json',publishedTypes);
write('src/data/maps.json',[
  {id:'looty-bay',path:'/map/',name:'Looty Bay',label:'City & recorded points',width:1320,height:1020,coordinateOrigin:'top-left',version:`Community snapshot · build ${raw.build}`,checkedAt,source:'https://robrunwiki.net/map/',title:'ROB RUN Interactive Map: Looty Bay Locations & Loot',description:'Find buildings, services and recorded points on the Looty Bay map. Search locations, filter point types and open related item references.',note:'Building markers locate the area of each recorded point group, not a verified entrance. Coordinate objects and location-directory records are separate datasets. This map does not show live loot or server state.'},
  {id:'world',path:'/map/world/',name:'World',label:'Districts & city reference',width:1200,height:594,coordinateOrigin:'top-left',version:'Kefir world-map screenshot · pre-release reference',checkedAt,source:'https://store.steampowered.com/news/app/4262460/view/717917092255368502',title:'ROB RUN World Map: Districts & Looty Bay',description:'Explore ROB RUN world-map districts by level, locate Looty Bay and open related location references. A static map reference, without live plot ownership.',note:'Pins locate the labelled district areas on the reference screenshot; they do not mark exact settlement boundaries or available plots. The world image is a pre-release reference and does not show current ownership.'},
  ...regionalConfigs,
]);
write('src/data/record-point-links.json',{
  checkedAt, policy:'No one-to-one point match is asserted between independent datasets.',
  directLinks:[],buildingLinks:places.filter(p=>p.recordIds.length).map(p=>({placeId:p.id,recordIds:p.recordIds,relation:'same-building',verificationStatus:'building-name-match'})),
  unmatchedRecordIds:records.filter(r=>!places.some(p=>p.recordIds.includes(r.id))).map(r=>r.id),
});
const sources={
  checkedAt,gameArtOwner:'Kefir / ROB RUN',
  note:'Original game-map imagery for an independent game reference. Community archives identify the imagery as the in-game map and the world screenshot. Source records describe provenance, not a license grant. The viewer, controls, labels and directory integration are independently implemented; no competitor viewer, watermark or site code is copied.',
  images:imageMetadata,
  coordinateData:{source:'https://robrunwiki.net/assets/map-spots.json',build:raw.build,count:originalPointCount,correction:'Preserved 243 source place indices of -1 as unassigned; the old importer incorrectly mapped them to the last place. Stable point IDs derive from source build, coordinates, type index and place index; duplicate source rows use occurrence suffixes.'},
  serviceMarkers:{source:'https://robrunwiki.net/map/',count:spots.length-originalPointCount,note:'Separately sourced named service/event references from public map markup, not a one-to-one extension of the object snapshot. Counts describe references, not guaranteed unique in-game objects.'},
  regionalMarkers:{source:'https://robrunwiki.net/map/',maps:regionalConfigs.map(c=>({id:c.id,count:places.filter(p=>p.mapId===c.id).length,width:c.width,height:c.height})),note:'Only name, type, source identifier and coordinates are used. The viewer and text are independently implemented.'},
  records:{source:'https://robrunwiki.com/en/data/',count:records.length,version:'0.7.0',relation:'Explicit building-level links only; no invented individual-point correspondence.'},
  world:{source:'https://store.steampowered.com/news/app/4262460/view/717917092255368502',method:'Independently placed region-reference pins at visible district labels on the 1200×594 world screenshot. No live ownership or settlement pins.'},
};
write('assets/maps/sources.json',sources);
const audit={checkedAt,sourceBuild:raw.build,points:spots.length,originalObjectPoints:originalPointCount,serviceMarkers:spots.length-originalPointCount,coincidentSourceRows:originalPointCount-occurrences.size,unassignedObjectPoints:spots.slice(0,originalPointCount).filter(p=>!p.placeId).length,cityPlaces:places.filter(p=>p.mapId==='looty-bay').length,buildingLinkedPlaces:places.filter(p=>p.recordIds.length).length,matchedBuildingRecords:places.reduce((a,p)=>a+p.recordIds.length,0),unmatchedNumberedCottages:places.filter(p=>p.recordMatch==='unmatched-numbering').map(p=>p.name),pointIdsUnique:new Set(spots.map(p=>p.id)).size===spots.length,individualRecordPointLinks:0,worldPlaces:world.length,regionalMaps:regionalConfigs.map(c=>({id:c.id,markers:places.filter(p=>p.mapId===c.id).length}))};
write('docs/map-plan-2026-11-28/data-audit.json',audit);
console.log(audit);
