import { useEffect, useRef, useState } from 'react';
const steps=[
  ['Explora o delimita','Explorar te permite recorrer Chile sin definir un ámbito. En Comuna puedes analizar una de las 52 comunas metropolitanas y en Radio un entorno de 1, 3 o 5 km. El año y los tramos se mantienen al alternar.'],
  ['Ubica y explora','Busca una dirección o activa Escanear punto y pulsa el mapa. Selecciona un establecimiento para ver su ficha y su historial; los grupos se expanden al pulsarlos.'],
  ['Compara declaraciones','El año y los tramos filtran el mapa, las cifras y los gráficos. Abre una ficha desde Cambios o Generadores, aunque el establecimiento ya no tenga un punto activo en el mapa.'],
  ['Exporta tu análisis','Abre Informe y elige PDF o PNG. Las dos páginas incluyen el año, el ámbito, los tramos y el centro si analizas un radio.']
];
export default function TutorialOverlay({onClose}){
  const [step,setStep]=useState(0),modal=useRef(null);
  useEffect(()=>{const d=modal.current;d.showModal();return()=>d.close();},[]);
  return <dialog ref={modal} className="atlas-dialog" onCancel={onClose} aria-labelledby="tour-title"><small>GUÍA DEL VISOR · {step+1} / 4</small><h2 id="tour-title">{steps[step][0]}</h2><p>{steps[step][1]}</p>
    <div><button onClick={onClose}>Cerrar guía</button><button className="primary" onClick={()=>step===3?onClose():setStep(step+1)}>{step===3?'Finalizar':'Siguiente'}</button></div></dialog>;
}
