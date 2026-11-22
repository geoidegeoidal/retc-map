import { bbox, bboxPolygon, toMercator } from '@turf/turf';
import { areas } from '../utils/atlas';

// North-up, deterministic geometry from the analysis, independent of live tiles or camera animation.
export default function Footprint({analysis:a, onPick, onPlant, scan=false}) {
  const [w,s,e,n]=bbox(toMercator(a.outline??bboxPolygon(a.bounds))), scale=Math.min(690/(e-w),320/(n-s));
  const cx=(e+w)/2,cy=(n+s)/2;
  const xy=coord=>{const [x,y]=toMercator(coord);return [410+(x-cx)*scale,210+(cy-y)*scale];};
  const ring=a.outline?.geometry.coordinates.map(r=>r.map((p,i)=>(i?'L':'M')+xy(p).map(Math.round).join(',')).join('')+'Z').join('');
  const pick=event=>{
    if(!onPick||!scan)return;
    const svg=event.currentTarget,pt=svg.createSVGPoint();pt.x=event.clientX;pt.y=event.clientY;
    const local=pt.matrixTransform(svg.getScreenCTM().inverse());
    const mx=cx+(local.x-410)/scale,my=cy-(local.y-210)/scale;
    onPick([mx*180/(Math.PI*6378137),(2*Math.atan(Math.exp(my/6378137))-Math.PI/2)*180/Math.PI]);
  };
  return <svg className="analysis-footprint" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 420" role="img" aria-label={'Mapa analítico: '+a.title+', '+a.year} onClick={pick}>
    <rect width="820" height="420" fill="#e7ebdf"/>
    <g transform={`translate(${410-cx*scale} ${210+cy*scale}) scale(${scale})`}>
      {areas.map(b=><path key={b.key} d={b.path} fill="#e1e7d7" stroke="#a2b19b" strokeWidth={1/scale}/>)}</g>
    {ring&&<path d={ring} fill="#bdcc97" stroke="#42694f" strokeWidth="2"/>}
    {a.points.features.map(f=>{const [x,y]=xy(f.geometry.coordinates);return <circle key={f.properties.id_vu} cx={x} cy={y} r="3.4" fill="#95552f" stroke="#fff4d0" strokeWidth=".6" onClick={onPlant&&!scan?()=>onPlant(f.properties):undefined}/>;})}
    {a.scope==='radius'&&<path d="M404 210h12m-6 -6v12" stroke="#223d31" strokeWidth="2"/>}
  </svg>;
}
