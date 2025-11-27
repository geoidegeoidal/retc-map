import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

export default function SearchBar({ onSelectLocation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length > 4) { // Esperamos un poco más para evitar búsquedas cortas
        searchAddress(query);
      } else {
        setResults([]);
      }
    }, 800); // Debounce de 800ms para no saturar la API

    return () => clearTimeout(timeoutId);
  }, [query]);

  const searchAddress = async (q) => {
    setLoading(true);
    try {
      // USAMOS NOMINATIM (Mejor para direcciones exactas en Chile)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=cl&addressdetails=1&limit=5`;
      
      const response = await fetch(url);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error buscando:", error);
    }
    setLoading(false);
  };

  const handleSelect = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    
    // Formateamos el nombre bonito
    const name = item.address.road 
      ? `${item.address.road} ${item.address.house_number || ''}, ${item.address.city || item.address.town || ''}`
      : item.display_name.split(',')[0];

    setQuery(name);
    setResults([]);
    onSelectLocation({ lng, lat });
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md z-50 shadow-2xl">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-slate-600 rounded-xl leading-5 bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 sm:text-sm transition-all"
          placeholder="Ej: Alameda 1340, Santiago"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="animate-spin h-4 w-4 text-emerald-500" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <ul className="absolute mt-2 w-full bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-h-60 overflow-auto z-50 divide-y divide-slate-700">
          {results.map((item, index) => (
            <li
              key={index}
              onClick={() => handleSelect(item)}
              className="cursor-pointer hover:bg-slate-700 p-3 transition-colors flex items-start gap-3"
            >
              <MapPin className="h-4 w-4 text-emerald-400 mt-1 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {item.address?.road || item.display_name.split(',')[0]} {item.address?.house_number}
                </p>
                <p className="text-xs text-slate-400 truncate w-64">
                   {item.display_name}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}