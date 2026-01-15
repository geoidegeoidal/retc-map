import React from 'react';
import { X, MapPin, BarChart3, Filter, Calendar, MousePointer2, Download } from 'lucide-react';

export default function WelcomeModal({ isOpen, onClose, onStartTutorial }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="relative p-6 pb-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-violet-500/10">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-white mb-1">🌍 EcoMap Chile</h1>
                    <p className="text-sm text-slate-400">Mapa de Generadores Industriales de Residuos</p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                    {/* Contexto */}
                    <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                        <p className="text-sm text-slate-300 leading-relaxed">
                            Visualiza <span className="text-cyan-400 font-bold">11,444 establecimientos industriales</span> que
                            generan residuos no peligrosos en Chile, con datos oficiales del
                            <span className="text-cyan-400 font-bold"> RETC (Registro de Emisiones y Transferencia de Contaminantes) (2021-2024)</span>.
                        </p>
                    </div>

                    {/* Funcionalidades */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Funcionalidades</h2>

                        <div className="flex gap-3 items-start">
                            <div className="p-2 bg-violet-500/20 rounded-lg shrink-0">
                                <Calendar size={16} className="text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Selector de Año</p>
                                <p className="text-xs text-slate-400">Cambia entre 2021-2024 para ver la evolución temporal de cada establecimiento.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start">
                            <div className="p-2 bg-fuchsia-500/20 rounded-lg shrink-0">
                                <Filter size={16} className="text-fuchsia-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Filtro por Tonelaje</p>
                                <p className="text-xs text-slate-400">Filtra los puntos según rangos de toneladas generadas.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start">
                            <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0">
                                <MousePointer2 size={16} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Modo Análisis</p>
                                <p className="text-xs text-slate-400">Activa el botón de escaneo y haz clic en el mapa para analizar industrias cercanas.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start">
                            <div className="p-2 bg-orange-500/20 rounded-lg shrink-0">
                                <MapPin size={16} className="text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Búsqueda de Dirección</p>
                                <p className="text-xs text-slate-400">Busca cualquier dirección en Chile para centrar el mapa.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start">
                            <div className="p-2 bg-rose-500/20 rounded-lg shrink-0">
                                <BarChart3 size={16} className="text-rose-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Gráficos Históricos</p>
                                <p className="text-xs text-slate-400">Visualiza la tendencia del Top 5 industrias en el área seleccionada.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start">
                            <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                                <Download size={16} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">Exportar</p>
                                <p className="text-xs text-slate-400">Descarga el mapa como imagen PNG o documento PDF.</p>
                            </div>
                        </div>
                    </div>

                    {/* Leyenda rápida */}
                    <div className="bg-slate-800/50 rounded-xl p-4">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">Colores de los puntos</p>
                        <div className="flex flex-wrap gap-3 text-[10px]">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> &lt;30 ton</span>
                            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span> 30-170</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-fuchsia-500"></span> 170-550</span>
                            <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded-full bg-orange-500"></span> 550-1.7k</span>
                            <span className="flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-red-600"></span> &gt;1.7k</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-slate-950/50 flex flex-col gap-3">
                    <button
                        onClick={onStartTutorial}
                        className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-white font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">🎓</span> Ver Tutorial Rápido
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full py-2 text-slate-400 hover:text-white font-semibold text-sm transition-colors"
                    >
                        Saltar y explorar el mapa
                    </button>
                </div>
            </div>
        </div>
    );
}
