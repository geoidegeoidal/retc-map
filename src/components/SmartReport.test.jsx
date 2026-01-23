import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SmartReport from './SmartReport';
import React from 'react'; // Ensure React is imported

// Mock analysis data
const mockAnalysisAlert = {
    stats: {
        count: 10,
        trend: 15.5, // > 10, so "Alerta"
        topIndustry: "Minería"
    }
};

const mockAnalysisImprovement = {
    stats: {
        count: 10,
        trend: -5.0, // < 0, so "Mejora"
        topIndustry: "Manufactura"
    }
};

const mockAnalysisStable = {
    stats: {
        count: 10,
        trend: 2.0, // Stable
        topIndustry: "Alimentos"
    }
};

describe('SmartReport Component', () => {
    it('renders nothing if analysis is missing', () => {
        const { container } = render(<SmartReport analysis={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders "Alerta: Residuos en alza" when trend > 10%', () => {
        render(<SmartReport analysis={mockAnalysisAlert} />);

        expect(screen.getByText(/Alerta: Residuos en alza/i)).toBeInTheDocument();
        // The percentage appears in both the badge and the description
        expect(screen.getAllByText(/15.5%/).length).toBeGreaterThan(0);
        expect(screen.getByText(/Principal rubro: Minería/)).toBeInTheDocument();
    });

    it('renders "Mejora: Residuos a la baja" when trend < 0%', () => {
        render(<SmartReport analysis={mockAnalysisImprovement} />);

        expect(screen.getByText(/Mejora: Residuos a la baja/i)).toBeInTheDocument();
    });

    it('renders "Actividad estable" when trend is neutral', () => {
        render(<SmartReport analysis={mockAnalysisStable} />);

        expect(screen.getByText(/Actividad estable/i)).toBeInTheDocument();
    });
});
