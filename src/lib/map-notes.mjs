export const MAP_NOTES_KEY='robrun.map-notes.v1';
export const MAX_MAP_NOTES=500;

export function validateMapNotes(value, mapIds) {
  if (!value || value.format!=='robrun-map-notes' || value.version!==1 || !Array.isArray(value.notes) || value.notes.length>MAX_MAP_NOTES) throw new Error('Choose a ROB RUN map-notes export (version 1, up to 500 notes).');
  const seen=new Set();
  return value.notes.map(note=>{
    if (!note || typeof note.id!=='string' || !/^[a-zA-Z0-9-]{1,80}$/.test(note.id) || seen.has(note.id) || !mapIds.includes(note.mapId) || typeof note.title!=='string' || !note.title.trim() || note.title.length>80 || typeof note.text!=='string' || note.text.length>1000 || !Number.isFinite(note.u) || !Number.isFinite(note.v) || note.u<0 || note.u>1 || note.v<0 || note.v>1) throw new Error('The notes file contains an invalid map, duplicate ID, position or text field. Your saved notes were not changed.');
    seen.add(note.id);
    return {id:note.id,mapId:note.mapId,title:note.title.trim(),text:note.text,u:note.u,v:note.v,archived:note.archived===true,mapVersion:typeof note.mapVersion==='string'?note.mapVersion.slice(0,120):'',updatedAt:typeof note.updatedAt==='string'?note.updatedAt.slice(0,40):''};
  });
}

export function mapNotesExport(notes) {return {format:'robrun-map-notes',version:1,notes};}
export function mergeMapNotes(current,incoming) {
  const known=new Set(current.map(note=>note.id));
  const additions=incoming.filter(note=>!known.has(note.id));
  if(current.length+additions.length>MAX_MAP_NOTES)throw new Error('The import would exceed 500 notes. Export a backup and remove unneeded notes first.');
  return [...current,...additions];
}
