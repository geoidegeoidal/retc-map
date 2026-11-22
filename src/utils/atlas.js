import { bbox, toMercator } from '@turf/turf';
import boundaries from '../assets/rm-comunas.json';

export const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const project = coords => { const [x, y] = toMercator(coords); return [x, -y]; };
export const areas = boundaries.features.map(feature => {
  const { name, anchor } = feature.properties;
  const geom = toMercator(feature);
  const [west, south, east, north] = bbox(geom);
  const path = geom.geometry.coordinates.map(ring => ring.map(([x,y], i) =>
    (i ? 'L' : 'M') + Math.round(x) + ',' + Math.round(-y)).join('') + 'Z').join('');
  return { name, key:normalize(name), path, bounds:[west,-north,east,-south], anchor, label:project(anchor) };
}).sort((a,b) => a.name.localeCompare(b.name,'es'));

export function metroPlants(data) {
  return (data?.features ?? []).filter(f => normalize(f.properties.region) === 'metropolitana de santiago')
    .map(f => ({ key:normalize(f.properties.comuna), props:f.properties, position:project(f.geometry.coordinates) }));
}
