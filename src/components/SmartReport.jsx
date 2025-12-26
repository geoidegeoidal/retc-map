import React, { useMemo } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, Wind } from 'lucide-react';

export default function SmartReport({ analysis }) {
  const report = useMemo(() => {
    if (!analysis) return null;

    const { count, trend, topIndustry } = analysis.stats;
    const isHighTrend = trend > 10;
    const isNegativeTrend = trend < 0;

    let title = "";
    let description = "";
    let tone = "neutral"; // neutral, warning, success

    if (count === 0) {
      title = "Zona sin actividad industrial significativa";
      description = "No se detectan fuentes emisoras registradas en el radio seleccionado. La calidad del aire no debería verse afectada por emisiones fijas directas.";
      tone = "success";
    } else {
      // Lógica simple de generación de texto
      if (isHighTrend) {
        title = "Alerta de crecimiento de emisiones";
        description = `Se detecta una concentración de ${count} industrias. Lo más preocupante es el aumento del ${trend.toFixed(1)}% en las emisiones durante los últimos 5 años, impulsado principalmente por el sector de ${topIndustry}.`;
        tone = "warning";
      } else if (isNegativeTrend) {
        title = "Tendencia a la baja en emisiones";
        description = `Zona con presencia industrial (${count} fuentes), pero con noticias positivas: las emisiones han disminuido un ${Math.abs(trend).toFixed(1)}% recientemente. El actor principal sigue siendo ${topIndustry}.`;
        tone = "success";
      } else {
        title = "Actividad industrial estable";
        description = `Zona con actividad moderada (${count} industrias). Las emisiones se mantienen relativamente estables (${trend > 0 ? '+' : ''}${trend.toFixed(1)}%) en el periodo analizado, lideradas por ${topIndustry}.`;
      }
    }

    return { title, description, tone };
  }, [analysis]);

  if (!report) return null;

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 shadow-sm relative overflow-hidden group hover:border-slate-600 transition-colors">
      {/* Efecto de fondo (Glow) */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 ${
        report.tone === 'warning' ? 'from-rose-500 to-orange-500' : 
        report.tone === 'success' ? 'from-emerald-500 to-teal-500' : 
        'from-blue-500 to-indigo-500'
      }`}></div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
           {/* Mantenemos el icono Sparkles porque sigue siendo un reporte automático */}
           <Sparkles size={16} className={
             report.tone === 'warning' ? 'text-rose-400' : 
             report.tone === 'success' ? 'text-emerald-400' : 
             'text-blue-400'
           } />
           
           {/* 🔴 AQUÍ ESTÁ EL CAMBIO DE TEXTO */}
           <h3 className="font-bold text-slate-200 text-sm uppercase tracking-wide">
             Informe Generado
           </h3>
        </div>

        <h4 className={`text-base font-bold mb-1 leading-tight ${
             report.tone === 'warning' ? 'text-rose-100' : 
             report.tone === 'success' ? 'text-emerald-100' : 
             'text-slate-100'
        }`}>
          {report.title}
        </h4>
        
        <p className="text-sm text-slate-400 leading-relaxed text-justify">
          {report.description}
        </p>
      </div>
    </div>
  );
}