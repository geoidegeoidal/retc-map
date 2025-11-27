import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from 'recharts';

export default function MiniChart({ history, color }) {
  if (!history || history.length === 0) return null;

  const data = history.map(h => ({ name: h.year, value: h.value }));
  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className="w-full h-24 mt-1"> {/* Altura reducida a h-24 */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 5 }}>
          
          {/* EJE X: Texto muy pequeño y sutil */}
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#64748b', fontSize: 9, fontWeight: 600 }} // Slate-500
            axisLine={false} 
            tickLine={false} 
            dy={5}
            interval="preserveStartEnd"
          />

          <YAxis domain={[minValue * 0.9, maxValue * 1.1]} hide />

          {/* TOOLTIP: Estilo Glassmorphism Oscuro */}
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.8)', // Slate-900 al 80%
              backdropFilter: 'blur(4px)',
              borderColor: 'rgba(255,255,255,0.1)', 
              borderRadius: '8px', 
              fontSize: '10px', 
              color: '#fff',
              padding: '4px 8px'
            }}
            itemStyle={{ color: color || '#22d3ee', padding: 0 }}
            formatter={(value) => [`${value} t`, '']}
            labelStyle={{ display: 'none' }} // Ocultamos el año en el tooltip para ahorrar espacio
            cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '3 3', opacity: 0.3 }}
          />

          {/* LINEA: Efecto Neon Fino */}
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color || "#22d3ee"} // Cyan-400
            strokeWidth={2} 
            dot={{ r: 2, fill: '#0f172a', stroke: color || "#22d3ee", strokeWidth: 1.5 }} // Puntos huecos pequeños
            activeDot={{ r: 4, fill: color || "#22d3ee" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}