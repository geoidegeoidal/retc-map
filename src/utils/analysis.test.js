import { describe, it, expect } from 'vitest';
import { analyzeLocation } from './analysis';

// Mock simple geoJSON data
const mockGeoData = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: {
                id_vu: "1",
                name: "Empresa A",
                history: [{ year: 2021, value: 100 }, { year: 2024, value: 120 }],
                category: "Rubro 1",
                residues: "Residuo X"
            },
            geometry: { type: "Point", coordinates: [-70.6, -33.4] } // Center
        },
        {
            type: "Feature",
            properties: {
                id_vu: "2",
                name: "Empresa B",
                history: [{ year: 2021, value: 50 }, { year: 2024, value: 40 }],
                category: "Rubro 2",
                residues: "Residuo Y"
            },
            geometry: { type: "Point", coordinates: [-70.61, -33.41] } // Close (~1.5km)
        },
        {
            type: "Feature",
            properties: {
                id_vu: "3",
                name: "Empresa Lejana",
                history: [{ year: 2021, value: 10 }, { year: 2024, value: 10 }],
                category: "Rubro 3"
            },
            geometry: { type: "Point", coordinates: [-71.0, -34.0] } // Far away
        }
    ]
};

const userLocation = { lng: -70.6, lat: -33.4 };

describe('analyzeLocation', () => {
    it('returns null if input is missing', () => {
        expect(analyzeLocation(null, mockGeoData)).toBeNull();
        expect(analyzeLocation(userLocation, null)).toBeNull();
    });

    it('filters features within radius correctly', () => {
        const radius = 3; // 3km
        const result = analyzeLocation(userLocation, mockGeoData, radius);

        // Should include Empresa A (0km) and Empresa B (~1.5km), but not Lejana
        expect(result.stats.count).toBe(2);
        expect(result.topIds).toContain("1");
        expect(result.topIds).toContain("2");
        expect(result.topIds).not.toContain("3");
    });

    it('calculates trend correctly', () => {
        // Total 2021: 100 + 50 = 150
        // Total 2024: 120 + 40 = 160
        // Trend: (160 - 150) / 150 = 0.0666... -> 6.67%
        const result = analyzeLocation(userLocation, mockGeoData, 5);
        expect(result.stats.trend).toBeCloseTo(6.666, 2);
    });

    it('identifies top categories correctly', () => {
        const result = analyzeLocation(userLocation, mockGeoData, 3); // Radius 3 excludes Lejana

        // Categories: "Rubro 1" (1), "Rubro 2" (1) in radius
        expect(result.stats.topCategories).toHaveLength(2);
        expect(result.stats.topCategories.map(c => c.name)).toContain("Rubro 1");
    });
});
