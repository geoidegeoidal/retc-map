import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowUpRight, BookOpen, Compass, Download, Layers, MapPin, SlidersHorizontal } from 'lucide-react';
import MapBoard from './MapBoard';
import SearchBar from './Searchbar';
import HistoryChart from './HistoryChart';
import TutorialOverlay from './TutorialOverlay';
import ReportTemplate from './ReportTemplate';
import MiniChart from './MiniChart';
import { analyzeSelection, bands, communes, dataYears, establishmentDetail, exploreMap, initialSelection, number, signed } from '../utils/selection';
import './atlas.css';

function ExportDialog({analysis:a,onClose}){
  const modal=useRef(null),pages=useRef(null),[job,setJob]=useState(null),[error,setError]=useState('');
  useEffect(()=>{const d=modal.current;d.showModal();return()=>d.close();},[]);
  async function download(type){
    // Freeze one analysis before the first await. Report geometry never waits for external map tiles.
    const snapshot=a;flushSync(()=>{setJob(snapshot);setError('');});
    try{
      const [{default:capture},{default:PDF}]=await Promise.all([import('html2canvas'),import('jspdf')]);
      await document.fonts.ready;
      const name='HuellaRETC_'+(snapshot.scope==='radius'?'radio-'+snapshot.km+'km_'+snapshot.center.map(x=>x.toFixed(4)).join('_'):snapshot.commune)+'_'+snapshot.year;
      const pdf=type==='pdf'?new PDF({unit:'mm',format:'a4',compress:true}):null;
      for(const [i,page] of Array.from(pages.current.children).entries()){
        const canvas=await capture(page,{scale:1.6,backgroundColor:'#fffdf3',logging:false,windowWidth:1250});
        if(pdf){if(i)pdf.addPage();pdf.addImage(canvas,'PNG',0,0,210,297,undefined,'FAST');}
        else{const link=document.createElement('a');link.download=name+'_p'+(i+1)+'.png';link.href=canvas.toDataURL('image/png');link.click();}
      }
      if(pdf)pdf.save(name+'.pdf');onClose();
    }catch{setError('No se pudo generar el informe. Tu análisis se conserva; puedes volver a intentarlo.');}
    finally{setJob(null);}
  }
  return <dialog ref={modal} className="atlas-dialog" onCancel={e=>{if(job)e.preventDefault();else onClose();}} aria-labelledby="report-title">
    <small>INFORME TERRITORIAL · DOS PÁGINAS</small><h2 id="report-title">{a.title} · {a.year}</h2><p>{a.location}<br/>Tramos: {a.bandsLabel}</p>
    <p><b>{number(a.total,2)} t</b> · {a.count} establecimientos. El informe incluye el mapa del ámbito, la serie y los principales cambios.</p>
    <div><button disabled={!!job} onClick={onClose}>Cerrar</button><button disabled={!!job} onClick={()=>download('png')}>2 imágenes PNG</button><button className="primary" disabled={!!job} onClick={()=>download('pdf')}>Descargar PDF</button></div>
    {job&&<p role="status">Preparando las dos páginas…</p>}{error&&<p role="alert">{error}</p>}
    {job&&<div ref={pages} aria-hidden="true" className="report-render"><ReportTemplate analysis={job}/></div>}
  </dialog>;
}
function EstablishmentDialog({detail:d, selectionYear, included, onClose}){
  const modal=useRef(null), closingButton=useRef(null);
  useEffect(()=>{const node=modal.current;node.showModal();closingButton.current.focus({preventScroll:true});return()=>node.close();},[]);
  return <dialog ref={modal} className="atlas-dialog establishment-dialog" onCancel={e=>{e.preventDefault();onClose();}} aria-labelledby="site-title">
    <small>FICHA SINADER · ID {d.id}</small><h2 id="site-title">{d.name}</h2>
    <p>{d.place.comuna}, {d.place.region}{d.category?' · '+d.category:''}</p>
    <p className="site-status">{included===null?'Exploración libre · '+selectionYear:(included?'Incluido':'No incluido')+' en el análisis de '+selectionYear}</p>
    {d.year!==selectionYear&&<p>Mostrando el registro de {d.year}, cuando sí aportó al ámbito y a los tramos seleccionados.</p>}
    <p><b>{d.tonnes===null?'Sin registro':number(d.tonnes,2)+' t'}</b> · {d.year}</p>
    {d.residues&&<details><summary>Tipos de residuos · {d.year}</summary><p>{d.residues}</p></details>}
    {d.history.length>0&&<><MiniChart history={d.history} color="#43775d"/><details><summary>Historial en tabla</summary><dl>{d.history.map(({year,value})=><div key={year}><dt>{year}</dt><dd>{number(value,2)} t</dd></div>)}</dl></details></>}
    <div><button onClick={onClose} ref={closingButton}>Cerrar</button></div>
  </dialog>;
}
function ResultRow({r,i,value,onHighlight,onOpen}){
  return <button type="button" className="result-row result-link" aria-label={'Ficha de '+r.name}
    aria-description={value+' toneladas'} onMouseEnter={()=>onHighlight(r.id)} onMouseLeave={()=>onHighlight(null)}
    onFocus={()=>onHighlight(r.id)} onBlur={()=>onHighlight(null)} onClick={e=>onOpen(r.id,r.displayYear,r.now>0,e.currentTarget)}>
    <span>{i!=null?i+1+'. ':''}{r.name} <small>· {r.id}</small></span><b>{value} t</b><ArrowUpRight size={15} aria-hidden="true"/>
  </button>;
}
function Findings({a,onHighlight,onOpen}){
  const [section,setSection]=useState('Cambios');
  const opts=['Cambios','Generadores','Evolución','Contexto'];
  return <section className="findings" aria-label="Resultados del análisis">
    <div className="find-head"><div><small>CUADERNO DE DATOS</small><h2>Lectura del territorio</h2></div><span>{a.year} / {a.title}</span></div>
    <nav aria-label="Detalle del análisis">{opts.map(o=><button key={o} aria-pressed={section===o} onClick={()=>{setSection(o);onHighlight(null);}}>{o}</button>)}</nav>
    {section==='Cambios'&&<><h3>¿Qué establecimientos explican el cambio?</h3>
      <p>{a.previous===null?'No hay datos del año anterior.':'Mayores variaciones en toneladas frente a '+(a.year-1)+', incluidas entradas y salidas del ámbito o del tramo.'}</p>
      {a.drivers.map(r=><ResultRow key={r.id} r={r} value={signed(r.delta,2)} onHighlight={onHighlight} onOpen={onOpen}/>)}
      {a.previous!==null&&!a.drivers.length&&<p>Sin variaciones para esta selección.</p>}</>}
    {section==='Generadores'&&<><h3>Mayores tonelajes de {a.year}</h3>{a.ranked.length?a.ranked.map((r,i)=><ResultRow key={r.id} r={r} i={i} value={number(r.now,2)} onHighlight={onHighlight} onOpen={onOpen}/>):<p>Sin establecimientos con tonelaje positivo.</p>}</>}
    {section==='Evolución'&&<><h3>Historia de los principales generadores de {a.year}</h3><p>Toneladas · {a.years[0]}–{a.years.at(-1)}. Los mismos tramos se aplican a cada año.</p>
      <HistoryChart data={a.chart} keys={a.ranked.map(r=>'e'+r.id)} labels={Object.fromEntries(a.ranked.map(r=>['e'+r.id,r.name]))} onHoverHighlight={key=>onHighlight(key?.slice(1)||null)}/>
      <details><summary>Ver totales anuales del ámbito</summary>{a.timeline.map(t=><div key={t.year} className="result-row"><span>{t.year}</span><b>{number(t.total,2)} t</b></div>)}</details></>}
    {section==='Contexto'&&<><h3>Contexto del ámbito</h3><p>{number(a.density,2)} establecimientos con tonelaje positivo por km². {a.regionalShare!==null?number(a.regionalShare,2)+' % del volumen regional con esos tramos.':'Sin referencia regional única para esta selección.'}</p>
      {a.nearest[0]&&<p><b>Más cercano al centro:</b> {a.nearest[0].name} · {number(a.nearest[0].dist,2)} km.</p>}
      <h3>Rubros y residuos más frecuentes</h3><p>{a.topCategories.map(([v,n])=>v+' ('+n+')').join(' · ')||'Sin datos de rubro.'}</p><p>{a.topResidues.map(([v,n])=>v+' ('+n+')').join(' · ')||'Sin datos de residuos.'}</p>
      {a.coverage&&<p>Los sitios sin coordenadas utilizables quedan fuera del mapa y los totales.{a.coverage.flagged>0?' La fuente marcó '+number(a.coverage.flagged)+' filas atípicas a nivel nacional; no se excluyeron por esa marca.':''}</p>}</>}
  </section>;
}
export default function AtlasShell({geoData,loading,retry}){
  const [selection,setS]=useState({...initialSelection,scope:'explore',year:null}),[scan,setScan]=useState(false),[guide,setGuide]=useState(false),[report,setReport]=useState(false),[highlight,setHighlight]=useState(null),[site,setSite]=useState(null);
  const a=useMemo(()=>{
    if(!geoData)return null;
    const query={...selection,year:selection.year??dataYears(geoData).at(-1)};
    return query.scope==='explore'?exploreMap(geoData,query):analyzeSelection(geoData,query);
  },[geoData,selection]);
  const years=dataYears(geoData), year=a?.year, s={...selection,year};
  const free=s.scope==='explore', scoped=a&&!free;
  const siteTrigger=useRef(null);
  function openSite(id,recordYear,included,trigger=document.activeElement){
    const feature=geoData.features.find(f=>String(f.properties.id_vu)===id);
    if(feature){siteTrigger.current=trigger;setSite({detail:establishmentDetail(feature,recordYear,years),included});}
  }
  function closeSite(){
    flushSync(()=>setSite(null));
    if(siteTrigger.current?.isConnected)siteTrigger.current.focus({preventScroll:true});
  }
  const change=patch=>{setHighlight(null);setS(old=>({...old,...patch}));};
  const commune=name=>{const f=communes.find(c=>c.properties.name===name);if(f){setScan(false);change({scope:'commune',commune:name,center:f.properties.anchor});}};
  const pick=coords=>{setScan(false);change({scope:'radius',center:coords});};
  const search=p=>{
    if(free){setScan(false);change({exploreCenter:[p.lng,p.lat]});}
    else pick([p.lng,p.lat]);
  };
  const [mobileControls,setMobileControls]=useState(false);
  return <div className="ua">
    <header className="masthead"><div className="brand"><img src={import.meta.env.BASE_URL+'huella.svg'} alt=""/><strong>Huella<span>RETC</span></strong><i/> <span className="brand-edition">Atlas ambiental</span></div>
      <div className="head-actions"><button onClick={()=>setGuide(true)}><BookOpen size={16}/>Guía</button><button className="primary" disabled={!scoped} title={free?'Elige Comuna o Radio para generar un informe':undefined} onClick={()=>setReport(true)}><Download size={16}/>Informe</button></div></header>
    <div className="mobile-bar"><button aria-expanded={mobileControls} aria-controls="analysis-controls" onClick={()=>setMobileControls(v=>!v)}><SlidersHorizontal size={15}/> Controles</button><span>{scoped?number(a.total)+' t · '+a.count+' establecimientos':a?'Exploración libre · '+year:'SINADER / RETC'}</span></div>
    <main className="workspace"><aside id="analysis-controls" className={'controls '+(mobileControls?'open':'')}><small className="kicker"><i/> OBSERVATORIO CIUDADANO</small><h1>Atlas <em>ambiental.</em></h1><p className="intro">Residuos industriales no peligrosos declarados en Chile.</p>
      <fieldset className="map-mode"><legend>Modo del visor</legend><div className="segments">{[['explore','Explorar'],['commune','Comuna'],['radius','Radio']].map(([val,label])=><button aria-pressed={s.scope===val} key={val} onClick={()=>{setScan(false);if(s.scope!==val)change({scope:val});}}>{label}</button>)}</div></fieldset>
      {s.scope==='commune'?<label className="field">Comuna <span>Región Metropolitana</span><select aria-label="Comuna" value={s.commune} onChange={e=>commune(e.target.value)}>{communes.map(f=><option key={f.properties.name}>{f.properties.name}</option>)}</select></label>:
        s.scope==='radius'&&<fieldset><legend>Distancia desde el centro</legend><div className="segments">{[1,3,5].map(k=><button key={k} aria-pressed={s.km===k} onClick={()=>change({km:k})}>{k} km</button>)}</div><p className="coord"><MapPin size={12}/>{s.center[1].toFixed(4)}°, {s.center[0].toFixed(4)}°</p></fieldset>}
      <label className="field">Año de declaración<select disabled={!a} value={year??''} onChange={e=>change({year:Number(e.target.value)})}>{a?years.slice().reverse().map(y=><option key={y}>{y}</option>):<option value="">Sin datos</option>}</select></label>
      <details className="filter-box"><summary><SlidersHorizontal size={15}/>Tramos de tonelaje <span>{s.bands.length}/5</span></summary><div>{bands.map((b,i)=><label key={i}><input type="checkbox" checked={s.bands.includes(i)} onChange={()=>change({bands:s.bands.includes(i)?s.bands.filter(v=>v!==i):[...s.bands,i].sort()})}/><i style={{background:b.color}}/>{b.label} t</label>)}</div></details>
      <div className="volume" role="status">{scoped?<><small>VOLUMEN DECLARADO · {s.year}</small><strong>{number(a.total)} <em>t</em></strong><p>{number(a.count)} {a.count===1?'establecimiento':'establecimientos'} con tonelaje positivo</p></>:a?<p>Muévete por el mapa y abre fichas sin delimitar un territorio. Para ver totales o exportar, elige Comuna o Radio.</p>:loading?'Cargando declaraciones…':<>No se pudieron cargar los datos. <button onClick={retry}>Reintentar</button></>}</div>
      {scoped&&<div className="change-note"><b>{a.delta===null?'Primer año disponible':signed(a.delta,2)+' t'}</b><span>{a.delta===null?' Sin comparación anterior.':' frente a '+(s.year-1)+(a.pct===null?' · sin base porcentual':' · '+signed(a.pct)+' %')}</span></div>}
      <p className="scope-note">El tonelaje no mide toxicidad, exposición ni riesgo para la salud.</p></aside>
      <div className={'map-column'+(free?' is-exploring':'')}><div className="map-heading"><div><small><Compass size={13}/> CARTOGRAFÍA TERRITORIAL</small><h2>{a?.title||'Atlas ambiental'} {a&&<em>/ {s.year}</em>}</h2></div>
        <div className="address"><SearchBar onSelectLocation={search}/></div></div>
        {a?<><MapBoard analysis={a} scan={scan} onScan={()=>setScan(v=>!v)} onPick={pick} onCommune={commune} highlight={highlight} onOpen={openSite}/>
        <div className="map-detail"><span><Layers size={14}/>{free?'Chile · sin ámbito seleccionado':a.location}</span><span>{free?'Tramos visibles: '+s.bands.length+'/5':'Tramos: '+a.bandsLabel}</span></div>
        {scoped&&<Findings a={a} onHighlight={setHighlight} onOpen={openSite}/>}</>:<div className="wait-map">{loading?'Preparando cartografía…':'Cartografía sin datos.'}</div>}
        <footer className="foot"><span>Fuente: <a href="https://datosretc.mma.gob.cl/dataset/residuos" target="_blank" rel="noreferrer">SINADER / RETC</a>{a?' · '+years[0]+'–'+years.at(-1):''}</span><a href="https://github.com/caracena/chile-geojson/blob/master/13.geojson" target="_blank" rel="noreferrer">Límites comunales</a></footer></div>
    </main>{site&&<EstablishmentDialog {...site} selectionYear={year} onClose={closeSite}/>}
    {guide&&<TutorialOverlay onClose={()=>setGuide(false)}/>} {report&&scoped&&<ExportDialog analysis={a} onClose={()=>setReport(false)}/>}
  </div>;
}
