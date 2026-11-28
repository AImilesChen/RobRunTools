import { mapDefinitions, mapPlaces, mapPoints, mapTypes, placeDetailUrl, placeRecordUrl } from './map-data';
import type { MapPlace, MapPoint } from './map-data';
import type { LatLngBoundsExpression } from 'leaflet';
import { filterMapData, readMapState, writeMapState, mapPosition, matchesMapQuery } from './map-query.mjs';
import { MAP_NOTES_KEY, mapNotesExport, validateMapNotes, mergeMapNotes } from './map-notes.mjs';

export async function mountMapExplorer(root: HTMLElement) {
  if (root.dataset.mounted) return;
  root.dataset.mounted = 'true';
  const definition = mapDefinitions.find(map => map.id === root.dataset.mapId)!;
  const places = mapPlaces.filter(place => place.mapId === definition.id);
  const points = mapPoints.filter(point => point.mapId === definition.id);
  const types = points.length ? mapTypes : [];
  const byPlace = new Map(places.map(place => [place.id, place]));
  const byPoint = new Map(points.map(point => [point.id, point]));
  const byType = new Map(types.map(type => [type.id, type]));
  const options = { placeIds:places.map(place=>place.id),pointIds:points.map(point=>point.id),typeIds:types.map(type=>type.id),districts:[...new Set(places.map(place=>place.district))] };
  let state = readMapState(location.hash, options);
  let filtered = filterMapData(places, points, types, state);
  let resultLimit = 50;
  let map: import('leaflet').Map | null = null;
  let L: typeof import('leaflet');
  let markers: import('leaflet').LayerGroup;
  let selection: import('leaflet').LayerGroup;
  let renderer: import('leaflet').Canvas;
  let noteMarkers: import('leaflet').LayerGroup;
  type MapNote={id:string;mapId:string;title:string;text:string;u:number;v:number;archived?:boolean;mapVersion:string;updatedAt:string};
  let notes:MapNote[]=[];
  let notesError='';
  let notesWritable=true;
  let selectedNoteId:string|null=null;
  let draftNote:MapNote|null=null;
  let showArchived=false;
  let addingNote=false;
  try{const stored=localStorage.getItem(MAP_NOTES_KEY);if(stored)notes=validateMapNotes(JSON.parse(stored),mapDefinitions.map(map=>map.id));}
  catch{notesError='Saved notes could not be read. They have not been overwritten. Check this browser’s site-data settings before editing notes.';notesWritable=false;}
  let fitZoom = 0;
  let isInitializing = true;
  let initPromise: Promise<void> | null = null;
  let searchTimer: ReturnType<typeof setTimeout>;
  let moveTimer: ReturnType<typeof setTimeout>;
  const narrow = matchMedia('(max-width: 767px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const workspace = $('.map-workspace');
  const query = $<HTMLInputElement>('[data-map-query]');
  const district = $<HTMLSelectElement>('[data-map-district]');
  const list = $('[data-result-list]');
  const detail = $('[data-map-detail]');
  const countSummary = $('[data-result-summary]');
  const shareStatus = $('[data-map-share-status]');
  const canvas = $('[data-map-canvas]');
  const liveStatus = $('[data-map-live-status]');
  const errorBox = $('[data-map-error]');
  const checkboxes = [...root.querySelectorAll<HTMLInputElement>('[name="map-type"]')];
  let returnFocus: HTMLElement | null = null;

  const element = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') => {
    const node = document.createElement(tag); node.className = className; node.textContent = text; return node;
  };
  const link = (href: string, text: string, className='map-detail-link') => {
    const node = element('a',className,text); node.href = href; return node;
  };
  function setPanel(name: string, trigger?: HTMLElement) {
    if (trigger) returnFocus = trigger;
    workspace.dataset.mobilePanel = name;
    if (narrow.matches && name !== 'closed') {
      const panel = name === 'filters' ? $('[data-map-filters]') : $('[data-map-results-panel]');
      panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true');
      requestAnimationFrame(()=>panel.querySelector<HTMLElement>('button, input, a, select')?.focus({preventScroll:true}));
    }
    for (const panel of root.querySelectorAll<HTMLElement>('[data-map-filters], [data-map-results-panel]')) {
      const active = panel.matches('[data-map-filters]') ? name === 'filters' : name === 'results' || name === 'detail';
      if (!narrow.matches || !active) { panel.removeAttribute('role');panel.removeAttribute('aria-modal'); }
    }
  }
  function closePanel() {
    setPanel('closed');
    returnFocus?.focus({preventScroll:true});
  }
  function saveUrl(push = false) {
    if (map) {
      const center = map.getCenter();
      state.x = Math.max(0,Math.min(1,center.lng/definition.width));
      state.y = Math.max(0,Math.min(1,1-center.lat/definition.height));
      state.z = map.getZoom();
    }
    const href = location.pathname + writeMapState(state,options);
    if (href !== location.pathname+location.hash) history[push ? 'pushState' : 'replaceState'](null,'',href);
  }
  function syncInputs() {
    query.value = state.q;district.value = state.district;
    checkboxes.forEach(input=>input.checked=state.types.includes(input.value));
    $('[data-clear-query]').hidden = !state.q;
  }
  function currentSelection() {
    const point = state.point ? byPoint.get(state.point) : null;
    const place = point ? byPlace.get(point.placeId ?? '') : state.place ? byPlace.get(state.place) : null;
    return {point,place};
  }
  const currentNote=()=>draftNote?.id===selectedNoteId?draftNote:notes.find(note=>note.id===selectedNoteId);
  const visibleNotes=()=>notes.filter(note=>note.mapId===definition.id&&Boolean(note.archived)===showArchived&&matchesMapQuery(note.title+' '+note.text,state.q));
  function persistNotes(next:MapNote[]){
    if(!notesWritable)throw new Error(notesError);
    const validated=validateMapNotes(mapNotesExport(next),mapDefinitions.map(map=>map.id));
    localStorage.setItem(MAP_NOTES_KEY,JSON.stringify(mapNotesExport(validated)));notes=validated;
  }
  function selectNote(id:string){selectedNoteId=id;state.place=null;state.point=null;state.tab='notes';update();setPanel('detail');focusSelection();}
  function createDraft(position:{u:number;v:number},title='New note'){
    cancelAddNote();draftNote={id:'note-'+crypto.randomUUID(),mapId:definition.id,title,text:'',u:position.u,v:position.v,archived:false,mapVersion:definition.version,updatedAt:new Date().toISOString()};
    selectedNoteId=draftNote.id;state.place=null;state.point=null;state.tab='notes';update();setPanel('detail');focusSelection();
  }
  function cancelAddNote(){addingNote=false;root.removeAttribute('data-adding-note');$('[data-add-note-prompt]').hidden=true;}
  function beginAddNote(){
    if(!map){shareStatus.textContent='Load the interactive map before placing a note.';return;}
    selectedNoteId=null;draftNote=null;state.place=null;state.point=null;addingNote=true;root.dataset.addingNote='true';$('[data-add-note-prompt]').hidden=false;update();setPanel('closed');
  }
  function drawNoteEditor(note:MapNote){
    detail.replaceChildren();
    const back=element('button','map-text-button','← Back to notes');back.type='button';back.addEventListener('click',closeSelection);detail.append(back);
    detail.append(element('p','map-eyebrow','// YOUR NOTE · SAVED IN THIS BROWSER'),element('h3','map-selected-title',draftNote?'Add a personal note':note.title));
    const form=element('form','map-note-form');
    const titleLabel=element('label','','Title');const title=element('input');title.value=note.title;title.maxLength=80;title.required=true;title.setAttribute('aria-label','Note title');titleLabel.append(title);
    const textLabel=element('label','','Note');const text=element('textarea');text.value=note.text;text.maxLength=1000;text.rows=4;text.setAttribute('aria-label','Note text');textLabel.append(text);
    const save=element('button','map-primary-button',note.archived?'Restore and save':'Save note');save.type='submit';save.disabled=!notesWritable;form.append(titleLabel,textLabel,save);
    form.addEventListener('submit',event=>{event.preventDefault();try{
      const updated={...note,title:title.value.trim(),text:text.value,archived:false,updatedAt:new Date().toISOString()};
      persistNotes([...notes.filter(n=>n.id!==updated.id),updated]);draftNote=null;selectedNoteId=updated.id;notesError='';update();shareStatus.textContent='Note saved in this browser.';
    }catch(error){shareStatus.textContent=error instanceof Error?error.message:'The browser could not save your note.';}});
    detail.append(form);detailParagraph('Notes stay on this device. Export a backup to move them; they are not included in public location links.','map-detail-note');
    if(note.mapVersion!==definition.version)detailParagraph('This note was saved against a different map version. Recheck its position.','map-selection-warning');
    if(!draftNote){const archive=element('button','map-text-button',note.archived?'Restore note':'Archive note');archive.type='button';archive.addEventListener('click',()=>{try{persistNotes(notes.map(n=>n.id===note.id?{...n,archived:!n.archived}:n));closeSelection();shareStatus.textContent=note.archived?'Note restored.':'Note archived. Open archived notes to restore it.';}catch{shareStatus.textContent='The browser could not update this note.';}});detail.append(archive);}
    if(notesError)detailParagraph(notesError,'map-selection-warning');
  }
  function drawNotesList(){
    list.replaceChildren(element('p','map-detail-note','Personal map notes are saved in this browser, without an account. Public map filters do not change them.'));
    if(notesError)list.append(element('p','map-selection-warning',notesError));
    const add=element('button','map-primary-button','Add a note on the map');add.type='button';add.disabled=!notesWritable;add.addEventListener('click',beginAddNote);list.append(add);
    for(const note of visibleNotes()){
      const button=element('button','map-result-item');button.type='button';button.append(element('span','map-result-symbol','N'));
      const text=element('span');text.append(element('strong','',note.title),element('small','',note.archived?'Archived note':'Personal note'));button.append(text);button.addEventListener('click',()=>{draftNote=null;selectNote(note.id);});list.append(button);
    }
    if(!visibleNotes().length)list.append(element('p','map-empty',showArchived?'No archived notes on this map.':'No saved notes match this view.'));
    const actions=element('div','map-note-actions');
    const exportButton=element('button','map-secondary-button','Export notes');exportButton.type='button';exportButton.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(mapNotesExport(notes),null,2)],{type:'application/json'}));const anchor=link(url,'','');anchor.download='rob-run-map-notes.json';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
    const importButton=element('button','map-secondary-button','Import notes');importButton.type='button';importButton.disabled=!notesWritable;importButton.addEventListener('click',()=>$<HTMLInputElement>('[data-import-notes]').click());
    const archiveButton=element('button','map-text-button',showArchived?'Show active notes':'Show archived notes');archiveButton.type='button';archiveButton.addEventListener('click',()=>{showArchived=!showArchived;drawNotesList();});actions.append(exportButton,importButton,archiveButton);list.append(actions);
  }
  function revealSelection() {
    const {point,place} = currentSelection();
    state.q='';state.district='';
    if(point&&!state.types.includes(point.type)) state.types.push(point.type);
    syncInputs(); update();focusSelection();saveUrl(true);
  }
  function focusSelection() {
    if (!map) return;
    const {point,place} = currentSelection();
    const target = currentNote() ?? point ?? place;
    if (!target) return;
    const position = mapPosition(target,definition.width,definition.height) as [number,number];
    const zoom = Math.max(fitZoom+(point?2.5:1.5),map.getZoom());
    map.setView(position,Math.min(zoom,4),{animate:false});
    if (narrow.matches && workspace.dataset.mobilePanel==='detail') {
      // Keep the object in the unobscured upper portion of the map.
      map.panBy([0,canvas.clientHeight*0.19],{animate:false});
    }
  }
  function selectPlace(id: string, push = true) {
    selectedNoteId=null;draftNote=null;cancelAddNote();if(state.tab==='notes')state.tab='places';
    state.place=id;state.point=null;state.invalidSelection=false;
    update();setPanel('detail');focusSelection();saveUrl(push);
  }
  function selectPoint(id: string, push = true) {
    selectedNoteId=null;draftNote=null;cancelAddNote();if(state.tab==='notes')state.tab='points';
    state.point=id;state.place=null;state.invalidSelection=false;
    update();setPanel('detail');focusSelection();saveUrl(push);
  }
  function closeSelection() {
    selectedNoteId=null;draftNote=null;
    state.place=null;state.point=null;detail.hidden=true;update();setPanel('results');saveUrl(true);
  }
  function detailParagraph(text: string, className='') { detail.append(element('p',className,text)); }
  function drawDetails() {
    const note=currentNote();if(note){detail.hidden=false;list.hidden=true;$('.map-result-tabs').hidden=true;drawNoteEditor(note);return;}
    const {point,place}=currentSelection();
    const selected=point??place;
    detail.hidden=!selected;
    list.hidden=Boolean(selected);
    $('.map-result-tabs').hidden=Boolean(selected);
    if(!selected) return;
    detail.replaceChildren();
    const back=element('button','map-text-button','← Back to results');back.type='button';back.addEventListener('click',closeSelection);detail.append(back);
    detail.append(element('p','map-eyebrow',point?'// RECORDED POINT':'// LOCATION REFERENCE'));
    const type=point?byType.get(point.type):null;
    detail.append(element('h3','map-selected-title',point?(type?.name??'Recorded point'):place!.name));
    if(place) detailParagraph(`${place.name} · ${place.district}`,'map-detail-meta');
    else detailParagraph('Building not assigned in source','map-detail-meta');
    const isVisible=point?filtered.points.some(p=>p.id===point.id):filtered.places.some(p=>p.id===place!.id);
    if(!isVisible){
      detailParagraph('This selection is outside the current filters.','map-selection-warning');
      const reveal=element('button','map-secondary-button','Show this selection');reveal.type='button';reveal.addEventListener('click',revealSelection);detail.append(reveal);
    }
    if(point){
      if(point.name)detailParagraph(point.name,'map-detail-meta');
      detailParagraph(point.origin==='service-reference'?'A named service or event reference from the community map. This position does not show live availability, stock or an active event.':'A recorded object position from the community snapshot. Its current contents, availability, floor and opening requirements are not supplied by this coordinate record.');
      const dl=element('dl','map-detail-facts');
      dl.append(element('dt','','Type'),element('dd','',type?.name??point.type),element('dt','','Source'),element('dd','',point.origin==='service-reference'?'Community reference':'Build 26464639'));
      detail.append(dl);
      detailParagraph('Object references can share the same coordinates. A position is not a guaranteed loot drop.','map-detail-note');
    } else {
      detailParagraph(place!.summary);
      if(place!.mapId==='world'&&place!.level) detailParagraph(`District level: ${place!.level}. Live ownership and available plots are not shown.`);
      if(place!.mapId==='looty-bay') {
        const dl=element('dl','map-detail-facts');
        dl.append(element('dt','','Snapshot objects'),element('dd','',String(place!.pointCount)),element('dt','','Directory records'),element('dd','',place!.recordIds.length?String(place!.recordIds.length):place!.recordMatch==='unmatched-numbering'?'Numbering match pending':'Not supplied'));
        detail.append(dl);detailParagraph('These counts come from separate datasets; they are not one-to-one matches.','map-detail-note');
      }
    }
    if(place?.profile) detail.append(link(`/locations/${place.slug}/`,'Open location guide →','map-primary-button'));
    if(place?.recordIds.length) detail.append(link(placeRecordUrl(place),point?'Browse this building’s records →':'Browse building records →'));
    if(place?.id==='world-looty-bay') detail.append(link('/map/','Open Looty Bay map →','map-primary-button'));
    if(place?.referenceUrl) detail.append(link(place.referenceUrl,'Open regional location references →','map-primary-button'));
    if(place?.recordMatch==='unmatched-numbering') detailParagraph('This residential marker is named by direction. Its match to the numbered cottages in the location directory has not been confirmed.');
    const addNote=element('button','map-secondary-button','Add a personal note here');addNote.type='button';addNote.disabled=!notesWritable;addNote.addEventListener('click',()=>createDraft(selected,point?(point.name??type?.name??'Point'):place!.name));detail.append(addNote);
    const share=element('button','map-secondary-button','Copy link to this position');share.type='button';share.addEventListener('click',copyView);detail.append(share);
    detail.append(link(definition.source,'View coordinate source ↗'));
    detailParagraph(`${point?.origin==='service-reference'?'Community service/event reference':definition.version} · checked ${definition.checkedAt}`,'map-detail-note');
  }
  function resultButton(kind:'places'|'points', object:MapPlace|MapPoint) {
    const button=element('button','map-result-item');button.type='button';
    const place=kind==='places'?object as MapPlace:byPlace.get((object as MapPoint).placeId??'');
    const type=kind==='points'?byType.get((object as MapPoint).type):null;
    const title=kind==='places'?place!.name:(object as MapPoint).name??type?.name??'Point';
    const symbol=element('span','map-result-symbol',kind==='places'?(place!.level?'L'+place!.level:place!.name.slice(0,1)):'·');symbol.setAttribute('aria-hidden','true');
    if(type)symbol.style.setProperty('--symbol-color',type.color);
    const text=element('span');text.append(element('strong','',title),element('small','',kind==='places'?`${place!.district} · ${place!.type}`:place?`${place.name} · ${place.district}`:'Building not assigned'));
    button.append(symbol,text,element('span','map-result-arrow','→'));
    button.setAttribute('aria-label',`${title}${kind==='points'?' · '+(place?.name??'unassigned')+' · '+object.id:''}`);
    button.dataset[kind==='places'?'selectPlace':'selectPoint']=object.id;
    button.addEventListener('click',()=>kind==='places'?selectPlace(object.id):selectPoint(object.id));return button;
  }
  function drawList() {
    if(state.tab==='notes'){drawNotesList();return;}
    list.replaceChildren();
    const results=state.tab==='places'?filtered.places:filtered.points;
    if(!results.length){
      list.append(element('p','map-empty','No results match these filters.'));
      if(state.tab==='places'&&filtered.points.length){const pointsButton=element('button','map-secondary-button',`Show ${filtered.points.length} matching points`);pointsButton.type='button';pointsButton.addEventListener('click',()=>setTab('points'));list.append(pointsButton);}
      const clear=element('button','map-text-button','Clear filters');clear.type='button';clear.addEventListener('click',clearFilters);list.append(clear);
    }
    for(const result of results.slice(0,resultLimit))list.append(resultButton(state.tab as 'places'|'points',result));
    if(results.length>resultLimit){const more=element('button','map-secondary-button',`Show more (${results.length-resultLimit} remaining)`);more.type='button';more.addEventListener('click',()=>{resultLimit+=50;drawList();});list.append(more);}
  }
  function setTab(tab:'places'|'points'|'notes') {state.tab=tab;state.place=null;state.point=null;selectedNoteId=null;draftNote=null;resultLimit=50;update();saveUrl(true);}
  function update() {
    filtered=filterMapData(places,points,types,state);
    $('[data-place-count]').textContent=String(filtered.places.length);
    const pointCount=root.querySelector('[data-point-count]');if(pointCount)pointCount.textContent=String(filtered.points.length);
    $('[data-note-count]').textContent=String(notes.filter(note=>note.mapId===definition.id&&!note.archived).length);
    countSummary.textContent=`${filtered.places.length} places${points.length?' · '+filtered.points.length.toLocaleString('en-US')+' points':''}`;
    if(state.tab==='notes')countSummary.textContent=`${visibleNotes().length} personal notes on this map`;
    $('[data-mobile-result-count]').textContent=state.point||state.place||selectedNoteId?'Selected location':state.tab==='notes'?'Personal notes':`${filtered.places.length} places${points.length?' · '+filtered.points.length+' points':''}`;
    root.querySelectorAll<HTMLButtonElement>('[data-result-tab]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.resultTab===state.tab)));
    $('[data-clear-query]').hidden=!state.q;
    drawList();drawDetails();paintMarkers();
  }
  function markerIcon(place:MapPlace) {
    const span=element('span','map-place-symbol'+(place.level?' map-region-symbol':'')+(state.place===place.id?' is-selected':''),place.level?'L'+place.level:place.name==='Looty Bay Bank'?'B':place.name==='Grand Hotel'?'H':place.name==='Art Gallery'?'A':place.name==='Police Station'?'P':place.type==='City'?'LB':place.type==='Shop'?'S':place.type==='Home'?'C':place.name.slice(0,1));
    span.title=place.name;return L.divIcon({html:span,className:'map-place-marker',iconSize:[30,30],iconAnchor:[15,15]});
  }
  function paintMarkers() {
    if(!map||!markers||!selection)return;
    markers.clearLayers();selection.clearLayers();
    noteMarkers?.clearLayers();
    for(const note of notes.filter(note=>note.mapId===definition.id&&!note.archived)){
      const icon=element('span','map-personal-symbol','N');
      const marker=L.marker(mapPosition(note,definition.width,definition.height) as [number,number],{icon:L.divIcon({html:icon,className:'map-personal-marker',iconSize:[26,26],iconAnchor:[13,13]}),title:'Your note: '+note.title,keyboard:true});marker.bindTooltip('Your note: '+note.title);marker.on('click',()=>{if(!addingNote){draftNote=null;selectNote(note.id);}});noteMarkers?.addLayer(marker);
    }
    const hasPointFilter=state.types.length!==types.length||Boolean(state.q)||state.tab==='points';
    const showPoints=hasPointFilter||map.getZoom()>=fitZoom+0.75;
    for(const place of filtered.places){
      const marker=L.marker(mapPosition(place,definition.width,definition.height) as [number,number],{icon:markerIcon(place),title:place.name,alt:place.name,keyboard:true});
      marker.bindTooltip(place.name,{direction:'top',offset:[0,-12]});marker.on('click',()=>{if(!addingNote)selectPlace(place.id);});markers.addLayer(marker);
    }
    if(showPoints){for(const point of filtered.points){
      const type=byType.get(point.type)!;
      const marker=L.circleMarker(mapPosition(point,definition.width,definition.height) as [number,number],{renderer,radius:map.getZoom()>=fitZoom+2?4:3,color:'#202321',weight:1,fillColor:type.color,fillOpacity:.88});
      marker.bindTooltip(point.name??`${type.name}${point.placeId?' · '+byPlace.get(point.placeId)?.name:''}`,{direction:'top'});marker.on('click',()=>{if(!addingNote)selectPoint(point.id);});markers.addLayer(marker);
    }}
    const {point,place}=currentSelection();const selected=currentNote()??point??place;
    if(selected){
      const circle=L.circleMarker(mapPosition(selected,definition.width,definition.height) as [number,number],{radius:point?10:24,color:'#d5f839',weight:3,fillColor:'#d5f839',fillOpacity:.12,interactive:false});selection.addLayer(circle);
    }
    const hint=$('[data-map-hint]');hint.textContent=addingNote?'Click to place your personal note':points.length?(showPoints?'Recorded points · select a marker or use the result list':'Places shown · zoom in for point references'):definition.id==='world'?'District reference · no live ownership':'Layout reference · no live availability';
    $('[data-map-zoom]').textContent=Math.round(100*Math.pow(2,map.getZoom()-fitZoom))+'%';
  }
  function search(fit=true) {
    selectedNoteId=null;draftNote=null;cancelAddNote();
    state.q=query.value.trim().slice(0,120);state.place=null;state.point=null;resultLimit=50;
    filtered=filterMapData(places,points,types,state);
    if(state.q&&!filtered.places.length&&filtered.points.length)state.tab='points';
    else if(!state.q)state.tab='places';
    update();
    if(fit&&map&&state.q){
      const candidates=filtered.places.length?filtered.places:filtered.points;
      if(candidates.length){map.fitBounds(L.latLngBounds(candidates.map(p=>mapPosition(p,definition.width,definition.height) as [number,number])),{padding:[40,40],maxZoom:2,animate:false});}
    }
    saveUrl();
  }
  function clearFilters() {
    selectedNoteId=null;draftNote=null;cancelAddNote();
    state.q='';state.district='';state.types=[...options.typeIds];state.place=null;state.point=null;state.tab='places';resultLimit=50;
    syncInputs();update();saveUrl(true);
  }
  function fitWholeMap() {if(map)map.fitBounds([[0,0],[definition.height,definition.width]],{padding:[24,24],animate:false});}
  async function copyView() {
    saveUrl();const href=location.href;
    try{await navigator.clipboard.writeText(href);shareStatus.textContent='Link copied.';}
    catch{
      shareStatus.replaceChildren(element('span','','Copy this link:'));
      const field=element('input','map-copy-link');field.value=href;field.readOnly=true;field.setAttribute('aria-label','Link to this map view');shareStatus.append(field);field.focus();field.select();
    }
  }
  function restoreFromUrl() {
    selectedNoteId=null;draftNote=null;cancelAddNote();
    state=readMapState(location.hash,options);resultLimit=50;syncInputs();update();
    if(state.invalidSelection)shareStatus.textContent='That location is not in this map snapshot. Choose an available result.';
    if(state.point||state.place){setPanel('detail');focusSelection();}else if(narrow.matches)setPanel('closed');
    if(map&&state.x!==null&&state.y!==null&&state.z!==null)map.setView([definition.height*(1-state.y),definition.width*state.x],state.z,{animate:false});
    if(map&&narrow.matches&&(state.point||state.place))focusSelection();
  }
  async function initMap() {
    if(initPromise)return initPromise;
    const work=async()=>{
      errorBox.hidden=true;liveStatus.hidden=false;liveStatus.textContent='Loading interactive map…';
      const slow=setTimeout(()=>{liveStatus.textContent='The map is taking longer to load. The place links still work.';},8000);
      try{
        L=await import('leaflet');
        if(map)map.remove();
        map=L.map(canvas,{crs:L.CRS.Simple,zoomControl:false,attributionControl:true,preferCanvas:true,zoomSnap:.25,zoomDelta:.5,minZoom:-3,maxZoom:4,maxBoundsViscosity:.75,scrollWheelZoom:'center',zoomAnimation:!reducedMotion.matches});
        map.attributionControl.setPrefix('<a href="https://leafletjs.com/">Leaflet</a>');
        map.attributionControl.addAttribution('Game map © Kefir · <a href="https://robrunwiki.net/map/">Community data</a>');
        // Leaflet defers adding image layers until a view exists. Establish it
        // before waiting for the image load event, otherwise both wait forever.
        fitWholeMap();
        const bounds:LatLngBoundsExpression=[[0,0],[definition.height,definition.width]];
        const overlay=L.imageOverlay(root.dataset.mapImage!,bounds,{alt:definition.name+' reference map',interactive:false}).addTo(map);
        renderer=L.canvas({padding:.5});markers=L.layerGroup().addTo(map);selection=L.layerGroup().addTo(map);noteMarkers=L.layerGroup().addTo(map);
        map.on('click',event=>{if(addingNote){const u=Math.max(0,Math.min(1,event.latlng.lng/definition.width));const v=Math.max(0,Math.min(1,1-event.latlng.lat/definition.height));createDraft({u,v});}});
        await new Promise<void>((resolve,reject)=>{
          const timer=setTimeout(()=>reject(new Error('Map image timeout')),20000);
          overlay.once('load',()=>{clearTimeout(timer);resolve();});overlay.once('error',()=>{clearTimeout(timer);reject(new Error('Map image unavailable'));});
          if(overlay.getElement()?.complete&&overlay.getElement()!.naturalWidth){clearTimeout(timer);resolve();}
        });
        $('[data-map-fallback]')?.setAttribute('hidden','');
        map.setMaxBounds(L.latLngBounds(bounds).pad(.2));fitWholeMap();fitZoom=map.getZoom();
        map.setMinZoom(fitZoom-.5);
        map.on('zoomend',paintMarkers);
        map.on('moveend',()=>{if(!isInitializing){clearTimeout(moveTimer);moveTimer=setTimeout(()=>saveUrl(),250);}});
        isInitializing=false;root.dataset.ready='true';liveStatus.hidden=true;restoreFromUrl();paintMarkers();
      }catch{
        if(map){map.remove();map=null;}
        errorBox.hidden=false;liveStatus.hidden=true;root.dataset.ready='false';
        const fallback=root.querySelector<HTMLElement>('[data-map-fallback]');if(fallback)fallback.hidden=false;
      }finally{clearTimeout(slow);initPromise=null;}
    };
    initPromise=work();return initPromise;
  }

  root.dataset.enhanced='true';syncInputs();
  $('[data-cancel-note]').addEventListener('click',cancelAddNote);
  $<HTMLInputElement>('[data-import-notes]').addEventListener('change',async event=>{const input=event.currentTarget as HTMLInputElement;const file=input.files?.[0];if(!file)return;try{
    if(file.size>1024*1024)throw new Error('Choose a notes export smaller than 1 MB.');
    const incoming=validateMapNotes(JSON.parse(await file.text()),mapDefinitions.map(map=>map.id));const merged=mergeMapNotes(notes,incoming);const added=merged.length-notes.length;
    persistNotes(merged);notesError='';update();shareStatus.textContent=`Imported ${added} notes. Existing notes were kept.`;
  }catch(error){shareStatus.textContent=error instanceof Error?error.message:'The notes file could not be read. Saved notes were not changed.';}finally{input.value='';}});
  root.querySelector<HTMLSelectElement>('[data-map-choice]')?.addEventListener('change',event=>{const path=(event.currentTarget as HTMLSelectElement).value;if(mapDefinitions.some(map=>map.path===path))location.assign(path);});
  root.querySelectorAll<HTMLElement>('[data-select-place]').forEach(node=>node.addEventListener('click',event=>{event.preventDefault();selectPlace(node.dataset.selectPlace!);}));
  root.querySelector('[data-map-search]')!.addEventListener('submit',event=>{event.preventDefault();clearTimeout(searchTimer);search();if(narrow.matches)setPanel('results',query);});
  query.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>search(false),160);});
  $('[data-clear-query]').addEventListener('click',()=>{query.value='';search(false);query.focus();});
  district.addEventListener('change',()=>{state.district=district.value;state.place=null;state.point=null;resultLimit=50;update();saveUrl(true);});
  function setTypes(ids:string[]) {state.types=ids;syncInputs();update();saveUrl(true);}
  checkboxes.forEach(input=>input.addEventListener('change',()=>setTypes(checkboxes.filter(input=>input.checked).map(input=>input.value))));
  root.querySelector('[data-types-all]')?.addEventListener('click',()=>setTypes([...options.typeIds]));
  root.querySelector('[data-types-none]')?.addEventListener('click',()=>setTypes([]));
  root.querySelectorAll<HTMLElement>('[data-type-only]').forEach(button=>button.addEventListener('click',()=>setTypes([button.dataset.typeOnly!])));
  $('[data-clear-filters]').addEventListener('click',clearFilters);
  root.querySelectorAll<HTMLElement>('[data-result-tab]').forEach(button=>button.addEventListener('click',()=>setTab(button.dataset.resultTab as 'places'|'points'|'notes')));
  $('[data-zoom-in]').addEventListener('click',()=>map?.zoomIn(.5));$('[data-zoom-out]').addEventListener('click',()=>map?.zoomOut(.5));
  $('[data-fit-map]').addEventListener('click',()=>{fitWholeMap();saveUrl(true);});
  $('[data-full-map]').addEventListener('click',()=>{
    const expanded=root.classList.toggle('is-expanded');document.body.classList.toggle('has-expanded-map',expanded);
    $('[data-full-map]').setAttribute('aria-label',expanded?'Exit expanded map':'Expand map view');
    requestAnimationFrame(()=>{map?.invalidateSize({pan:false});paintMarkers();});
  });
  $('[data-open-filters]').addEventListener('click',event=>setPanel('filters',event.currentTarget as HTMLElement));
  $('[data-open-results]').addEventListener('click',event=>{setPanel(state.place||state.point||selectedNoteId?'detail':'results',event.currentTarget as HTMLElement);if(state.place||state.point||selectedNoteId)focusSelection();});
  $('[data-apply-filters]').addEventListener('click',()=>setPanel('results'));
  root.querySelectorAll('[data-close-panel]').forEach(button=>button.addEventListener('click',closePanel));
  root.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      cancelAddNote();
      if(root.classList.contains('is-expanded')){root.classList.remove('is-expanded');document.body.classList.remove('has-expanded-map');map?.invalidateSize();}
      closePanel();
    }
    if(event.key==='Tab'&&narrow.matches&&workspace.dataset.mobilePanel!=='closed'){
      const panel=workspace.dataset.mobilePanel==='filters'?$('[data-map-filters]'):$('[data-map-results-panel]');
      const controls=[...panel.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select')].filter(node=>node.getClientRects().length>0);
      const first=controls[0],last=controls.at(-1);
      if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      else if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
    }
  });
  $('[data-map-retry]').addEventListener('click',()=>void initMap());
  window.addEventListener('popstate',restoreFromUrl);window.addEventListener('hashchange',restoreFromUrl);
  narrow.addEventListener('change',()=>{setPanel(state.place||state.point||selectedNoteId?'detail':'closed');map?.invalidateSize({pan:true,animate:false});if(state.place||state.point||selectedNoteId)focusSelection();});
  const resize=new ResizeObserver(()=>{if(map){map.invalidateSize({pan:true,animate:false});fitZoom=map.getBoundsZoom(L.latLngBounds([[0,0],[definition.height,definition.width]]),false,L.point(48,48));if(state.place||state.point||selectedNoteId)focusSelection();paintMarkers();}});resize.observe(canvas);
  update();if(state.invalidSelection)shareStatus.textContent='That location is not in this snapshot. Choose an available result.';
  await initMap();
}
