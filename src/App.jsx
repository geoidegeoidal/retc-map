import { useState, useEffect, useRef } from 'react';
import MapBoard from './components/MapBoard';
import SearchBar from './components/Searchbar';
import WelcomeModal from './components/WelcomeModal';
import TutorialOverlay from './components/TutorialOverlay';
import ReportTemplate from './components/ReportTemplate';
import { analyzeLocation } from './utils/analysis';
import { Factory, TrendingUp, TrendingDown, Layers, ChevronLeft, ChevronRight, Download, Image as ImageIcon, FileText } from 'lucide-react';
import HistoryChart from './components/HistoryChart';
import SmartReport from './components/SmartReport';
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
  const [showWelcome, setShowWelcome] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [reportMapImage, setReportMapImage] = useState(null);
  const mapBoardRef = useRef(null);

  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL;
    const dataUrl = `${baseUrl}retc_data.geojson`.replace('//', '/');
    fetch(dataUrl).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(data => { setGeoData(data); setLoading(false); }).catch(e => { console.error(e); setLoading(false); });
  }, []);

  useEffect(() => { if (analysis) setIsPanelOpen(true); }, [analysis]);

  const performAnalysis = (coords, selectedRadius) => { if (geoData) setAnalysis(analyzeLocation(coords, geoData, selectedRadius)); };
  const handleMapClick = (coords) => { setLastClickedCoords(coords); performAnalysis(coords, radius); };
  const handleSearchSelect = (coords) => { setTargetLocation(coords); setLastClickedCoords(coords); performAnalysis(coords, radius); };
  const handleRadiusChange = (newRadius) => { setRadius(newRadius); if (lastClickedCoords) performAnalysis(lastClickedCoords, newRadius); };

  const handleStartTutorial = () => { setShowWelcome(false); setShowTutorial(true); };

  const handleExport = async (type) => {
    if (!analysis) { alert("Primero debes realizar un análisis zonal."); return; }
    setIsExporting(true);
    setIsExportMenuOpen(false);

    // 1. Resetear vista del mapa a vertical (pitch=0, bearing=0) para evitar distorsión
    if (mapBoardRef.current?.resetViewForExport) {
      await mapBoardRef.current.resetViewForExport();
    }

    // 1.5 NUEVO: Espera adicional para asegurar que el canvas esté completamente renderizado
    // Crítico para dispositivos móviles más lentos
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2. Capturar imagen del mapa actual
    const mapCanvas = document.querySelector('.maplibregl-canvas');
    if (mapCanvas) {
      setReportMapImage(mapCanvas.toDataURL('image/png'));
    }

    // Esperar a que React renderice el template con la imagen
    await new Promise(resolve => setTimeout(resolve, 600));

    const page1 = document.getElementById('printable-report');
    const page2 = document.getElementById('printable-report-page2');
    if (!page1) { setIsExporting(false); return; }

    try {
      const html2canvasOptions = {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true
      };

      // Capturar página 1
      const canvas1 = await html2canvas(page1, html2canvasOptions);

      // Capturar página 2 (si existe)
      let canvas2 = null;
      if (page2) {
        canvas2 = await html2canvas(page2, html2canvasOptions);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      if (type === 'png') {
        // Descargar 2 archivos PNG separados
        const link1 = document.createElement('a');
        link1.download = `HuellaRETC_Reporte_Pagina1_${timestamp}.png`;
        link1.href = canvas1.toDataURL('image/png');
        link1.click();

        // Pequeña pausa para que el navegador procese la primera descarga
        if (canvas2) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const link2 = document.createElement('a');
          link2.download = `HuellaRETC_Reporte_Pagina2_${timestamp}.png`;
          link2.href = canvas2.toDataURL('image/png');
          link2.click();
        }
      } else if (type === 'pdf') {
        // PDF multipágina en formato vertical (portrait)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas1.width / 2, canvas1.height / 2]
        });

        // Página 1
        pdf.addImage(canvas1.toDataURL('image/png'), 'PNG', 0, 0, canvas1.width / 2, canvas1.height / 2);

        // Página 2 (si existe)
        if (canvas2) {
          pdf.addPage([canvas2.width / 2, canvas2.height / 2], 'portrait');
          pdf.addImage(canvas2.toDataURL('image/png'), 'PNG', 0, 0, canvas2.width / 2, canvas2.height / 2);
        }

        pdf.save(`HuellaRETC_Reporte_${timestamp}.pdf`);
      }
    } catch (err) {
      console.error(err);
      alert("Error al generar el reporte.");
    } finally {
      // Restaurar vista original del mapa
      if (mapBoardRef.current?.restoreView) {
        mapBoardRef.current.restoreView();
      }
      setReportMapImage(null);
      setIsExporting(false);
    }
  };

  return (
    <div id="main-container" className="relative w-full h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">

      <WelcomeModal isOpen={showWelcome} onClose={() => setShowWelcome(false)} onStartTutorial={handleStartTutorial} />

      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}

      {/* Plantilla oculta para generación de reportes */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <ReportTemplate
          id="printable-report"
          analysis={analysis}
          mapSnapshot={reportMapImage}
        />
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[85%] max-w-sm md:px-0 no-print">
        <SearchBar onSelectLocation={handleSearchSelect} />
      </div>

      <div id="export-controls" className="absolute top-4 right-4 z-20 flex flex-col items-end">
        <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2.5 rounded-lg border border-slate-600 shadow-xl transition-all"><Download size={20} /></button>
        {isExportMenuOpen && (
          <div className="mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 w-40">
            <button onClick={() => handleExport('png')} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-sm text-left text-slate-300 hover:text-white border-b border-slate-800"><ImageIcon size={16} className="text-emerald-400" /> <span>Imagen PNG</span></button>
            <button onClick={() => handleExport('pdf')} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-sm text-left text-slate-300 hover:text-white"><FileText size={16} className="text-rose-400" /> <span>Reporte PDF</span></button>
          </div>
        )}
      </div>

      {isExporting && <div id="export-overlay" className="absolute inset-0 z-[60] bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center cursor-wait"><div className="animate-spin text-emerald-500 mb-4"><Download size={40} /></div><p className="text-xl font-bold text-white">Generando captura...</p></div>}

      <MapBoard
        ref={mapBoardRef}
        mapData={geoData}
        onLocationSelect={handleMapClick}
        flyToLocation={targetLocation}
        radius={radius}
        highlightedName={highlightedIndustry}
        highlightedIds={analysis?.topIds}
      />

      {loading && <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80"><div className="text-emerald-400 font-bold animate-pulse">Cargando...</div></div>}

      {analysis && (
        <div className={`
            fixed z-30 transition-transform duration-300 ease-in-out shadow-2xl border-slate-700 bg-slate-900/95 backdrop-blur-md
            bottom-0 left-0 right-0 w-full rounded-t-2xl border-t border-x max-h-[45vh] flex flex-col
            md:top-20 md:bottom-6 md:left-4 md:right-auto md:w-80 md:max-h-[85vh] md:rounded-2xl md:border
            ${isPanelOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-[100%] md:-translate-x-[calc(100%+2rem)]'}
        `}>
          <div onClick={() => setIsPanelOpen(!isPanelOpen)} className="md:hidden w-full h-6 flex items-center justify-center cursor-pointer border-b border-white/5 active:bg-white/5 shrink-0 hover:bg-white/5 transition-colors">
            <div className="w-12 h-1 bg-slate-600 rounded-full"></div>
          </div>

          <button onClick={() => setIsPanelOpen(!isPanelOpen)} className={`hidden md:flex absolute top-6 -right-8 w-8 h-10 bg-slate-800 border-y border-r border-slate-600 text-emerald-400 hover:text-white hover:bg-slate-700 rounded-r-lg shadow-lg items-center justify-center transition-opacity duration-300 no-print ${isPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <ChevronLeft size={20} />
          </button>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-5 pb-0 shrink-0">
              <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-4">
                <div><h1 className="text-lg font-bold text-white leading-none flex items-center gap-2"><Layers size={18} className="text-emerald-400" /> Análisis Zonal</h1><p className="text-xs text-slate-400 mt-1">Radio de impacto</p></div>
                <div className="flex bg-slate-800 rounded-lg p-1 gap-1">
                  {[1, 3, 5].map((r) => (<button key={r} onClick={() => handleRadiusChange(r)} className={`text-xs font-bold px-2 py-1 rounded transition-all ${radius === r ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>{r}km</button>))}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-5 pt-0 pb-10">
              <div className="mb-4 flex items-end justify-between mt-2">
                <div><div className={`flex items-center gap-2 text-xl font-bold ${analysis.stats.trend > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{analysis.stats.trend > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}{Math.abs(analysis.stats.trend).toFixed(1)}%</div><p className="text-xs text-slate-500">Variación (5 años)</p></div>
                <div className="text-right"><span className="text-3xl font-bold text-white block leading-none">{analysis.stats.count}</span><span className="text-xs text-slate-400">Industrias</span></div>
              </div>

              <div className="mb-4 border-b border-slate-700 pb-6">
                <div className="flex justify-between items-center mb-1"><p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Evolución por Industria (Top 5)</p></div>
                <HistoryChart data={analysis.chartData} keys={analysis.lineKeys} onHoverHighlight={setHighlightedIndustry} />
              </div>

              <SmartReport analysis={analysis} />

              {analysis.nearest && (
                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 mt-4 mb-2">
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-700 p-2 rounded-full mt-1 shrink-0"><Factory size={14} className="text-slate-300" /></div>
                    <div className="w-full min-w-0">
                      <p className="font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-1">Referencia más cercana</p>
                      {/* Nombre completo sin truncar, con word-break si es necesario */}
                      <p className="font-bold text-sm text-white leading-snug break-words mb-1.5">{analysis.nearest.properties.name}</p>

                      <div className="flex flex-wrap gap-2 items-center justify-between">
                        <span className="text-[10px] bg-cyan-900/30 px-2 py-0.5 rounded text-cyan-400 border border-cyan-800/50 font-bold tracking-wide">
                          {analysis.nearest.properties.category}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-400">Total 4 años: <strong className="text-emerald-400">{analysis.nearest.properties.total_tonnage?.toLocaleString('es-CL', { maximumFractionDigits: 0 })} t</strong></span>
                          <span className="text-xs text-slate-300 font-mono font-bold">{analysis.nearest.properties.distance.toFixed(2)} km</span>
                        </div>
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
        <button onClick={() => setIsPanelOpen(true)} className="absolute left-0 top-20 md:top-20 bg-slate-900 border-r border-y border-slate-600 text-emerald-400 p-3 rounded-r-xl shadow-2xl hover:bg-slate-800 hover:text-white transition-all animate-in slide-in-from-left-2 z-20 no-print"><ChevronRight size={24} /></button>
      )}
    </div>
  );
}

export default App;