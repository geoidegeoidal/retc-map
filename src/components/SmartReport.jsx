import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function SmartReport({ analysis }) {
  const report = useMemo(() => {
    if (!analysis) return null;

    const { count, trend, topIndustry } = analysis.stats;
    const isHighTrend = trend > 10;
    const isNegativeTrend = trend < 0;
    // Fix para evitar que diga "undefined" si no hay datos suficientes
    const industryText = topIndustry ? `Principal rubro: ${topIndustry}.` : '';

    let title = "";
    let description = "";
    let tone = "neutral"; 
    let Icon = Minus;

    if (count === 0) {
      title = "Sin actividad industrial";
      description = "No se detectan fuentes emisoras registradas en el radio seleccionado. El aire está libre de emisiones fijas directas reportadas.";
      tone = "success";
      Icon = Sparkles;
    } else {
      if (isHighTrend) {
        title = "Alerta: Emisiones en alza";
        description = `Zona con ${count} industrias. Se registra un aumento preocupante del ${trend.toFixed(1)}% en emisiones los últimos 5 años. ${industryText}`;
        tone = "warning";
        Icon = TrendingUp;
      } else if (isNegativeTrend) {
        title = "Mejora: Emisiones a la baja";
        description = `Zona con ${count} industrias, pero con tendencia positiva: las emisiones han caído un ${Math.abs(trend).toFixed(1)}% recientemente. ${industryText}`;
        tone = "success";
        Icon = TrendingDown;
      } else {
        title = "Actividad estable";
        description = `Zona con actividad moderada (${count} industrias). Las emisiones se mantienen estables (${trend > 0 ? '+' : ''}${trend.toFixed(1)}%) en el periodo. ${industryText}`;
        tone = "neutral";
        Icon = Minus;
      }
    }

    return { title, description, tone, Icon, trendVal: trend };
  }, [analysis]);

  if (!report) return null;

  const colors = {
    warning: { text: 'text-rose-100', icon: 'text-rose-400', bg: 'from-rose-500 to-orange-500' },
    success: { text: 'text-emerald-100', icon: 'text-emerald-400', bg: 'from-emerald-500 to-teal-500' },
    neutral: { text: 'text-slate-100', icon: 'text-blue-400', bg: 'from-blue-500 to-indigo-500' }
  };

  const theme = colors[report.tone];

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 shadow-sm relative overflow-hidden group hover:border-slate-600 transition-colors">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 ${theme.bg}`}></div>

      <div className="relative z-10">
        {/* HEADER: Nivel 4 (Eyebrow) y Nivel 3 (Badge) */}
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2">
             {/* APLICANDO NIVEL 4: Estandarizado, pequeño, gris */}
             <span className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">
               INFORME GENERADO
             </span>
           </div>

           {report.tone !== 'neutral' && report.trendVal !== undefined && (
             // APLICANDO NIVEL 3: Badge pequeño
             <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900/50 border border-slate-700 ${theme.icon}`}>
                <report.Icon size={12} />
                <span>{Math.abs(report.trendVal).toFixed(1)}%</span>
             </div>
           )}
        </div>

        {/* TÍTULO: Nivel 1 (Prominente) */}
        <h4 className={`text-base font-bold mb-1.5 leading-tight ${theme.text}`}>
          {report.title}
        </h4>
        
        {/* CUERPO: Nivel 2 (Legible) */}
        <p className="text-sm text-slate-300 leading-relaxed">
          {report.description}
        </p>
      </div>
    </div>
  );
}