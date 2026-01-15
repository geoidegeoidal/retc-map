import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, MapPin, Search, ScanEye, Download, Layers } from 'lucide-react';

export default function TutorialOverlay({ onClose }) {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: "Buscador de Direcciones",
            description: "Escribe una dirección (Ej: Alameda 1340) para volar rápidamente a un lugar de interés.",
            // Posición aproximada para resaltar la barra (top-4 left-1/2)
            positionClass: "top-16 left-1/2 -translate-x-1/2 origin-top",
            icon: <Search size={24} className="text-cyan-400" />
        },
        {
            title: "Modo Análisis Zonal",
            description: "Activa este botón para analizar un área. Luego haz clic en el mapa para ver estadísticas de radio.",
            // Posición para el botón Scan (top-20 right-4)
            positionClass: "top-32 right-8 md:top-24 md:right-16 origin-top-right",
            icon: <ScanEye size={24} className="text-emerald-400" />
        },
        {
            title: "Leyenda y Filtros",
            description: "Usa estos controles para filtrar por año y por cantidad de toneladas. ¡Haz clic en los colores para filtrar!",
            // Posición para la leyenda (bottom-20 left-4)
            positionClass: "bottom-44 left-8 md:bottom-32 md:left-12 origin-bottom-left",
            icon: <Layers size={24} className="text-violet-400" />
        },
        {
            title: "Exportar Reporte",
            description: "Genera un reporte profesional en PDF o imagen PNG de la zona que estás visualizando.",
            // Posición para el menú exportar (top-4 right-4)
            positionClass: "top-16 right-8 md:right-16 origin-top-right",
            icon: <Download size={24} className="text-rose-400" />
        }
    ];

    const handleNext = () => {
        if (step < steps.length - 1) setStep(step + 1);
        else onClose();
    };

    const handlePrev = () => {
        if (step > 0) setStep(step - 1);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Botón Salir */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
                <span className="text-sm font-bold mr-2 uppercase tracking-wider">Saltar tutorial</span>
                <X size={24} className="inline" />
            </button>

            {/* Contenido del paso */}
            <div
                key={step}
                className={`absolute max-w-xs w-full p-5 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl transition-all duration-500 ease-out ${steps[step].positionClass}`}
            >
                <div className="flex items-start gap-4 mb-3">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 shrink-0">
                        {steps[step].icon}
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">
                            Paso {step + 1} de {steps.length}
                        </span>
                        <h3 className="text-lg font-bold text-white leading-tight">
                            {steps[step].title}
                        </h3>
                    </div>
                </div>

                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                    {steps[step].description}
                </p>

                {/* Navegación */}
                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <button
                        onClick={handlePrev}
                        disabled={step === 0}
                        className={`flex items-center gap-1 text-sm font-bold transition-colors ${step === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ChevronLeft size={16} /> Anterior
                    </button>

                    <div className="flex gap-1.5">
                        {steps.map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === step ? 'bg-cyan-400 w-4' : 'bg-slate-700'}`} />
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        className="flex items-center gap-1 text-sm font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        {step === steps.length - 1 ? 'Finalizar' : 'Siguiente'} <ChevronRight size={16} />
                    </button>
                </div>

                {/* Triángulo indicador (opcional, simplificado por CSS classes) */}
            </div>
        </div>
    );
}
