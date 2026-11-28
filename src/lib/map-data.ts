import definitions from '../data/maps.json';
import placeData from '../data/map-places.json';
import pointData from '../data/map-points-published.json';
import typeData from '../data/map-types.json';

export interface MapDefinition {
  id: string; path: string; name: string; label: string; width: number; height: number;
  coordinateOrigin: string; version: string; checkedAt: string; source: string;
  title: string; description: string; note: string;
}
export interface PlaceProfile {
  intro: string; location: string; purpose: string; source: string;
  itemIds: string[]; access: string; notes: string[];
}
export interface MapPlace {
  id: string; slug: string; mapId: string; name: string; district: string;
  type: string; aliases: string[]; u: number; v: number; level?: number;
  pointCount: number; recordIds: string[]; recordBuilding: string | null;
  recordMatch: string; source: string; checkedAt: string; profile: PlaceProfile | null;
  summary: string;
  referenceUrl?: string;
  plotNumber?: number;
  plotSets?: number[];
  groundHeight?: number;
  numberingSource?: string;
}
export interface MapPoint { id: string; mapId: string; type: string; placeId: string | null; u: number; v: number; name?: string; district?: string | null; source?: string; origin?: string; }
export interface MapType { id: string; name: string; color: string; }
export const mapDefinitions = definitions as MapDefinition[];
export const mapPlaces = placeData as MapPlace[];
export const mapPoints = pointData as MapPoint[];
export const mapTypes = typeData as MapType[];
export const profilePlaces = mapPlaces.filter(place => place.profile);
export const placeForBuilding = (building: string) => mapPlaces.find(place => place.mapId === 'looty-bay' && place.name === building && place.recordMatch === 'building-level');
export const placeMapUrl = (place: MapPlace) => `${mapDefinitions.find(map => map.id === place.mapId)!.path}#place=${encodeURIComponent(place.id)}`;
export const placeRecordUrl = (place: MapPlace) => `/locations/?q=${encodeURIComponent(place.name)}#location-results`;
export const placeDetailUrl = (place: MapPlace) => place.profile ? `/locations/${place.slug}/` : place.recordIds.length ? placeRecordUrl(place) : place.referenceUrl ?? place.source;
