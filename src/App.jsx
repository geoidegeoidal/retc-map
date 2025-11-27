import { useState, useEffect } from 'react';
import MapBoard from '../retc-map/src/components/MapBoard';
import SearchBar from '../retc-map/src/components/SearchBar';
import { analyzeLocation } from '../retc-map/src/utils/analysis';
import { Factory, TrendingUp, TrendingDown, Layers, ChevronLeft, ChevronRight, Download, Image as ImageIcon, FileText } from 'lucide-react';
import HistoryChart from '../retc-map/src/components/HistoryChart';
import SmartReport from '../retc-map/src/components/SmartReport';

// Librerías de exportación
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function App() {
  const [geoData, setGeoData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [targetLocation, setTargetLocation] = useState(null);
  const [radius, setRadius] = useState(3);
  const [lastClickedCoords, setLastClickedCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [highlightedIndustry, setHighlightedIndustry] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetch('/retc_data.geojson')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { setGeoData(data); setLoading(false); })
      .catch(e => { console.error(e); setLoading(false); });
  }, []);

  useEffect(() => {
    if (analysis) setIsPanelOpen(true);
  }, [analysis]);

  const performAnalysis = (coords, selectedRadius) => {
    if (geoData) setAnalysis(analyzeLocation(coords, geoData, selectedRadius));
  };

  const handleMapClick = (coords) => {
    setLastClickedCoords(coords);
    performAnalysis(coords, radius);
  };

  const handleSearchSelect = (coords) => {
    setTargetLocation(coords);
    setLastClickedCoords(coords);
    performAnalysis(coords, radius);
  };

  const handleRadiusChange = (newRadius) => {
    setRadius(newRadius);
    if (lastClickedCoords) performAnalysis(lastClickedCoords, newRadius);
  };

  // 🔴 FUNCIÓN DE EXPORTACIÓN "TÉCNICA DEL DOBLE" (FIX PANTALLA NEGRA)
  const handleExport = async (type) => {
    setIsExporting(true);
    setIsExportMenuOpen(false);

    // 1. Esperar a que la UI se calme
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. TRUCO DE MAGIA: Buscar el canvas del mapa y convertirlo a imagen
    const mapCanvas = document.querySelector('.maplibregl-canvas');
    const mapContainer = document.querySelector('.maplibregl-map');
    let tempImg = null;

    if (mapCanvas && mapContainer) {
      try {
        // Creamos una imagen con los datos exactos del mapa actual
        tempImg = document.createElement('img');
        tempImg.src = mapCanvas.toDataURL(); // Extraemos la foto del WebGL
        
        // Estilos para que calce perfecto encima del mapa
        tempImg.style.position = 'absolute';
        tempImg.style.left = '0';
        tempImg.style.top = '0';
        tempImg.style.width = '100%';
        tempImg.style.height = '100%';
        tempImg.style.zIndex = '0'; // Detrás de los paneles, encima del fondo
        tempImg.style.pointerEvents = 'none';
        
        // La inyectamos en el contenedor del mapa
        mapContainer.appendChild(tempImg);
        
        // Ocultamos el canvas real para que html2canvas capture la imagen y no el canvas vacío
        mapCanvas.style.visibility = 'hidden'; 
      } catch (e) {
        console.warn("No se pudo generar la imagen temporal del mapa:", e);
      }
    }

    // 3. Capturar el contenedor principal
    const element = document.getElementById('main-container');

    if (!element) {
      console.error("No se encontró el contenedor principal");
      setIsExporting(false);
      return;
    }

    try {
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        scale: 2, // Alta resolución
        logging: false,
        ignoreElements: (node) => {
            return (
                node.id === 'export-controls' || 
                node.id === 'export-overlay' ||
                node.classList.contains('no-print')
            );
        }
      });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      if (type === 'png') {
        const link = document.createElement('a');
        link.download = `EcoMap_${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else if (type === 'pdf') {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`EcoMap_${timestamp}.pdf`);
      }
    } catch (err) {
      console.error("Error exportando:", err);
      alert("Error al generar la imagen.");
    } finally {
      // 4. LIMPIEZA: Borrar la imagen temporal y mostrar el mapa real de nuevo
      if (tempImg) tempImg.remove();
      if (mapCanvas) mapCanvas.style.visibility = 'visible';
      
      setIsExporting(false);
    }
  };

  return (
    <div id="main-container" className="relative w-full h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4 md:px-0 no-print">
        <SearchBar onSelectLocation={handleSearchSelect} />
      </div>

      <div id="export-controls" className="absolute top-4 right-4 z-20 flex flex-col items-end">
         <button 
           onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
           className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-lg border border-slate-600 shadow-xl transition-all"
           title="Exportar mapa"
         >
           <Download size={20} />
         </button>

         {isExportMenuOpen && (
           <div className="mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 w-40">
              <button onClick={() => handleExport('png')} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-sm text-left transition-colors text-slate-300 hover:text-white border-b border-slate-800">
                <ImageIcon size={16} className="text-emerald-400" /> <span>Imagen PNG</span>
              </button>
              <button onClick={() => handleExport('pdf')} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-sm text-left transition-colors text-slate-300 hover:text-white">
                <FileText size={16} className="text-rose-400" /> <span>Reporte PDF</span>
              </button>
           </div>
         )}
      </div>

      {isExporting && (
        <div id="export-overlay" className="absolute inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center cursor-wait">
           <div className="animate-spin text-emerald-500 mb-4"><Download size={40}/></div>
           <p className="text-xl font-bold text-white">Generando captura...</p>
           <p className="text-sm text-slate-400 mt-2">Mantén la ventana abierta</p>
        </div>
      )}

      <MapBoard 
        mapData={geoData} 
        onLocationSelect={handleMapClick} 
        flyToLocation={targetLocation} 
        radius={radius}
        highlightedName={highlightedIndustry}
      />

      {loading && <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80"><div className="text-emerald-400 font-bold animate-pulse">Cargando...</div></div>}

      {analysis && (
        <div className={`fixed top-20 bottom-4 left-4 z-20 w-80 transition-transform duration-300 ease-in-out ${isPanelOpen ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]'}`}>
          <button 
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className={`absolute top-0 -right-8 w-8 h-10 bg-slate-800 border-y border-r border-slate-600 text-emerald-400 hover:text-white hover:bg-slate-700 rounded-r-lg shadow-lg flex items-center justify-center transition-opacity duration-300 no-print ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <ChevronLeft size={20} />
          </button>

          <div className="h-full w-full bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl overflow-y-auto overflow-x-hidden flex flex-col">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-4">
                 <div>
                   <h1 className="text-lg font-bold text-white leading-none flex items-center gap-2"><Layers size={18} className="text-emerald-400"/> Análisis Zonal</h1>
                   <p className="text-xs text-slate-400 mt-1">Radio de impacto</p>
                 </div>
                 <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                   {[1, 3, 5].map((r) => (
                     <button key={r} onClick={() => handleRadiusChange(r)} className={`text-xs font-bold px-2 py-1 rounded transition-all ${radius === r ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{r}km</button>
                   ))}
                 </div>
              </div>
              
              <div className="mb-4 flex items-end justify-between">
                  <div>
                    <div className={`flex items-center gap-2 text-xl font-bold ${analysis.stats.trend > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{analysis.stats.trend > 0 ? <TrendingUp size={20}/> : <TrendingDown size={20}/>}{Math.abs(analysis.stats.trend).toFixed(1)}%</div>
                    <p className="text-xs text-slate-500">Variación (5 años)</p>
                  </div>
                  <div className="text-right"><span className="text-3xl font-bold text-white block leading-none">{analysis.stats.count}</span><span className="text-xs text-slate-400">Industrias</span></div>
              </div>

              <div className="mb-4 border-b border-slate-700 pb-6">
                <div className="flex justify-between items-center mb-1"><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Evolución por Industria (Top 5)</p></div>
                <HistoryChart data={analysis.chartData} keys={analysis.lineKeys} onHoverHighlight={setHighlightedIndustry} />
              </div>

              <SmartReport analysis={analysis} />

              {analysis.nearest && (
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-slate-700 p-2 rounded-full mt-1"><Factory size={14} className="text-slate-300" /></div>
                      <div className="w-full">
                        <p className="text-xs text-emerald-400 font-bold uppercase mb-0.5">Referencia</p>
                        <p className="font-semibold text-sm text-white leading-tight">{analysis.nearest.properties.name}</p>
                        <div className="flex justify-between items-center mt-2">
                           <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-300 border border-slate-700">{analysis.nearest.properties.category}</span>
                           <span className="text-xs text-slate-400 font-mono">{analysis.nearest.properties.distance.toFixed(2)} km</span>
                        </div>
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {analysis && !isPanelOpen && (
        <button onClick={() => setIsPanelOpen(true)} className="absolute left-0 top-20 bg-slate-900 border-r border-y border-slate-600 text-emerald-400 p-3 rounded-r-xl shadow-2xl hover:bg-slate-800 hover:text-white transition-all animate-in slide-in-from-left-2 z-20 no-print">
          <ChevronRight size={24} />
        </button>
      )}

    </div>
  );
}

export default App;