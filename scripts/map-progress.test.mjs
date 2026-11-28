import test from 'node:test';
import assert from 'node:assert/strict';
import {progressKey,progressExport,validateMapProgress,mergeMapProgress} from '../src/lib/map-progress.mjs';
const entry={mapId:'looty-bay',kind:'place',id:'looty-bay-bank',favorite:true,explored:false,mapVersion:'snapshot'};
const available=new Set([progressKey(entry)]);
test('personal favorite and explored statuses survive an export round trip',()=>assert.deepEqual(validateMapProgress(progressExport([entry]),available),[entry]));
test('imports reject unknown references, duplicate entries and malformed statuses',()=>{
  for(const entries of [[{...entry,id:'unknown'}],[entry,entry],[{...entry,explored:'true'}]])assert.throws(()=>validateMapProgress(progressExport(entries),available));
});
test('an imported backup preserves existing personal status decisions',()=>assert.deepEqual(mergeMapProgress([{...entry,explored:true}],[entry]),[{...entry,explored:true}]));
