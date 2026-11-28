export function normalizeMapQuery(value = '') {
  return String(value).normalize('NFKD').replace(/\p{M}+/gu, '').toLowerCase().replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

export function matchesMapQuery(text, query) {
  const haystack = normalizeMapQuery(text);
  return normalizeMapQuery(query).split(/\s+/).filter(Boolean).every(term => haystack.includes(term));
}

export function filterMapData(places, points, types, state) {
  const byPlace = new Map(places.map(place => [place.id, place]));
  const typeNames = new Map(types.map(type => [type.id, type.name]));
  const allowed = new Set(state.types);
  const matchesDistrict = place => !state.district || place?.district === state.district;
  return {
    places: places.filter(place => matchesDistrict(place) && matchesMapQuery([place.name, place.district, place.type, ...(place.aliases ?? []), place.summary].join(' '), state.q)),
    points: points.filter(point => {
      // Do not label unrelated safes as ATMs when searching the mixed sources.
      if (/\batms?\b/.test(normalizeMapQuery(state.q)) && point.type !== 's-atm') return false;
      const place = byPlace.get(point.placeId);
      return allowed.has(point.type) && matchesDistrict(place ?? {district:point.district}) && matchesMapQuery([
        typeNames.get(point.type), point.type === 's-cash_register' ? 'cash register' : '',
        point.type === 's-deposit_box' ? 'deposit box bank' : '',
        point.id, point.name, point.district, place?.name, place?.district, ...(place?.aliases ?? []),
        !point.placeId ? 'unassigned outdoors' : '',
      ].join(' '), state.q);
    }),
  };
}

const finiteNumber = (params, key, min, max) => {
  if (!params.has(key) || params.get(key) === '') return null;
  const number = Number(params.get(key));
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
};

export function readMapState(hash, options) {
  const p = new URLSearchParams(String(hash).replace(/^#/, '').slice(0, 4000));
  const types = p.has('types') ? p.get('types').split(',').filter(type => options.typeIds.includes(type)) : [...options.typeIds];
  const place = p.get('place');
  const point = p.get('point');
  const district = p.get('district') ?? '';
  const invalidSelection = Boolean((place && !options.placeIds.includes(place)) || (point && !options.pointIds.includes(point)));
  return {
    q: (p.get('q') ?? '').slice(0, 120),
    district: options.districts.includes(district) ? district : '',
    types: [...new Set(types)],
    place: options.placeIds.includes(place) ? place : null,
    point: options.pointIds.includes(point) ? point : null,
    tab: p.get('tab') === 'points' && options.pointIds.length ? 'points' : 'places',
    x: finiteNumber(p, 'x', 0, 1), y: finiteNumber(p, 'y', 0, 1),
    z: finiteNumber(p, 'z', -5, 8), invalidSelection,
  };
}

export function writeMapState(state, options) {
  const p = new URLSearchParams();
  if (state.q) p.set('q', state.q);
  if (state.district) p.set('district', state.district);
  if (state.types.length !== options.typeIds.length || !options.typeIds.every(id => state.types.includes(id))) p.set('types', state.types.join(','));
  if (state.point) p.set('point', state.point);
  else if (state.place) p.set('place', state.place);
  if (state.tab === 'points') p.set('tab', 'points');
  if ([state.x, state.y, state.z].every(Number.isFinite)) {
    p.set('x', state.x.toFixed(5)); p.set('y', state.y.toFixed(5)); p.set('z', state.z.toFixed(2));
  }
  return p.size ? '#' + p.toString() : '';
}

export function mapPosition(point, width, height) {
  if (![point.u, point.v, width, height].every(Number.isFinite) || point.u < 0 || point.u > 1 || point.v < 0 || point.v > 1 || width <= 0 || height <= 0) throw new Error('Invalid map position');
  // Image coordinates use a top-left origin. Leaflet CRS.Simple uses bottom-left.
  return [height * (1 - point.v), width * point.u];
}
