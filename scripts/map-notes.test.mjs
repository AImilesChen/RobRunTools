import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMapNotes, mapNotesExport, mergeMapNotes } from '../src/lib/map-notes.mjs';
const note={id:'note-test',mapId:'looty-bay',title:'Meeting point',text:'Near the bridge',u:.5,v:.6,mapVersion:'snapshot',updatedAt:'2026-11-28'};
test('notes export preserves text and coordinates without executing markup',()=>{
  const imported=validateMapNotes(mapNotesExport([{...note,text:'<script>not executable</script>'}]),['looty-bay']);
  assert.equal(imported[0].text,'<script>not executable</script>');assert.equal(imported[0].u,.5);
});
test('an import rejects foreign maps, invalid coordinates and duplicate identifiers',()=>{
  for(const data of [[{...note,mapId:'other'}],[{...note,u:1.1}],[note,note],[{...note,title:''}]])assert.throws(()=>validateMapNotes(mapNotesExport(data),['looty-bay']));
});
test('merging an export keeps existing notes rather than overwriting them',()=>{
  const merged=mergeMapNotes([note],[{...note,text:'different'},{...note,id:'note-second'}]);
  assert.equal(merged.length,2);assert.equal(merged[0].text,'Near the bridge');
});
test('archived notes survive export and can be restored',()=>{
  const archived=validateMapNotes(mapNotesExport([{...note,archived:true}]),['looty-bay']);
  assert.equal(archived[0].archived,true);
  assert.equal(validateMapNotes(mapNotesExport([{...archived[0],archived:false}]),['looty-bay'])[0].archived,false);
});
