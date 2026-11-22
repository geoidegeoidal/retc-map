import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import AtlasShell from './AtlasShell';
import ReportTemplate from './ReportTemplate';
import { analyzeSelection, initialSelection } from '../utils/selection';
vi.mock('./MapBoard',()=>({default:({analysis:a,onPick})=><button onClick={()=>onPick([-70.72,-33.40])}>Escanear punto: {a.title} · {a.year}</button>}));
vi.mock('./Searchbar',()=>({default:({onSelectLocation})=><button onClick={()=>onSelectLocation({lng:-73.05,lat:-36.83})}>Dirección de prueba</button>}));
HTMLDialogElement.prototype.showModal=function(){this.open=true;};HTMLDialogElement.prototype.close=function(){this.open=false;};
const plant=(id,comuna,region,now)=>({type:'Feature',geometry:{type:'Point',coordinates:[-70.72,-33.4]},
  properties:{id_vu:id,name:id,comuna,region,tonnage_2024:now,tonnage_2023:2*now,tonnage_2022:now}});
const data={features:[plant('A','Renca','Metropolitana de Santiago',100),plant('B','Quilicura','Metropolitana de Santiago',21)]};
it('uses a single viewer and keeps the year and filters from commune to radius, search/scan and back',()=>{
  render(<AtlasShell geoData={data}/>);
  fireEvent.click(screen.getByRole('button',{name:'Comuna'}));
  expect(screen.queryByRole('button',{name:'Visor avanzado'})).not.toBeInTheDocument();
  const year=screen.getByRole('combobox',{name:'Año de declaración'});fireEvent.change(year,{target:{value:'2023'}});
  expect(screen.getByRole('status')).toHaveTextContent('200 t');fireEvent.click(screen.getByText(/Escanear punto:/));
  expect(year).toHaveValue('2023');expect(screen.getByRole('status')).toHaveTextContent('242 t');
  fireEvent.click(screen.getByRole('button',{name:'1 km'}));expect(screen.getByText('Escanear punto: Radio de 1 km · 2023')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Informe'}));const modal=screen.getByRole('dialog');
  expect(modal).toHaveTextContent('Radio de 1 km · 2023');expect(modal).toHaveTextContent('242 t');fireEvent.click(within(modal).getByText('Cerrar'));
  fireEvent.click(screen.getByRole('button',{name:'Comuna'}));expect(year).toHaveValue('2023');
  fireEvent.change(screen.getByLabelText('Comuna',{selector:'select'}),{target:{value:'Quilicura'}});
  expect(screen.getByRole('status')).toHaveTextContent('42 t');expect(screen.getByText('Escanear punto: Quilicura · 2023')).toBeInTheDocument();
});
it('renders both report pages from the same year, geography, bands and full total rather than a top-five sum',()=>{
  const many={features:Array.from({length:9},(_,i)=>plant('P'+i,'Renca','Metropolitana de Santiago',90))};
  const a=analyzeSelection(many,{...initialSelection,year:2023,bands:[2]});
  const {container}=render(<ReportTemplate analysis={a}/>);
  const pages=[...container.querySelectorAll('[data-report-page]')];expect(pages).toHaveLength(2);
  for(const page of pages){expect(page).toHaveTextContent('Renca');expect(page).toHaveTextContent('2023');expect(page).toHaveTextContent('170–<550');}
  expect(pages[0]).toHaveTextContent('1.620 t');expect(pages[0]).toHaveTextContent('ESTABLECIMIENTOS9');expect(pages[1]).toHaveTextContent('2022');
});
it('distinguishes a load error from a real zero and allows retry',()=>{
 const retry=vi.fn();const {rerender}=render(<AtlasShell geoData={null} loading retry={retry}/>);
 expect(screen.getByRole('status')).toHaveTextContent(/Cargando/);rerender(<AtlasShell geoData={null} loading={false} retry={retry}/>);
 fireEvent.click(screen.getByText('Reintentar'));expect(retry).toHaveBeenCalledOnce();expect(screen.getByRole('button',{name:'Informe'})).toBeDisabled();
});
it('opens the same detail from changes and generators, including a prior-year-only contributor',()=>{
 const exit=plant('Planta Salida','Renca','Metropolitana de Santiago',0);
 exit.properties.tonnage_2023=300;
 render(<AtlasShell geoData={{features:[...data.features,exit]}}/>);
 fireEvent.click(screen.getByRole('button',{name:'Comuna'}));
 const trigger=screen.getByRole('button',{name:/Ficha de Planta Salida/});
 fireEvent.click(trigger);
 let dialog=screen.getByRole('dialog');
 expect(dialog).toHaveTextContent('No incluido en el análisis de 2024');
 expect(dialog).toHaveTextContent('300 t');
 fireEvent.click(within(dialog).getByRole('button',{name:'Cerrar'}));
 expect(trigger).toHaveFocus();
 fireEvent.click(screen.getByRole('button',{name:'Generadores'}));
 fireEvent.click(screen.getByRole('button',{name:'Ficha de A'}));
 dialog=screen.getByRole('dialog');
 expect(dialog).toHaveTextContent('Incluido en el análisis de 2024');
});
it('opens in free exploration without manufacturing totals or requiring a commune',()=>{
 render(<AtlasShell geoData={data}/>);
 expect(screen.getByRole('button',{name:'Explorar'})).toHaveAttribute('aria-pressed','true');
 expect(screen.queryByRole('combobox',{name:'Comuna'})).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:'Informe'})).toBeDisabled();
 expect(screen.getByText('Escanear punto: Exploración libre · 2024')).toBeInTheDocument();
 fireEvent.click(screen.getByRole('button',{name:'Dirección de prueba'}));
 expect(screen.getByRole('button',{name:'Explorar'})).toHaveAttribute('aria-pressed','true');
 const year=screen.getByRole('combobox',{name:'Año de declaración'});
 fireEvent.change(year,{target:{value:'2023'}});
 fireEvent.click(screen.getByRole('button',{name:'Comuna'}));
 expect(screen.getByRole('button',{name:'Informe'})).toBeEnabled();
 fireEvent.change(screen.getByRole('combobox',{name:'Comuna'}),{target:{value:'Quilicura'}});
 fireEvent.click(screen.getByRole('button',{name:'Explorar'}));
 expect(year).toHaveValue('2023');
 expect(screen.getByRole('button',{name:'Informe'})).toBeDisabled();
 fireEvent.click(screen.getByRole('button',{name:'Comuna'}));
 expect(screen.getByRole('combobox',{name:'Comuna'})).toHaveValue('Quilicura');
});
it('starts on the newest published year, with every year selectable and stable across scope changes',()=>{
 const years=Array.from({length:12},(_,i)=>2014+i);
 render(<AtlasShell geoData={{...data,years}}/>);
 const selector=screen.getByRole('combobox',{name:'Año de declaración'});
 expect(selector).toHaveValue('2025');expect(within(selector).getAllByRole('option')).toHaveLength(12);
 fireEvent.change(selector,{target:{value:'2014'}});
 fireEvent.click(screen.getByRole('button',{name:'Radio'}));expect(selector).toHaveValue('2014');
});
