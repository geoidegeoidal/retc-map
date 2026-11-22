import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({onSelectLocation}){
  const [query,setQuery]=useState(''),[request,setRequest]=useState(''),[results,setResults]=useState([]),[message,setMessage]=useState('');
  useEffect(()=>{
    if(request.length<5)return;
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      setMessage('Buscando dirección…');
      try{
        const url='https://nominatim.openstreetmap.org/search?'+new URLSearchParams({format:'json',q:request,countrycodes:'cl',addressdetails:'1',limit:'5'});
        const res=await fetch(url,{signal:controller.signal});if(res.ok===false)throw Error();
        const items=await res.json();if(controller.signal.aborted)return;
        setResults(items);setMessage(items.length?'':'No se encontraron direcciones. Prueba otra o usa el escáner.');
      }catch{if(!controller.signal.aborted)setMessage('La búsqueda no está disponible. Puedes usar el escáner del mapa.');}
    },800);
    return()=>{clearTimeout(timer);controller.abort();};
  },[request]);
  function select(item){setRequest('');setQuery(item.display_name);setResults([]);setMessage('');onSelectLocation({lng:Number(item.lon),lat:Number(item.lat)});}
  return <div className="geocoder" onKeyDown={e=>{if(e.key==='Escape'){setRequest('');setResults([]);setMessage('');}}}>
    <label><Search size={16}/><input aria-label="Buscar dirección en Chile" placeholder="Ej: Alameda 1340, Santiago" value={query} onChange={e=>{setQuery(e.target.value);setRequest(e.target.value.trim());setMessage('');setResults([]);}}/></label>
    {message&&<p className="geo-msg" aria-live="polite">{message}</p>}
    {results.length>0&&<ul aria-label="Direcciones encontradas">{results.map((item,i)=><li key={item.place_id||i}><button onClick={()=>select(item)}>{item.address?.road && item.address.road!==item.display_name && <b>{item.address.road} {item.address.house_number||''}</b>}<span>{item.display_name}</span></button></li>)}</ul>}
  </div>;
}
