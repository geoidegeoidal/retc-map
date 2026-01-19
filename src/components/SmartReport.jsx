import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function SmartReport({ analysis }) {
  const report = useMemo(() => {
    if (!analysis) return null;

    const { count, trend, topIndustry } = analysis.stats;
    const isHighTrend = trend > 10;
    const isNegativeTrend = trend < 0;
    const industryText = topIndustry ? `Principal rubro: ${topIndustry}.` : '';

    let title = "";
    let description = "";
    let tone = "neutral";
    let Icon = Minus;

    if (count === 0) {
      title = "Sin actividad industrial";
      description = "No se detectan generadores de residuos registrados en el radio seleccionado.";
      tone = "success";
      Icon = Sparkles;
    } else {
      if (isHighTrend) {
        title = "Alerta: Residuos en alza";
        description = `Zona con ${count} industrias. Se registra un aumento del ${trend.toFixed(1)}% en generación de residuos los últimos años. ${industryText}`;
        tone = "warning";
        Icon = TrendingUp;
      } else if (isNegativeTrend) {
        title = "Mejora: Residuos a la baja";
        description = `Zona con ${count} industrias, pero con tendencia positiva: la generación ha caído un ${Math.abs(trend).toFixed(1)}% recientemente. ${industryText}`;
        tone = "success";
        Icon = TrendingDown;
      } else {
        title = "Actividad estable";
        description = `Zona con actividad moderada (${count} industrias). La generación de residuos se mantiene estable (${trend > 0 ? '+' : ''}${trend.toFixed(1)}%) en el periodo. ${industryText}`;
        tone = "neutral";
        Icon = Minus;
      }
    }

    return { title, description, tone, Icon, trendVal: trend };
  }, [analysis]);

  if (!report) return null;

  const colors = {
    warning: { text: 'text-rose-100', badgeText: 'text-rose-400', badgeBg: 'bg-rose-500/10 border-rose-500/20', bg: 'from-rose-500 to-orange-500' },
    success: { text: 'text-emerald-100', badgeText: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 border-emerald-500/20', bg: 'from-emerald-500 to-teal-500' },
    neutral: { text: 'text-slate-100', badgeText: 'text-blue-400', badgeBg: 'bg-blue-500/10 border-blue-500/20', bg: 'from-blue-500 to-indigo-500' }
  };

  const theme = colors[report.tone];

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 shadow-sm relative overflow-hidden group hover:border-slate-600 transition-colors">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 ${theme.bg}`}></div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">
              INFORME GENERADO
            </span>
          </div>

          {/* 🔴 PORCENTAJE RESTAURADO Y RESALTADO */}
          {report.tone !== 'neutral' && report.trendVal !== undefined && (
            <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${theme.badgeBg} ${theme.badgeText}`}>
              <report.Icon size={14} strokeWidth={2.5} />
              <span>{Math.abs(report.trendVal).toFixed(1)}%</span>
            </div>
          )}
        </div>

        <h4 className={`text-base font-bold mb-1.5 leading-tight ${theme.text}`}>
          {report.title}
        </h4>

        <p className="text-sm text-slate-300 leading-relaxed">
          {report.description}
        </p>
      </div>
    </div>
  );
}