import React from 'react';
import { Layers, MapPin, Database, TrendingUp, TrendingDown, BarChart2, Activity, Factory } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, Cell } from 'recharts';

export default function ReportTemplate({ analysis, mapSnapshot }) {
    if (!analysis) return null;

    const date = new Date().toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const { stats, chartData } = analysis;

    // Extract companies from chartData keys (excluding 'year')
    const companies = Object.keys(chartData[0] || {}).filter(k => k !== 'year');

    // Calculate totals per company for the table and charts
    const companyStats = companies.map(comp => {
        const total = chartData.reduce((acc, curr) => acc + (curr[comp] || 0), 0);
        const lastValue = chartData[chartData.length - 1]?.[comp] || 0;
        const firstValue = chartData[0]?.[comp] || 0;
        const change = firstValue > 0 ? ((lastValue - firstValue) / firstValue * 100) : 0;
        return { name: comp, total, lastValue, firstValue, change };
    }).sort((a, b) => b.total - a.total);

    // Data for horizontal bar chart (Top 5)
    const barData = companyStats.slice(0, 5).map((c, i) => ({
        name: c.name.length > 25 ? c.name.substring(0, 22) + '...' : c.name,
        fullName: c.name,
        value: Math.round(c.total),
        fill: ['#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#ef4444'][i]
    })).reverse(); // Invertir para que el mayor esté arriba

    // Calculate KPIs
    const totalTonnage = companyStats.reduce((acc, c) => acc + c.total, 0);
    const avgPerCompany = companyStats.length > 0 ? totalTonnage / companyStats.length : 0;

    // Colors for line chart
    const lineColors = ['#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#ef4444'];

    return (
        <div className="flex flex-col">
            {/* ============ PAGE 1 ============ */}
            <div id="printable-report" className="bg-white text-slate-800 w-[1100px] h-[800px] p-10 relative">
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
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <Layers size={18} className="text-slate-500" />
                        Principales Generadores (Top 5)
                    </h2>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2 text-left">Empresa / Razon Social</th>
                                    <th className="px-4 py-2 text-right">Total Acumulado (t)</th>
                                    <th className="px-4 py-2 text-right">Último Año (t)</th>
                                    <th className="px-4 py-2 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {companyStats.slice(0, 5).map((company, i) => (
                                    <tr key={i} className="bg-white">
                                        <td className="px-4 py-2 font-medium text-slate-800">{company.name}</td>
                                        <td className="px-4 py-2 text-right text-slate-600 font-mono">{company.total.toLocaleString('es-CL')}</td>
                                        <td className="px-4 py-2 text-right text-slate-600 font-mono">{company.lastValue.toLocaleString('es-CL')}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" title="Alto Generador"></span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FOOTER PAGE 1 */}
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs text-slate-400">
                    <p>Generado automáticamente por HuellaRETC</p>
                    <p className="flex items-center gap-1">
                        <Database size={12} /> Fuente: Registro de Emisiones y Transferencia de Contaminantes (RETC)
                    </p>
                    <p className="font-semibold">Página 1 de 2</p>
                </div>
            </div>

            {/* ============ PAGE 2 ============ */}
            <div id="printable-report-page2" className="bg-white text-slate-800 w-[1100px] h-[800px] p-10 relative">
                {/* HEADER PAGE 2 */}
                <div className="flex justify-between items-end border-b-2 border-cyan-500 pb-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <BarChart2 className="text-cyan-500" size={28} />
                            Análisis Gráfico Detallado
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Visualización de datos del área seleccionada</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-slate-400">Radio de análisis</p>
                            <p className="text-lg font-bold text-cyan-600">{stats.radius} km</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">Establecimientos</p>
                            <p className="text-lg font-bold text-slate-800">{stats.count}</p>
                        </div>
                    </div>
                </div>

                {/* KPIs GRANDES */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-6 rounded-2xl text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Factory size={24} className="opacity-80" />
                            <p className="text-sm font-semibold uppercase opacity-90">Total Generado en Zona</p>
                        </div>
                        <p className="text-4xl font-black">{Math.round(totalTonnage).toLocaleString('es-CL')}</p>
                        <p className="text-sm opacity-80 mt-1">toneladas acumuladas (2021-2024)</p>
                    </div>

                    <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-6 rounded-2xl text-white shadow-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Activity size={24} className="opacity-80" />
                            <p className="text-sm font-semibold uppercase opacity-90">Promedio por Empresa</p>
                        </div>
                        <p className="text-4xl font-black">{Math.round(avgPerCompany).toLocaleString('es-CL')}</p>
                        <p className="text-sm opacity-80 mt-1">toneladas por establecimiento</p>
                    </div>

                    <div className={`bg-gradient-to-br ${stats.trend > 0 ? 'from-rose-500 to-rose-600' : 'from-emerald-500 to-emerald-600'} p-6 rounded-2xl text-white shadow-lg`}>
                        <div className="flex items-center gap-3 mb-2">
                            {stats.trend > 0 ? <TrendingUp size={24} className="opacity-80" /> : <TrendingDown size={24} className="opacity-80" />}
                            <p className="text-sm font-semibold uppercase opacity-90">Tendencia 2021-2024</p>
                        </div>
                        <p className="text-4xl font-black">{stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(1)}%</p>
                        <p className="text-sm opacity-80 mt-1">{stats.trend > 0 ? 'Incremento en generación' : 'Reducción en generación'}</p>
                    </div>
                </div>

                {/* CHARTS ROW */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* HORIZONTAL BAR CHART - TOP 5 */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <BarChart2 size={18} className="text-cyan-500" />
                            Ranking Top 5 Generadores
                        </h3>
                        <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => v.toLocaleString('es-CL')} />
                                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 9, fill: '#334155' }} />
                                    <Tooltip
                                        formatter={(value) => [`${value.toLocaleString('es-CL')} t`, 'Total']}
                                        labelFormatter={(label, payload) => payload[0]?.payload?.fullName || label}
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: 'white', fontSize: 11 }}
                                    />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                        {barData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* LINE CHART - EVOLUTION */}
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Activity size={18} className="text-violet-500" />
                            Evolución Temporal (2021-2024)
                        </h3>
                        <div style={{ width: '100%', height: 220 }}>
                            <ResponsiveContainer>
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} />
                                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => v > 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: 'white', fontSize: 11 }}
                                        formatter={(value) => [`${Math.round(value).toLocaleString('es-CL')} t`]}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 9 }} />
                                    {companies.slice(0, 5).map((comp, i) => (
                                        <Line
                                            key={comp}
                                            type="monotone"
                                            dataKey={comp}
                                            name={comp.length > 20 ? comp.substring(0, 17) + '...' : comp}
                                            stroke={lineColors[i]}
                                            strokeWidth={2.5}
                                            dot={{ fill: lineColors[i], strokeWidth: 0, r: 4 }}
                                            activeDot={{ r: 6 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* INSIGHTS */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white mb-4">
                    <h3 className="text-base font-bold mb-3 flex items-center gap-2">
                        💡 Insights Clave
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-cyan-300 font-semibold mb-1">Mayor Generador</p>
                            <p className="text-white/90">{companyStats[0]?.name || 'N/A'}</p>
                            <p className="text-xs text-white/60 mt-1">{Math.round(companyStats[0]?.total || 0).toLocaleString('es-CL')} toneladas</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-violet-300 font-semibold mb-1">Concentración Top 5</p>
                            <p className="text-white/90">{totalTonnage > 0 ? ((companyStats.slice(0, 5).reduce((a, c) => a + c.total, 0) / totalTonnage) * 100).toFixed(0) : 0}% del total</p>
                            <p className="text-xs text-white/60 mt-1">Las 5 mayores industrias</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <p className={`${stats.trend > 0 ? 'text-rose-300' : 'text-emerald-300'} font-semibold mb-1`}>Proyección</p>
                            <p className="text-white/90">{stats.trend > 0 ? 'Carga creciente' : 'Mejora ambiental'}</p>
                            <p className="text-xs text-white/60 mt-1">Basado en tendencia histórica</p>
                        </div>
                    </div>
                </div>

                {/* FOOTER PAGE 2 */}
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-xs text-slate-400">
                    <p>Generado automáticamente por HuellaRETC</p>
                    <p className="flex items-center gap-1">
                        <Database size={12} /> Fuente: Registro de Emisiones y Transferencia de Contaminantes (RETC)
                    </p>
                    <p className="font-semibold">Página 2 de 2</p>
                </div>
            </div>
        </div>
    );
}
