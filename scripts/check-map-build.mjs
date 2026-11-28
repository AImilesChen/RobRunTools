import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const maps=JSON.parse(read('src/data/maps.json'));
const places=JSON.parse(read('src/data/map-places.json'));
const points=JSON.parse(read('src/data/map-points-published.json'));
const types=JSON.parse(read('src/data/map-types.json'));
const sitemap=read('dist/sitemap.xml');
const paths=[...maps.map(map=>map.path),...places.filter(place=>place.profile).map(place=>'/locations/'+place.slug+'/')];
const findings=[];
for(const path of paths){
  const html=read('dist'+path+'index.html');const head=html.slice(0,html.indexOf('</head>'));
  assert.equal((html.match(/<h1\b/g)??[]).length,1,path+' H1');
  assert.ok(head.includes('rel="canonical" href="https://robrun.win'+path+'"'),path+' canonical');
  assert.ok(!head.includes('noindex'),path+' indexing');
  assert.ok(sitemap.includes('<loc>https://robrun.win'+path+'</loc>'),path+' sitemap');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);assert.equal(new Set(ids).size,ids.length,path+' unique HTML IDs');
  for(const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs))JSON.parse(match[1]);
  for(const match of html.matchAll(/<img\b[^>]*src="([^"]+)"/g))if(match[1].startsWith('/'))assert.ok(existsSync(new URL('dist'+match[1],root)),path+' image '+match[1]);
  for(const match of html.matchAll(/href="(\/(?:map|locations|items)\/[^"?#]*)[^"\s]*"/g)){
    if(match[1].includes('/_'))continue;
    assert.ok(existsSync(new URL('dist'+(match[1].endsWith('/')?match[1]:match[1]+'/')+'index.html',root)),path+' link '+match[1]);
  }
  findings.push({path,canonical:true,indexable:true,oneH1:true,images:true,structuredData:true});
}
assert.ok(!sitemap.includes('<loc>https://robrun.win/map/looty-bay/</loc>'));
assert.ok(read('dist/_redirects').includes('/map/looty-bay/ /map/ 301'));
const directory=read('dist/locations/index.html');assert.equal((directory.match(/id="record-/g)??[]).length,927);
assert.equal((directory.match(/data-regional-place/g)??[]).length,10);
assert.equal(new Set(points.map(point=>point.id)).size,points.length);
assert.equal(new Set(places.map(place=>place.id)).size,places.length);
for(const point of points){assert.ok(types.some(type=>type.id===point.type));assert.ok(maps.some(map=>map.id===point.mapId));assert.ok(point.u>=0&&point.u<=1&&point.v>=0&&point.v<=1);if(point.placeId)assert.ok(places.some(place=>place.id===point.placeId));}
const result={checkedDate:'2026-11-28',pages:findings,oldRecordAnchors:927,regionalGuides:10,mapCount:maps.length,places:places.length,pointReferences:points.length,aliasRedirect:true};
mkdirSync(new URL('docs/map-plan-2026-11-28/implemented/',root),{recursive:true});writeFileSync(new URL('docs/map-plan-2026-11-28/implemented/build-verification.json',root),JSON.stringify(result,null,2));
console.log(`Verified ${paths.length} map/guide pages, ${maps.length} maps, ${points.length} point references, 927 old anchors and 10 regional guides.`);
