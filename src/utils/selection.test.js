import { describe, expect, it } from 'vitest';
import { analyzeSelection, exploreMap, initialSelection } from './selection';
const plant=(id,comuna,region,x,prior,current)=>({type:'Feature',geometry:{type:'Point',coordinates:[x,-33.4]},properties:{
  id_vu:id,name:'Planta '+id,region,comuna,tonnage_2022:prior,tonnage_2023:current,category:'Industria',residues:'Metal'
}});
const rm='Metropolitana de Santiago', at=[-70.72,-33.4];
const data={features:[plant('a','RENCA',rm,-70.72,90,120),plant('b','Renca',rm,-70.721,60,0),
  plant('c','Renca','Valparaíso',-71.7,40,120),plant('d','Colina',rm,-70.725,0,24)]};
const s={...initialSelection,year:2023,center:at};
describe('single analysis context',()=>{
  it('shows all matching establishments in exploration, without forcing a commune or computing totals',()=>{
    const a=exploreMap(data,{...s,scope:'explore',bands:[0,1]});
    expect(a.points.features.map(f=>f.properties.id_vu).sort()).toEqual(['a','c','d']);
    expect(a.outline).toBeNull();
    expect(a.context.features).toHaveLength(0);
    expect(a).not.toHaveProperty('total');
  });
  it('uses each declaration year’s own site location for both comparisons and the map',()=>{
    const moving=plant('m','Renca',rm,-70.72,60,120);
    moving.properties.locations={'2022':[-70.71,-33.4,rm,'Quilicura']};
    const d={years:[2022,2023],features:[moving]};
    const a=analyzeSelection(d,s);
    expect([a.total,a.previous,a.delta]).toEqual([120,0,120]);
    const b=analyzeSelection(d,{...s,scope:'commune',commune:'Quilicura',year:2022});
    expect(b.points.features[0].geometry.coordinates).toEqual([-70.71,-33.4]);
    expect(b.previous).toBeNull();
  });
  it('includes exits when explaining year-on-year differences without mixing regions',()=>{
    const a=analyzeSelection(data,s);expect([a.total,a.count,a.previous,a.delta]).toEqual([120,1,150,-30]);
    expect(a.drivers.map(d=>[d.id,d.delta])).toEqual([['b',-60],['a',30]]);
  });
  it('changes only the spatial cohort for a radius and shares its rows with the map',()=>{
    const a=analyzeSelection(data,{...s,scope:'radius',km:1});expect(a.year).toBe(2023);
    expect([a.count,a.total,a.previous]).toEqual([2,144,150]);expect(a.points.features.map(f=>f.properties.id_vu).sort()).toEqual(['a','d']);
  });
  it('applies the same tonnage bands independently to both years; no bands means zero, including clusters',()=>{
    const a=analyzeSelection(data,{...s,scope:'radius',bands:[0]});expect([a.total,a.previous,a.count]).toEqual([24,0,1]);
    expect(a.pct).toBeNull();const empty=analyzeSelection(data,{...s,bands:[]});expect(empty.total).toBe(0);expect(empty.points.features).toHaveLength(0);
  });
  it('has no previous-year claim for the first year',()=>{
    const a=analyzeSelection(data,{...s,year:2021});expect(a.previous).toBeNull();expect(a.delta).toBeNull();expect(a.drivers).toEqual([]);
  });
});
