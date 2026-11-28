import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const reference=read('raw-data/settlement-reference.json');
const places=read('src/data/map-places.json');
test('all three numbered cottages preserve existing place IDs and link only their own directory building',()=>{
  const records=read('src/data/map-points.json');
  for(const [id,number,count] of [['loraine-house-ne',3,33],['loraine-house-se',4,20],['cottage',5,31]]){
    const place=places.find(p=>p.id===id);assert.equal(place.name,`Cottage No. ${number}`);
    assert.equal(place.recordIds.length,count);
    assert.ok(place.recordIds.every(recordId=>records.find(record=>record.id===recordId).building===`Коттедж №${number}`));
    assert.ok(place.numberingEvidence.residualPx<4);
  }
});
test('settlement candidates are distinct from the fifteen possible active sets',()=>{
  assert.equal(reference.plots.length,31);assert.equal(reference.plotSets.length,15);
  assert.ok(reference.plotSets.every(set=>set.length===10&&new Set(set).size===10&&set.every(n=>n>=1&&n<=31)));
  assert.ok(reference.plotSets.every(set=>!set.includes(10)));
  assert.equal(reference.entranceGroups.length,64);
  assert.equal(places.filter(p=>p.mapId==='settlements'&&p.plotNumber).length,31);
});
test('known plot coordinates project north upwards into the independently drawn diagram',()=>{
  const one=places.find(p=>p.id==='settlement-plot-1');
  assert.ok(Math.abs(one.u*1218-790)<1e-9);assert.ok(Math.abs(one.v*1218-364)<1e-9);
  const ten=places.find(p=>p.id==='settlement-plot-10');assert.deepEqual(ten.plotSets,[]);
  assert.ok(places.filter(p=>p.mapId==='settlements').every(p=>p.u>=0&&p.u<=1&&p.v>=0&&p.v<=1));
});
