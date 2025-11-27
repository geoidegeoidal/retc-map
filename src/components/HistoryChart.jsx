import React from 'react';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
    return (
      <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 p-2.5 rounded-lg shadow-xl min-w-[140px]">
        <p className="text-xs font-bold text-slate-200 mb-1.5 border-b border-white/10 pb-1">Año {label}</p>
        <div className="flex flex-col gap-1">
          {sortedPayload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-3 text-[10px]">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="w-1.5 h-1.5 rounded-full shrink-0 shadow-[0_0_5px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }}></span>
                <span className="text-slate-400 truncate max-w-[80px]" title={entry.name}>{entry.name}</span>
              </div>
              <span className="font-mono font-medium text-white tabular-nums">{entry.value} t</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// 🔴 ACEPTAMOS LA PROP onHoverHighlight
export default function HistoryChart({ data, keys, onHoverHighlight }) {
  if (!data || data.length === 0 || !keys || keys.length === 0) {
    return <div className="h-40 flex items-center justify-center border border-dashed border-slate-700 rounded-lg bg-slate-800/30"><p className="text-slate-500 text-xs">Sin datos.</p></div>;
  }

  return (
    <div className="w-full h-64 mt-2 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
          <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} dy={10} interval={0} padding={{ left: 20, right: 20 }} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.3 }} />
          
          {/* 🔴 LEYENDA INTERACTIVA */}
          <Legend 
             wrapperStyle={{ fontSize: '10px', paddingTop: '10px', opacity: 0.8, cursor: 'pointer' }}
             iconType="circle"
             iconSize={8}
             // Eventos para detectar hover
             onMouseEnter={(o) => onHoverHighlight(o.dataKey)}
             onMouseLeave={() => onHoverHighlight(null)}
          />
          
          {keys.map((keyName, index) => (
            <Line 
              key={keyName}
              type="monotone" 
              dataKey={keyName} 
              stroke={COLORS[index % COLORS.length]} 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: '#fff' }}
              connectNulls={true} 
              animationDuration={1000}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}