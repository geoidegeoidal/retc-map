import Footprint from './Footprint';
import { number, signed } from '../utils/selection';
function Header({num}){return <header><b>HuellaRETC <em>/ Atlas ambiental</em></b><span>LÁMINA 0{num} / 02</span></header>;}
function Source({a}){return <footer>SINADER / RETC · {a.title} · {a.location} · {a.year} · Tramos: {a.bandsLabel}. Tonelaje declarado; no mide riesgo sanitario.</footer>;}
export default function ReportTemplate({analysis:a}){
  return <>{[1,2].map(i=><article key={i} className="report-page" data-report-page={i}>
    <Header num={i}/><small>OBSERVATORIO DE RESIDUOS NO PELIGROSOS · CHILE</small>
    <h1>{i===1?a.title:'Evolución y establecimientos'}</h1>
    <p>{a.scope==='radius'?'Ámbito radial':'Ámbito comunal'} · {a.location} · Año {a.year} · Tramos: {a.bandsLabel}</p>
    {i===1?<><div className="report-stats"><div><small>TONELADAS DECLARADAS</small><b>{number(a.total,2)} t</b></div><div><small>ESTABLECIMIENTOS</small><b>{number(a.count)}</b></div><div><small>CAMBIO INTERANUAL</small><b>{a.delta===null?'Sin base':signed(a.delta,2)+' t'}</b></div></div>
      <h2>Mapa del análisis</h2><Footprint analysis={a}/><p>Norte arriba. {a.scope==='commune'?'El total usa la comuna declarada; algunas coordenadas pueden caer fuera del encuadre.':'Se incluyen los establecimientos a la distancia elegida del centro.'}</p>
      <h2>Lectura del periodo</h2><p>{summary(a)}</p>
      <h2>Mayores tonelajes · {a.year}</h2><table><tbody>{a.ranked.map((r,i)=><tr key={r.id}><td>{i+1}. {r.name} · {r.id}</td><td>{number(r.now,2)} t</td></tr>)}</tbody></table>{!a.count&&<p>Sin establecimientos con tonelaje positivo en esta selección.</p>}
    </>:<><h2>Serie histórica del mismo ámbito</h2><div className={a.timeline.length>6?'report-bars report-bars-wide':'report-bars'}>{a.timeline.map(t=><div key={t.year}><span>{t.year}</span><i style={{width:39*t.total/Math.max(1,...a.timeline.map(p=>p.total))+'%'}}/><b>{number(t.total,2)} t</b></div>)}</div>
      <h2>¿Qué establecimientos explican el cambio?</h2><p>{a.previous===null?'No hay datos del año anterior.':`Aportes en toneladas frente a ${a.year-1}. Incluye establecimientos que entran o salen del ámbito o de los tramos seleccionados.`}</p>
      <table><tbody>{a.drivers.map(r=><tr key={r.id}><td>{r.name} · {r.id}</td><td>{signed(r.delta,2)} t</td></tr>)}</tbody></table>
      {!a.drivers.length&&a.previous!==null&&<p>No hay diferencias de tonelaje para los tramos elegidos.</p>}
      <h2>Contexto territorial</h2><p>Densidad: {number(a.density,2)} establecimientos/km². {a.regionalShare===null?'Sin referencia regional única.':'Cuota del tonelaje regional, con los mismos filtros: '+number(a.regionalShare,2)+' %.'}</p>
      {a.nearest.length>0&&<p>Más cercano: {a.nearest[0].name} · {number(a.nearest[0].dist,2)} km del centro.</p>}
      <h2>Rubros y residuos declarados</h2><p>Rubros: {a.topCategories.map(([label,n])=>label+' ('+n+')').join('; ')||'Sin datos'}.</p>
      <p>Residuos más frecuentes: {a.topResidues.map(([label,n])=>label+' ('+n+')').join('; ')||'Sin datos'}.</p>
      <p className="report-note">Cada año usa su propia ubicación y tonelaje. No se incluyen sitios sin coordenadas utilizables. Las variaciones dan cuenta de los registros publicados, no necesariamente de cambios físicos.{a.coverage?.flagged>0?' Este año incluye registros que la fuente marcó como atípicos.':''}</p>
    </>}<Source a={a}/></article>)}</>;
}
function summary(a){
  if(a.previous===null)return 'No se dispone de un año anterior para esta comparación.';
  return `En ${a.year} se declararon ${number(a.total,2)} t, frente a ${number(a.previous,2)} t en ${a.year-1}. ${a.pct===null?'Sin base positiva para calcular un porcentaje.':'Variación: '+signed(a.pct)+' %.'}`;
}
