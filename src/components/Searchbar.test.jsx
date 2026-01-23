import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchBar from './Searchbar';
import React from 'react';

// Mock fetch
global.fetch = vi.fn();

describe('SearchBar Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('updates input value when typing', () => {
        render(<SearchBar onSelectLocation={() => { }} />);
        const input = screen.getByPlaceholderText(/Ej: Alameda/i);

        fireEvent.change(input, { target: { value: 'Santiago' } });
        expect(input.value).toBe('Santiago');
    });

    it('calls API and shows results when typing', async () => {
        const mockResults = [
            {
                lat: "-33.4",
                lon: "-70.6",
                display_name: "Santiago, Chile",
                address: { road: "Alameda", city: "Santiago" }
            }
        ];

        fetch.mockResolvedValueOnce({
            json: async () => mockResults
        });

        render(<SearchBar onSelectLocation={() => { }} />);
        const input = screen.getByPlaceholderText(/Ej: Alameda/i);

        // Type query > 4 chars
        fireEvent.change(input, { target: { value: 'Alameda' } });

        // Wait for debounce (mock timers if needed, or just wait for async)
        // For simplicity in this test plan, we rely on waitFor which retries
        await waitFor(() => {
            expect(screen.getByText(/Santiago, Chile/i)).toBeInTheDocument();
        }, { timeout: 2000 });
    });

    it('calls onSelectLocation when result clicked', async () => {
        const mockResults = [
            {
                lat: "-33.45",
                lon: "-70.65",
                display_name: "Result 1",
                address: { road: "Calle Fake" }
            }
        ];
        fetch.mockResolvedValueOnce({ json: async () => mockResults });

        const handleSelect = vi.fn();
        render(<SearchBar onSelectLocation={handleSelect} />);

        const input = screen.getByPlaceholderText(/Ej: Alameda/i);
        fireEvent.change(input, { target: { value: 'Calle Fake' } });

        await waitFor(() => expect(screen.getByText(/Result 1/)).toBeInTheDocument(), { timeout: 2000 });

        fireEvent.click(screen.getByText(/Result 1/));

        expect(handleSelect).toHaveBeenCalledWith({ lat: -33.45, lng: -70.65 });
    });
});
