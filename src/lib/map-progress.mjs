export const MAP_PROGRESS_KEY='robrun.map-progress.v1';
export const progressKey=entry=>`${entry.mapId}:${entry.kind}:${entry.id}`;
export function progressExport(entries){return {format:'robrun-map-progress',version:1,entries};}
export function validateMapProgress(value,available){
  if(!value||value.format!=='robrun-map-progress'||value.version!==1||!Array.isArray(value.entries)||value.entries.length>5000)throw new Error('Choose a ROB RUN saved-places export (version 1, up to 5,000 entries).');
  const seen=new Set();
  return value.entries.map(entry=>{
    const key=entry&&progressKey(entry);
    if(!entry||!available.has(key)||seen.has(key)||typeof entry.favorite!=='boolean'||typeof entry.explored!=='boolean')throw new Error('The file contains an unknown map reference, duplicate entry or invalid status. Saved places were not changed.');
    seen.add(key);
    return {mapId:entry.mapId,kind:entry.kind,id:entry.id,favorite:entry.favorite,explored:entry.explored,mapVersion:typeof entry.mapVersion==='string'?entry.mapVersion.slice(0,120):''};
  });
}
export function mergeMapProgress(current,incoming){
  const existing=new Set(current.map(progressKey));
  const result=[...current,...incoming.filter(entry=>!existing.has(progressKey(entry)))];
  if(result.length>5000)throw new Error('The import would exceed 5,000 saved entries.');
  return result;
}
