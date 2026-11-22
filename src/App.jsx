import { useEffect, useState } from 'react';
import AtlasShell from './components/AtlasShell';

export default function App(){
  const [data,setData]=useState(null),[error,setError]=useState(false),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    fetch(import.meta.env.BASE_URL+'retc_data.geojson',{signal:controller.signal})
      .then(r=>{if(!r.ok)throw Error('GeoJSON no disponible');return r.json();})
      .then(d=>{if(!Array.isArray(d.features))throw Error('GeoJSON no válido');if(!controller.signal.aborted)setData(d);})
      .catch(()=>{if(!controller.signal.aborted)setError(true);});
    return()=>controller.abort();
  },[attempt]);
  return <AtlasShell geoData={data} loading={!data&&!error} retry={()=>{setError(false);setAttempt(v=>v+1);}}/>;
}
