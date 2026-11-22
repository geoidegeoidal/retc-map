import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { featureCollection, lineString } from '@turf/turf';
import { Maximize, Minus, Plus, ScanEye } from 'lucide-react';
import boundaries from '../assets/rm-comunas.json';
import { bands, number } from '../utils/selection';
import Footprint from './Footprint';

const empty=()=>featureCollection([]);
const plantSource=()=>({type:'geojson',data:empty(),cluster:true,clusterMaxZoom:10,clusterRadius:34});
const geo=data=>({type:'geojson',data});
const communeLabels=featureCollection(boundaries.features.map(f=>({
  type:'Feature',properties:{name:f.properties.name},geometry:{type:'Point',coordinates:f.properties.anchor}
})));
const layer=(id,type,source,paint,extra={})=>({id,type,source,paint,...extra});
const individual=['!', ['has','point_count']], grouped=['has','point_count'];
const basemap='atlas-basemap';
function addBasemap(m){
  m.addSource(basemap,{type:'vector',url:'https://tiles.openfreemap.org/planet'});
  for(const [name,type,paint,minzoom] of [
    ['landcover','fill',{'fill-color':'#d8e4cd','fill-opacity':.45},5],
    ['park','fill',{'fill-color':'#d0dfc2','fill-opacity':.52},8],
    ['water','fill',{'fill-color':'#bbd6d6'},0],
    ['waterway','line',{'line-color':'#aacdce','line-width':1.2},9],
    ['building','fill',{'fill-color':'#c9c6b4','fill-opacity':.62},14],
    ['transportation','line',{'line-color':'#fffdf3','line-width':['interpolate',['linear'],['zoom'],7,.45,13,1.6,17,4]},7],
  ])m.addLayer(layer('base-'+name,type,basemap,paint,{'source-layer':name,minzoom}),'land');
  m.addLayer({...layer('base-place','symbol',basemap,{'text-color':'#496053','text-halo-color':'#f9f8ef','text-halo-width':1.35},
    {'source-layer':'place',minzoom:5}),layout:{'text-field':['coalesce',['get','name:es'],['get','name']],
    'text-font':['Noto Sans Regular'],'text-size':['interpolate',['linear'],['zoom'],5,10,13,14]}},'clusters');
}
function baseStyle(){
  return {version:8,glyphs:new URL(import.meta.env.BASE_URL,window.location.href).href+'fonts/{fontstack}/{range}.pbf',
    sources:{limits:geo(boundaries),communes:geo(communeLabels),focus:geo(empty()),plants:plantSource(),outside:plantSource(),links:geo(empty()),origin:geo(empty())},
    layers:[
      {id:'paper',type:'background',paint:{'background-color':'#e4eadb'}},
      layer('land','fill','limits',{'fill-color':'#e1e8d8','fill-opacity':.25}),
      layer('boundaries','line','limits',{'line-color':'#91a389','line-width':1}),
      {...layer('commune-names','symbol','communes',{'text-color':'#3d5649','text-halo-color':'#faf8ec','text-halo-width':1.5},{minzoom:9}),
        layout:{'text-field':['get','name'],'text-font':['Noto Sans Regular'],'text-size':12}},
      layer('scope-fill','fill','focus',{'fill-color':'#9fb676','fill-opacity':.30}),
      layer('scope-line','line','focus',{'line-color':'#386347','line-width':2}),
      layer('other','circle','outside',{'circle-color':'#718274','circle-radius':['case',grouped,5,2],'circle-opacity':.45}),
      layer('connections','line','links',{'line-color':'#286759','line-width':1.8,'line-dasharray':[2,2]}),
      {...layer('distances','symbol','links',{'text-color':'#224638','text-halo-color':'#faf8eb','text-halo-width':1.4}),layout:{'symbol-placement':'line-center','text-field':['get','label'],'text-font':['Noto Sans Regular'],'text-size':11}},
      layer('clusters','circle','plants',{'circle-color':'#345a45','circle-radius':['step',['get','point_count'],12,40,17,150,21],'circle-stroke-color':'#f3ebd1','circle-stroke-width':1.5},{filter:grouped}),
      {...layer('cluster-numbers','symbol','plants',{'text-color':'#fffbea'},{filter:grouped}),layout:{'text-field':['get','point_count_abbreviated'],'text-font':['Noto Sans Regular'],'text-size':11}},
      layer('radius-halo','circle','plants',{'circle-color':'#9c9f51','circle-radius':11,'circle-opacity':0,'circle-blur':.55},{filter:individual}),
      layer('active','circle','plants',{'circle-color':'#a46438','circle-radius':5,'circle-stroke-color':'#fff7df','circle-stroke-width':.9},{filter:individual}),
      layer('target','circle','plants',{'circle-radius':10,'circle-color':'transparent','circle-stroke-width':3,'circle-stroke-color':'#385b46'},{filter:['==',['get','id_vu'],'__none__']}),
      layer('center','circle','origin',{'circle-radius':6,'circle-color':'#214a3c','circle-stroke-width':2,'circle-stroke-color':'#fcf4ce'})
    ]};
}
function applyAnalysis(m,a){
  m.getSource('plants').setData(a.points);m.getSource('outside').setData(a.context);
  m.getSource('focus').setData(a.outline??empty());
  m.setLayoutProperty('commune-names','visibility',a.scope==='explore'?'visible':'none');
  m.getSource('origin').setData(featureCollection(a.scope==='radius'?[{type:'Feature',properties:{},geometry:{type:'Point',coordinates:a.center}}]:[]));
  m.getSource('links').setData(featureCollection(a.nearest.map(r=>lineString([a.center,r.feature.geometry.coordinates],{label:number(r.dist,2)+' km'}))));
  const prop=['to-number',['get','tonnage_'+a.year],0];
  m.setPaintProperty('active','circle-color',['step',prop,bands[0].color,...bands.slice(1).flatMap(b=>[b.min,b.color])]);
  m.setPaintProperty('active','circle-radius',['step',prop,4,30,5,170,6,550,7,1700,9]);
}
function frame(m,b){m.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:Math.min(70,Math.max(24,m.getCanvas().clientWidth*.08)),duration:0,maxZoom:15});}
export default function MapBoard({analysis,scan,onScan,onPick,onCommune,onOpen,highlight}) {
  const container=useRef(null),map=useRef(null),latest=useRef(null),[ready,setReady]=useState(false),[fallback,setFallback]=useState(false),[baseError,setBaseError]=useState(false);
  const free=analysis.scope==='explore';
  const cameraKey=(free?['explore',...(analysis.exploreCenter??[])]:[analysis.scope,analysis.commune,analysis.km,...analysis.center]).join('|');
  const key=cameraKey+'|'+analysis.year+'|'+analysis.bands.join(',');
  useEffect(()=>{latest.current={analysis,scan,onPick,onCommune,onOpen,key};},[analysis,scan,onPick,onCommune,onOpen,key]);
  useEffect(()=>{
    let m;
    try{m=new maplibregl.Map({container:container.current,style:baseStyle(),center:latest.current.analysis.center,zoom:11,maxPitch:0,dragRotate:false,touchPitch:false,attributionControl:false});}
    catch{const id=requestAnimationFrame(()=>setFallback(true));return()=>cancelAnimationFrame(id);}
    map.current=m;m.touchZoomRotate.disableRotation();
    const resize=new ResizeObserver(()=>m.resize());resize.observe(container.current);
    m.on('load',()=>{
      setReady(true);
      addBasemap(m);
    });
    m.on('error',e=>{if(e.sourceId===basemap)setBaseError(true);});
    m.on('sourcedata',e=>{if(e.sourceId===basemap&&e.sourceDataType==='content'&&e.tile?.state==='loaded')setBaseError(false);});
    m.on('click',async e=>{
      if(!m.getLayer('active'))return;
      const cur=latest.current;
      if(cur.scan){cur.onPick([e.lngLat.lng,e.lngLat.lat]);return;}
      const box=[[e.point.x-4,e.point.y-4],[e.point.x+4,e.point.y+4]];
      for(const [id,src] of [['active','plants'],['clusters','plants'],['other','outside']]){
        const feature=m.queryRenderedFeatures(box,{layers:[id]})[0];if(!feature)continue;
        if(feature.properties.cluster){
          try{const zoom=await m.getSource(src).getClusterExpansionZoom(feature.properties.cluster_id);if(map.current===m && latest.current.key===cur.key)m.easeTo({center:feature.geometry.coordinates,zoom:zoom+.1});}catch{/* Cluster replaced while the selection changed. */}
        }else cur.onOpen(String(feature.properties.id_vu),cur.analysis.year,cur.analysis.scope==='explore'?null:src==='plants');return;
      }
      const hit=m.queryRenderedFeatures(e.point,{layers:['land']})[0];
      if(hit&&cur.analysis.scope==='commune')cur.onCommune(hit.properties.name);
    });
    return()=>{resize.disconnect();map.current=null;m.remove();};
  },[]);
  useEffect(()=>{if(ready && map.current)applyAnalysis(map.current,analysis);},[analysis,ready]);
  useEffect(()=>{if(ready&&map.current)frame(map.current,latest.current.analysis.bounds);},[cameraKey,ready]);
  useEffect(()=>{if(ready && map.current)map.current.setFilter('target',['==',['to-string',['get','id_vu']],highlight||'__none__']);},[highlight,ready]);
  useEffect(()=>{if(ready && map.current)map.current.getCanvas().style.cursor=scan?'crosshair':'';},[scan,ready]);
  useEffect(()=>{
    if(!ready||!map.current)return;
    const m=map.current,radial=analysis.scope==='radius';
    m.setPaintProperty('radius-halo','circle-opacity',radial?.22:0);
    if(!radial||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const id=setInterval(()=>{if(!document.hidden)m.setPaintProperty('radius-halo','circle-opacity',.22+.16*Math.sin(performance.now()/600));},220);
    return()=>clearInterval(id);
  },[ready,analysis.scope]);
  useEffect(()=>{
    if(!ready||!map.current||analysis.scope!=='commune')return;
    const region=boundaries.features.find(f=>f.properties.name===analysis.commune);
    const el=document.createElement('span');el.className='district-label';el.textContent=analysis.commune;
    const label=new maplibregl.Marker({element:el}).setLngLat(region.properties.anchor).addTo(map.current);
    return()=>label.remove();
  },[ready,analysis.scope,analysis.commune]);
  return <div className="workmap"><div ref={container} className="glmap" hidden={fallback}/>
    {fallback&&<><Footprint analysis={analysis} scan={scan} onPick={onPick} onPlant={p=>onOpen(String(p.id_vu),analysis.year,free?null:true)}/><small className="map-fallback">Mapa simplificado · sin WebGL</small></>}
    {baseError&&!fallback&&!scan&&<small className="map-fallback" role="status">Mapa base no disponible. Los datos RETC siguen visibles.</small>}
    <div className="map-tools"><button type="button" className={scan?'on':''} aria-pressed={scan} onClick={onScan}><ScanEye size={16}/>{scan?'Cancelar escáner':'Escanear punto'}</button>
      {!fallback&&<div><button aria-label="Acercar mapa" onClick={()=>map.current?.zoomIn()}><Plus size={16}/></button><button aria-label={free?'Encuadrar mapa':'Encuadrar análisis'} onClick={()=>map.current&&frame(map.current,analysis.bounds)}><Maximize size={15}/></button></div>}</div>
    {scan&&<p className="scan-hint" role="status">Pulsa el mapa para centrar el radio de {analysis.km} km.</p>}
    <div className="map-key"><span><i/>{free?'Establecimientos filtrados':'En el análisis'}</span>{!free&&<span><i/>Fuera del ámbito</span>}</div>
    <div className="map-credit"><a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a></div>
  </div>;
}
