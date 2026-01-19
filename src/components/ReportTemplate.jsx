import React from 'react';
import { Layers, MapPin, Calendar, Database, TrendingUp, TrendingDown } from 'lucide-react';

export default function ReportTemplate({ id, analysis, mapSnapshot }) {
    if (!analysis) return null;

    const date = new Date().toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const { stats, topIds, chartData } = analysis;
    // ChartData structure: [{year: '2021', 'Empresa A': 100...}, ...]
    // We need to list the top companies and their total/latest values.

    // Extract companies from chartData keys (excluding 'year')
    const companies = Object.keys(chartData[0]).filter(k => k !== 'year');

    // Calculate totals per company for the table
    const companyStats = companies.map(comp => {
        const total = chartData.reduce((acc, curr) => acc + (curr[comp] || 0), 0);
        const lastValue = chartData[chartData.length - 1][comp] || 0;
        return { name: comp, total, lastValue };
    }).sort((a, b) => b.total - a.total);

    return (
        <div id={id} className="bg-white text-slate-800 w-[1100px] h-auto min-h-[800px] p-10 relative hidden-on-screen">
            {/* HEADER */}
            <div className="flex justify-between items-end border-b-2 border-slate-200 pb-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        🌍 HuellaRETC
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Informe de Análisis Territorial de Generación de Residuos</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-700 capitalize">{date}</p>
                    <p className="text-xs text-slate-400">Datos Oficiales RETC</p>
                </div>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Total Industrias</p>
                    <p className="text-3xl font-bold text-slate-800">{stats.count}</p>
                    <p className="text-xs text-slate-500 mt-1">En un radio de {stats.radius}km</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Tendencia (5 años)</p>
                    <div className={`flex items-center gap-2 text-2xl font-bold ${stats.trend > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {stats.trend > 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                        {Math.abs(stats.trend).toFixed(1)}%
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{stats.trend > 0 ? 'Aumento de generación' : 'Reducción de generación'}</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 col-span-2">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Resumen del Análisis</p>
                    <p className="text-sm text-slate-600 leading-snug">
                        La zona analizada presenta {stats.count} establecimientos reportando al RETC.
                        La tendencia observada en el periodo 2021-2024 es {stats.trend > 0 ? 'al alza' : 'a la baja'},
                        lo que indica {stats.trend > 0 ? 'un incremento' : 'una disminución'} en la carga ambiental de la zona.
                    </p>
                </div>
            </div>

            {/* MAP SNAPSHOT */}
            <div className="w-full h-[400px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 mb-6 relative">
                {mapSnapshot ? (
                    <img src={mapSnapshot} alt="Mapa del sector" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">Capturando mapa...</div>
                )}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                        <MapPin size={14} className="text-rose-500" />
                        <span>Zona de Análisis ({stats.radius} km)</span>
                    </div>
                </div>
            </div>

            {/* TOP EMITTERS TABLE */}
            <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Layers size={18} className="text-slate-500" />
                    Principales Generadores (Top 5)
                </h2>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-left">Empresa / Razon Social</th>
                                <th className="px-4 py-3 text-right">Total Acumulado (t)</th>
                                <th className="px-4 py-3 text-right">Último Año (t)</th>
                                <th className="px-4 py-3 text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {companyStats.map((company, i) => (
                                <tr key={i} className="bg-white">
                                    <td className="px-4 py-3 font-medium text-slate-800">{company.name}</td>
                                    <td className="px-4 py-3 text-right text-slate-600 font-mono">{company.total.toLocaleString('es-CL')}</td>
                                    <td className="px-4 py-3 text-right text-slate-600 font-mono">{company.lastValue.toLocaleString('es-CL')}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" title="Alto Generador"></span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* FOOTER */}
            <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-xs text-slate-400">
                <p>Generado automáticamente por HuellaRETC</p>
                <p className="flex items-center gap-1">
                    <Database size={12} /> Fuente: Registro de Emisiones y Transferencia de Contaminantes (RETC)
                </p>
            </div>
        </div>
    );
}
