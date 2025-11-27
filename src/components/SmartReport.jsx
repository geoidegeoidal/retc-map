import React from 'react';
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react';

export default function SmartReport({ analysis }) {
  if (!analysis) return null;

  const { stats, chartData, lineKeys } = analysis;
  
  // 1. Calcular Datos Clave
  const trend = stats.trend;
  const totalIndustries = stats.count;
  
  // Encontrar la empresa que más emitió en el último año (2023)
  let topEmitterName = "N/A";
  let topEmitterValue = 0;
  
  if (chartData && chartData.length > 0) {
    const lastYearData = chartData[chartData.length - 1]; // Datos 2023
    
    // Recorremos las llaves (nombres de empresas) para ver cual es mayor
    lineKeys.forEach(key => {
      if (lastYearData[key] > topEmitterValue) {
        topEmitterValue = lastYearData[key];
        topEmitterName = key;
      }
    });
  }

  // 2. Generar Texto Dinámico
  const isCritical = trend > 5; // Si subió más de un 5%
  const isGood = trend < -5;    // Si bajó más de un 5%

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-4">
      <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-2">
        <FileText size={16} className="text-slate-400"/> 
        Informe IA Generado
      </h3>
      
      <div className="text-xs text-slate-300 space-y-2 leading-relaxed text-justify">
        <p>
          En el radio seleccionado de <strong>{stats.radius} km</strong>, se han detectado 
          <strong> {totalIndustries} fuentes emisoras</strong> activas reportadas en el RETC.
        </p>

        <p>
          <span className={`font-bold ${isCritical ? 'text-rose-400' : isGood ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isCritical ? "⚠️ ALERTA: " : isGood ? "✅ POSITIVO: " : "ℹ️ ESTABLE: "}
          </span>
          Las emisiones acumuladas muestran una tendencia de 
          <strong> {Math.abs(trend).toFixed(1)}% {trend > 0 ? "al alza" : "a la baja"} </strong> 
          en los últimos 5 años.
        </p>

        {topEmitterName !== "N/A" && (
          <p>
            El actor más relevante en la zona es <strong>{topEmitterName}</strong>, 
            siendo responsable de la mayor carga de emisiones reciente ({topEmitterValue} ton).
          </p>
        )}
      </div>
    </div>
  );
}