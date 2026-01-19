import React from 'react';
import { Layers, MapPin, Database, TrendingUp, TrendingDown, BarChart2, Activity, Factory } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, Cell } from 'recharts';

export default function ReportTemplate({ analysis, mapSnapshot, isMobile = false }) {
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

    // Calculate totals per company
    const companyStats = companies.map(comp => {
        const total = chartData.reduce((acc, curr) => acc + (curr[comp] || 0), 0);
        const lastValue = chartData[chartData.length - 1]?.[comp] || 0;
        return { name: comp, total, lastValue };
    }).sort((a, b) => b.total - a.total);

    // Data for horizontal bar chart (Top 5)
    const barData = companyStats.slice(0, 5).map((c, i) => ({
        name: c.name.length > 20 ? c.name.substring(0, 17) + '...' : c.name,
        fullName: c.name,
        value: Math.round(c.total),
        fill: ['#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#ef4444'][i]
    })).reverse();

    // Calculate KPIs
    const totalTonnage = companyStats.reduce((acc, c) => acc + c.total, 0);
    const avgPerCompany = companyStats.length > 0 ? totalTonnage / companyStats.length : 0;

    // Colors for line chart
    const lineColors = ['#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#ef4444'];

    return (
        <div className="flex flex-col">
            {/* ============ PAGE 1 - VERTICAL ============ */}
            <div id="printable-report" className="bg-white text-slate-800 w-[800px] min-h-[1100px] p-8 relative">
                {/* HEADER */}
                <div className="flex justify-between items-end border-b-2 border-cyan-500 pb-3 mb-5">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            🌍 HuellaRETC
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Informe de Análisis Territorial</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-700 capitalize">{date}</p>
                        <p className="text-[10px] text-slate-400">Datos Oficiales RETC</p>
                    </div>
                </div>

                {/* METRICS ROW */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-4 rounded-xl text-white">
                        <p className="text-[10px] uppercase opacity-80 font-semibold">Total Industrias</p>
                        <p className="text-3xl font-black">{stats.count}</p>
                        <p className="text-[10px] opacity-70">Radio {stats.radius}km</p>
                    </div>

                    <div className={`bg-gradient-to-br ${stats.trend > 0 ? 'from-rose-500 to-rose-600' : 'from-emerald-500 to-emerald-600'} p-4 rounded-xl text-white`}>
                        <p className="text-[10px] uppercase opacity-80 font-semibold">Tendencia</p>
                        <div className="flex items-center gap-1">
                            {stats.trend > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            <span className="text-3xl font-black">{Math.abs(stats.trend).toFixed(1)}%</span>
                        </div>
                        <p className="text-[10px] opacity-70">2021-2024</p>
                    </div>

                    <div className="bg-gradient-to-br from-violet-500 to-violet-600 p-4 rounded-xl text-white">
                        <p className="text-[10px] uppercase opacity-80 font-semibold">Total Generado</p>
                        <p className="text-2xl font-black">{Math.round(totalTonnage).toLocaleString('es-CL')}</p>
                        <p className="text-[10px] opacity-70">toneladas</p>
                    </div>
                </div>

                {/* MAP SNAPSHOT O CONTENIDO ALTERNATIVO MÓVIL */}
                {!isMobile ? (
                    <div className="w-full h-[320px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 mb-5 relative">
                        {mapSnapshot ? (
                            <img src={mapSnapshot} alt="Mapa del sector" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">Capturando mapa...</div>
                        )}
                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                                <MapPin size={12} className="text-rose-500" />
                                <span>Zona de Análisis ({stats.radius} km)</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* CONTENIDO ALTERNATIVO PARA MÓVIL: Distribución por Categoría + Ranking Visual */
                    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 mb-5 p-4">
                        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Factory size={16} className="text-cyan-500" />
                            Distribución por Categoría Industrial
                        </h3>

                        {/* Calcular distribución por categoría */}
                        {(() => {
                            const categoryData = {};
                            if (stats.topEmitters) {
                                stats.topEmitters.forEach(e => {
                                    const cat = e.category || 'Sin clasificar';
                                    categoryData[cat] = (categoryData[cat] || 0) + 1;
                                });
                            }
                            const sortedCategories = Object.entries(categoryData)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5);
                            const maxCount = sortedCategories[0]?.[1] || 1;

                            return (
                                <div className="space-y-2 mb-4">
                                    {sortedCategories.map(([cat, count], i) => (
                                        <div key={cat} className="flex items-center gap-2">
                                            <div className="w-24 text-[10px] text-slate-600 truncate font-medium">{cat}</div>
                                            <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full"
                                                    style={{
                                                        width: `${(count / maxCount) * 100}%`,
                                                        backgroundColor: ['#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#10b981'][i]
                                                    }}
                                                />
                                            </div>
                                            <div className="w-8 text-[10px] text-slate-500 text-right font-bold">{count}</div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* Mini Ranking Visual */}
                        <div className="border-t border-slate-200 pt-3">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Top 3 Generadores (Toneladas)</p>
                            <div className="flex gap-2">
                                {companyStats.slice(0, 3).map((c, i) => (
                                    <div key={i} className="flex-1 bg-white rounded-lg p-2 border border-slate-200 text-center">
                                        <div className="text-lg font-black" style={{ color: ['#06b6d4', '#8b5cf6', '#ec4899'][i] }}>
                                            #{i + 1}
                                        </div>
                                        <div className="text-[9px] text-slate-600 truncate font-medium">{c.name}</div>
                                        <div className="text-xs font-bold text-slate-800">{Math.round(c.total).toLocaleString('es-CL')} t</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* SUMMARY */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-5">
                    <p className="text-xs text-slate-400 uppercase font-bold mb-2">Resumen del Análisis</p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        La zona analizada presenta <strong>{stats.count} establecimientos</strong> reportando al RETC.
                        La tendencia observada en el periodo 2021-2024 es <strong>{stats.trend > 0 ? 'al alza' : 'a la baja'}</strong>,
                        lo que indica {stats.trend > 0 ? 'un incremento' : 'una disminución'} en la carga ambiental de la zona.
                        El promedio por empresa es de <strong>{Math.round(avgPerCompany).toLocaleString('es-CL')} toneladas</strong>.
                    </p>
                </div>

                {/* TOP EMITTERS TABLE */}
                <div className="mb-4">
                    <h2 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <Layers size={14} className="text-slate-500" />
                        Principales Generadores (Top 5)
                    </h2>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                        <table className="w-full text-xs">
                            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2 text-left">Empresa</th>
                                    <th className="px-3 py-2 text-right">Total (t)</th>
                                    <th className="px-3 py-2 text-right">Último Año (t)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {companyStats.slice(0, 5).map((company, i) => (
                                    <tr key={i} className="bg-white">
                                        <td className="px-3 py-2 font-medium text-slate-800">{company.name}</td>
                                        <td className="px-3 py-2 text-right text-slate-600 font-mono">{Math.round(company.total).toLocaleString('es-CL')}</td>
                                        <td className="px-3 py-2 text-right text-slate-600 font-mono">{Math.round(company.lastValue).toLocaleString('es-CL')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FOOTER PAGE 1 */}
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-[10px] text-slate-400 mt-auto">
                    <p>HuellaRETC - Monitor Ambiental</p>
                    <p className="flex items-center gap-1">
                        <Database size={10} /> Fuente: RETC
                    </p>
                    <p className="font-semibold">Página 1 de 2</p>
                </div>
            </div>

            {/* ============ PAGE 2 - VERTICAL ============ */}
            <div id="printable-report-page2" className="bg-white text-slate-800 w-[800px] min-h-[1100px] p-8 relative">
                {/* HEADER PAGE 2 */}
                <div className="flex justify-between items-end border-b-2 border-violet-500 pb-3 mb-5">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BarChart2 className="text-violet-500" size={24} />
                            Análisis Gráfico
                        </h1>
                        <p className="text-slate-500 text-xs mt-1">Visualización de datos del área seleccionada</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400">Radio</p>
                            <p className="text-sm font-bold text-violet-600">{stats.radius} km</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-slate-400">Empresas</p>
                            <p className="text-sm font-bold text-slate-800">{stats.count}</p>
                        </div>
                    </div>
                </div>

                {/* HORIZONTAL BAR CHART - TOP 5 */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <BarChart2 size={16} className="text-cyan-500" />
                        Ranking Top 5 Generadores (Toneladas Acumuladas)
                    </h3>
                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer>
                            <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => v.toLocaleString('es-CL')} />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fill: '#334155' }} />
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
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-5">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity size={16} className="text-violet-500" />
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
                                        name={comp.length > 18 ? comp.substring(0, 15) + '...' : comp}
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

                {/* INSIGHTS */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 text-white mb-5">
                    <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                        💡 Insights Clave
                    </h3>
                    <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-cyan-300 font-semibold mb-1">Mayor Generador</p>
                            <p className="text-white/90 text-[11px]">{companyStats[0]?.name || 'N/A'}</p>
                            <p className="text-[10px] text-white/60 mt-1">{Math.round(companyStats[0]?.total || 0).toLocaleString('es-CL')} t</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <p className="text-violet-300 font-semibold mb-1">Concentración Top 5</p>
                            <p className="text-white/90">{stats.regionalTotal > 0 ? ((stats.top5Total / stats.regionalTotal) * 100).toFixed(1) : 0}%</p>
                            <p className="text-[10px] text-white/60 mt-1">del total de {stats.regionalName || 'la región'}</p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <p className={`${stats.trend > 0 ? 'text-rose-300' : 'text-emerald-300'} font-semibold mb-1`}>Proyección</p>
                            <p className="text-white/90">{stats.trend > 0 ? 'Carga creciente' : 'Mejora ambiental'}</p>
                            <p className="text-[10px] text-white/60 mt-1">Tendencia histórica</p>
                        </div>
                    </div>
                </div>

                {/* FOOTER PAGE 2 */}
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-[10px] text-slate-400 mt-auto">
                    <p>HuellaRETC - Monitor Ambiental</p>
                    <p className="flex items-center gap-1">
                        <Database size={10} /> Fuente: RETC
                    </p>
                    <p className="font-semibold">Página 2 de 2</p>
                </div>
            </div>
        </div>
    );
}
