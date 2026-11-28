import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterMapData, mapPosition, normalizeMapQuery, readMapState, writeMapState } from '../src/lib/map-query.mjs';
const read = name => JSON.parse(readFileSync(new URL('../src/data/'+name,import.meta.url),'utf8'));
const places = read('map-places.json').filter(place=>place.mapId==='looty-bay');
const points = read('map-points-published.json');
const types = read('map-types.json');
const options={placeIds:places.map(p=>p.id),pointIds:points.map(p=>p.id),typeIds:types.map(t=>t.id),districts:[...new Set(places.map(p=>p.district))]};
const base=()=>readMapState('',options);

test('negative source place indices stay unassigned instead of falling into the last gun shop',()=>{
  assert.equal(points.filter(p=>!p.origin&&p.placeId===null).length,243);
  assert.equal(points.filter(p=>p.placeId==='gun-shop-downtown').length,27);
  assert.equal(new Set(points.map(p=>p.id)).size,points.length);
});
test('image top-left coordinates convert to Leaflet bottom-left consistently',()=>{
  assert.deepEqual(mapPosition({u:0,v:0},1320,1020),[1020,0]);
  assert.deepEqual(mapPosition({u:1,v:1},1320,1020),[0,1320]);
  assert.deepEqual(mapPosition({u:.5,v:.5},1320,1020),[510,660]);
  assert.throws(()=>mapPosition({u:-.1,v:.5},1320,1020));
});
test('bank search, district and type intersect rather than overwriting each other',()=>{
  const state={...base(),q:'bank',district:'Downtown',types:['s-deposit_box']};
  const result=filterMapData(places,points,types,state);
  assert.equal(result.places.length,1);assert.equal(result.places[0].id,'looty-bay-bank');
  assert.equal(result.points.length,12);assert.ok(result.points.every(p=>p.type==='s-deposit_box'&&p.placeId==='looty-bay-bank'));
  assert.equal(filterMapData(places,points,types,{...state,district:'Sunny Beach'}).points.length,0);
});
test('empty layer selection round-trips and does not silently become all layers',()=>{
  const state={...base(),types:[],q:'safe',point:points[0].id,x:.42,y:.25,z:1.5};
  const restored=readMapState(writeMapState(state,options),options);
  assert.deepEqual(restored.types,[]);assert.equal(restored.point,points[0].id);
  assert.equal(restored.x,.42);assert.equal(restored.z,1.5);
  assert.equal(filterMapData(places,points,types,restored).points.length,0);
});
test('foreign identifiers and invalid viewport values are rejected from shared URLs',()=>{
  const state=readMapState('#point=not-real&place=unknown&district=wrong&types=wrong,s-safe&x=NaN&y=5&z=Infinity',options);
  assert.equal(state.invalidSelection,true);assert.equal(state.point,null);assert.equal(state.place,null);
  assert.equal(state.district,'');assert.deepEqual(state.types,['s-safe']);
  assert.equal(state.x,null);assert.equal(state.y,null);assert.equal(state.z,null);
});
test('ATM search uses independently sourced ATM markers instead of unrelated safes',()=>{
  const result=filterMapData(places,points,types,{...base(),q:'ATM'});
  assert.ok(result.places.length>0);assert.equal(result.points.length,14);
  assert.ok(result.points.every(p=>p.type==='s-atm'&&p.origin==='service-reference'));
});
test('regional marker coordinates use the declared dimensions of their own image',()=>{
  const maps=read('maps.json');const allPlaces=read('map-places.json');
  for(const [id,count] of [['motel',6],['prison',10],['sales-center',21]]){
    const definition=maps.find(m=>m.id===id);const markers=allPlaces.filter(p=>p.mapId===id);
    assert.equal(markers.length,count);
    assert.ok(markers.every(p=>p.u>=0&&p.u<=1&&p.v>=0&&p.v<=1));
    assert.ok(markers.every(p=>mapPosition(p,definition.width,definition.height).every(Number.isFinite)));
  }
});
test('aliases and accented names are searchable without changing displayed names',()=>{
  assert.equal(normalizeMapQuery('Ocean Breeze Café'),'ocean breeze cafe');
  assert.ok(filterMapData(places,points,types,{...base(),q:'Palmside'}).places.some(p=>p.id==='police-station'));
  assert.equal(filterMapData(places,points,types,{...base(),q:'no-such-location-xyz'}).places.length,0);
});
test('directory relationships remain at building level; every referenced record exists',()=>{
  const links=read('record-point-links.json');
  const records=new Set(read('map-points.json').map(r=>r.id));
  assert.deepEqual(links.directLinks,[]);
  assert.equal(links.buildingLinks.length,28);
  assert.ok(links.buildingLinks.every(l=>l.recordIds.every(id=>records.has(id))));
  assert.equal(places.filter(p=>p.profile).length,4);
});
