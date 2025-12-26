import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function SmartReport({ analysis }) {
  const report = useMemo(() => {
    if (!analysis) return null;

    const { count, trend, topIndustry } = analysis.stats;
    const isHighTrend = trend > 10;
    const isNegativeTrend = trend < 0; // Tendencia negativa en emisiones es BUENO (baja contaminación)

    let title = "";
    let description = "";
    let tone = "neutral"; // neutral, warning, success
    let Icon = Minus;

    if (count === 0) {
      title = "Sin actividad industrial";
      description = "No se detectan fuentes emisoras registradas en el radio seleccionado. El aire está libre de emisiones fijas directas reportadas.";
      tone = "success";
      Icon = Sparkles;
    } else {
      if (isHighTrend) {
        title = "Alerta: Emisiones en alza";
        description = `Zona con ${count} industrias. Se registra un aumento preocupante del ${trend.toFixed(1)}% en emisiones los últimos 5 años, impulsado por ${topIndustry}.`;
        tone = "warning";
        Icon = TrendingUp;
      } else if (isNegativeTrend) {
        title = "Mejora: Emisiones a la baja";
        description = `Zona con ${count} industrias, pero con tendencia positiva: las emisiones han caído un ${Math.abs(trend).toFixed(1)}% recientemente. Principal rubro: ${topIndustry}.`;
        tone = "success";
        Icon = TrendingDown;
      } else {
        title = "Actividad estable";
        description = `Zona con actividad moderada (${count} industrias). Las emisiones se mantienen estables (${trend > 0 ? '+' : ''}${trend.toFixed(1)}%) en el periodo, lideradas por ${topIndustry}.`;
        tone = "neutral";
        Icon = Minus;
      }
    }

    return { title, description, tone, Icon, trendVal: trend };
  }, [analysis]);

  if (!report) return null;

  // Definición de colores según el tono
  const colors = {
    warning: { text: 'text-rose-100', icon: 'text-rose-400', bg: 'from-rose-500 to-orange-500' },
    success: { text: 'text-emerald-100', icon: 'text-emerald-400', bg: 'from-emerald-500 to-teal-500' },
    neutral: { text: 'text-slate-100', icon: 'text-blue-400', bg: 'from-blue-500 to-indigo-500' }
  };

  const theme = colors[report.tone];

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 shadow-sm relative overflow-hidden group hover:border-slate-600 transition-colors">
      
      {/* Fondo con Glow dinámico */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 ${theme.bg}`}></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2">
             {/* Texto Sobrio */}
             <span className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">
               INFORME GENERADO
             </span>
           </div>

           {/* 🔴 AQUÍ ESTÁ EL PORCENTAJE CON COLORES E ICONO */}
           {report.tone !== 'neutral' && report.trendVal !== undefined && (
             <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-slate-900/50 border border-slate-700 ${theme.icon}`}>
                <report.Icon size={12} />
                <span>{Math.abs(report.trendVal).toFixed(1)}%</span>
             </div>
           )}
        </div>

        <h4 className={`text-sm font-bold mb-1 leading-tight ${theme.text}`}>
          {report.title}
        </h4>
        
        <p className="text-xs text-slate-400 leading-relaxed text-justify">
          {report.description}
        </p>
      </div>
    </div>
  );
}