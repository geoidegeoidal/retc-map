import { area as surface, bbox, circle, distance, featureCollection } from '@turf/turf';
import boundaries from '../assets/rm-comunas.json';
import { normalize } from './atlas';

export const dataYears=data=>data?.years ?? [2021,2022,2023,2024];
export const bands=[
  {min:0,label:'<30',color:'#889658'},{min:30,label:'30–<170',color:'#b29b4e'},
  {min:170,label:'170–<550',color:'#c77e39'},{min:550,label:'550–<1.700',color:'#a85532'},
  {min:1700,label:'≥1.700',color:'#784332'},
];
export const communes=boundaries.features.slice().sort((a,b)=>a.properties.name.localeCompare(b.properties.name,'es'));
export const initialSelection={scope:'commune',commune:'Renca',year:2024,km:3,
  center:communes.find(f=>f.properties.name==='Renca').properties.anchor,bands:[0,1,2,3,4]};
export const number=(n,digits=0)=>new Intl.NumberFormat('es-CL',{maximumFractionDigits:digits}).format(n);
export const signed=(n,digits=1)=>(n>0?'+':'')+number(n,digits);
const topCounts=items=>Object.entries(items).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'es')).slice(0,4);
const bandOf=n=>bands.findLastIndex(b=>n>=b.min);
const value=(p,y,enabled)=>{const n=Number(p['tonnage_'+y])||0;return n>0&&enabled.includes(bandOf(n))?n:0;};

function placeAt(f,year){
  const p=f.properties, loc=p.locations?.[year];
  return loc?{coordinates:loc.slice(0,2),region:loc[2],comuna:loc[3]}:
    {coordinates:f.geometry.coordinates,region:p.region,comuna:p.comuna};
}
const mapPoint=(id,year,amount,coordinates)=>({
  type:'Feature',properties:{id_vu:String(id),['tonnage_'+year]:amount},geometry:{type:'Point',coordinates}
});
const metroBounds=bbox(boundaries);

export function exploreMap(data,s){
  const points=[];
  for(const f of data.features){
    const amount=value(f.properties,s.year,s.bands);
    if(amount)points.push(mapPoint(f.properties.id_vu,s.year,amount,placeAt(f,s.year).coordinates));
  }
  return {...s,title:'Exploración libre',outline:null,
    bounds:s.exploreCenter?bbox(circle(s.exploreCenter,3,{units:'kilometers'})):metroBounds,
    points:featureCollection(points),context:featureCollection([]),nearest:[]};
}

export function establishmentDetail(f, year, period){
  const p=f.properties, annual=p.annual_details?.[year], place=placeAt(f,year);
  const history=period.filter(y=>p['tonnage_'+y]!=null).map(y=>({year:y,value:p['tonnage_'+y]}));
  return {id:String(p.id_vu),name:annual?.[0]||p.name,category:annual?.[1]||p.category,place,year,
    tonnes:p['tonnage_'+year]??null,residues:annual?.[2]?.join(' · ')??p.residue_types?.join(' · ')??p.residues,history};
}

export function analyzeSelection(data,s) {
  const district=communes.find(f=>f.properties.name===s.commune);
  const radial=s.scope==='radius', outline=radial?circle(s.center,s.km,{units:'kilometers',steps:80}):district;
  const bounds=bbox(outline), yr=s.year, years=dataYears(data), hasPrior=years.includes(yr-1);
  const selected=[],context=[],drivers=[],categories=Object.create(null),residues=Object.create(null),timeline=years.map(y=>({year:String(y),total:0}));
  const regionalTotals=new Map(), regionNames=new Set();
  const communeKey=normalize(s.commune);
  const membership=(place,dist)=>radial?dist<=s.km:normalize(place.region)==='metropolitana de santiago'&&normalize(place.comuna)===communeKey;
  const distTo=place=>radial?distance(s.center,place.coordinates,{units:'kilometers'}):null;
  let total=0,previous=0;
  for(const f of data.features) {
    const p=f.properties, site=placeAt(f,yr), amount=value(p,yr,s.bands), region=normalize(site.region);
    const dist=amount?distTo(site):null, now=amount&&membership(site,dist)?amount:0;
    const annual=years.map((y,i)=>{
      if(y===yr){timeline[i].total+=now;return now;}
      const tonnes=value(p,y,s.bands);
      if(!tonnes)return 0;
      const place=placeAt(f,y);
      if(!membership(place,distTo(place)))return 0;
      timeline[i].total+=tonnes;
      return tonnes;
    });
    const before=hasPrior?annual[years.indexOf(yr-1)]:0, delta=now-before;
    total+=now;previous+=before;
    const id=String(p.id_vu), displayYear=now?yr:(before?yr-1:yr);
    const name=p.annual_details?.[displayYear]?.[0]||p.name;
    if(hasPrior&&Math.abs(delta)>0.000001)drivers.push({id,name,now,before,delta,displayYear});
    if(!amount)continue;
    regionalTotals.set(region,(regionalTotals.get(region)||0)+amount);
    const point=mapPoint(id,yr,amount,site.coordinates);
    if(!now){context.push(point);continue;}
    const row={id,name,now,before,delta,dist,annual,displayYear,feature:point};
    selected.push(row);regionNames.add(region);
    const cat=p.annual_details?.[yr]?.[1]||p.category||'Sin clasificar';categories[cat]=(categories[cat]||0)+1;
    new Set(p.annual_details?.[yr]?.[2]??p.residue_types??String(p.residues||'').split(/[,;]/).map(r=>r.trim()).filter(Boolean)).forEach(r=>{residues[r]=(residues[r]||0)+1;});
  }
  const ranked=selected.slice().sort((a,b)=>b.now-a.now||a.id.localeCompare(b.id)).slice(0,5);
  const chart=years.map((y,i)=>Object.fromEntries([['year',String(y)],...ranked.map(r=>['e'+r.id,r.annual[i]])]));
  const nearest=radial?selected.slice().sort((a,b)=>a.dist-b.dist).slice(0,5):[];
  const regional=regionNames.size===1?regionalTotals.get([...regionNames][0]):null;
  return {...s,outline,bounds,years,coverage:data.coverage?.[yr],title:radial?'Radio de '+s.km+' km':s.commune,
    location:radial?s.center[1].toFixed(4)+'°, '+s.center[0].toFixed(4)+'°':'Región Metropolitana de Santiago',
    bandsLabel:!s.bands.length?'Ningún tramo':s.bands.length===bands.length?'Todos los tramos':s.bands.map(i=>bands[i].label+' t').join(', '),
    total,count:selected.length,previous:hasPrior?previous:null,delta:hasPrior?total-previous:null,pct:hasPrior&&previous>0?100*(total-previous)/previous:null,
    ranked,chart,timeline,nearest,drivers:drivers.sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)||a.id.localeCompare(b.id)).slice(0,5),
    points:featureCollection(selected.map(r=>r.feature)),context:featureCollection(context),density:selected.length/(surface(outline)/1e6),
    regionalShare:regional?100*total/regional:null,topCategories:topCounts(categories),topResidues:topCounts(residues)};
}
