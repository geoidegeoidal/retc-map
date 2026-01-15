import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import MiniChart from './MiniChart';
import { X, ScanEye } from 'lucide-react';

export default function MapBoard({ mapData, onLocationSelect, flyToLocation, radius, highlightedName }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const animationRef = useRef(null);
  const popupRef = useRef(null);

  const latestProps = useRef({ mapData, radius, onLocationSelect });
  useEffect(() => { latestProps.current = { mapData, radius, onLocationSelect }; }, [mapData, radius, onLocationSelect]);

  const [isMapReady, setIsMapReady] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [popupInfo, setPopupInfo] = useState(null);
  const [isScanMode, setIsScanMode] = useState(false);
  const isScanModeRef = useRef(isScanMode);
  useEffect(() => { isScanModeRef.current = isScanMode; }, [isScanMode]);

  useEffect(() => {
    if (!popupInfo || !map.current || !popupRef.current) return;
    const updatePosition = () => {
      if (!popupInfo || !popupRef.current) return;
      const pos = map.current.project(popupInfo.lngLat);
      popupRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    };
    updatePosition();
    map.current.on('move', updatePosition);
    map.current.on('moveend', updatePosition);
    return () => { if (map.current) { map.current.off('move', updatePosition); map.current.off('moveend', updatePosition); } };
  }, [popupInfo]);

  const initializeLayers = useCallback(() => {
    if (!map.current || map.current.getSource('retc-source')) return;

    const layers = map.current.getStyle().layers;
    let firstSymbolId;
    for (const layer of layers) { if (layer.type === 'symbol') { firstSymbolId = layer.id; break; } }

    map.current.addSource('buffer-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.current.addSource('connections-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

    // Source con CLUSTERING habilitado
    map.current.addSource('retc-source', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
      cluster: true,
      clusterMaxZoom: 12,    // Desactivar clusters a partir de zoom 12
      clusterRadius: 60      // Radio de agrupamiento en píxeles
    });

    map.current.addLayer({ id: 'buffer-fill', type: 'fill', source: 'buffer-source', paint: { 'fill-color': '#10b981', 'fill-opacity': 0.1 } }, firstSymbolId);
    map.current.addLayer({ id: 'buffer-line', type: 'line', source: 'buffer-source', paint: { 'line-color': '#34d399', 'line-width': 2, 'line-dasharray': [2, 2] } }, firstSymbolId);

    // =====================================================
    // 🔥 CLUSTERS PREMIUM - DISEÑO DE SIGUIENTE NIVEL
    // =====================================================

    // CAPA 1: GLOW EXTERIOR (Halo difuso grande)
    map.current.addLayer({
      id: 'cluster-glow-outer',
      type: 'circle',
      source: 'retc-source',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          '#06b6d4',    // Cyan
          100, '#8b5cf6', // Violeta
          500, '#f43f5e'  // Rosa fuego
        ],
        'circle-radius': [
          'step', ['get', 'point_count'],
          35, 100, 45, 500, 60
        ],
        'circle-opacity': 0.15,
        'circle-blur': 1
      }
    }, firstSymbolId);

    // CAPA 2: GLOW MEDIO (Anillo brillante)
    map.current.addLayer({
      id: 'cluster-glow-mid',
      type: 'circle',
      source: 'retc-source',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          '#22d3ee',    // Cyan claro
          100, '#a78bfa', // Violeta claro
          500, '#fb7185'  // Rosa claro
        ],
        'circle-radius': [
          'step', ['get', 'point_count'],
          25, 100, 32, 500, 45
        ],
        'circle-opacity': 0.3,
        'circle-blur': 0.6
      }
    }, firstSymbolId);

    // CAPA 3: CÍRCULO PRINCIPAL (Gradiente sólido con borde)
    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'retc-source',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          '#0891b2',    // Cyan oscuro
          100, '#7c3aed', // Violeta
          500, '#e11d48'  // Rosa fuerte
        ],
        'circle-radius': [
          'step', ['get', 'point_count'],
          16, 100, 22, 500, 30
        ],
        'circle-stroke-width': [
          'step', ['get', 'point_count'],
          2, 100, 3, 500, 4
        ],
        'circle-stroke-color': 'rgba(255, 255, 255, 0.5)'
      }
    }, firstSymbolId);

    // CAPA 4: NÚCLEO BRILLANTE (Punto interior)
    map.current.addLayer({
      id: 'cluster-core',
      type: 'circle',
      source: 'retc-source',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#ffffff',
        'circle-radius': [
          'step', ['get', 'point_count'],
          4, 100, 6, 500, 8
        ],
        'circle-opacity': 0.7,
        'circle-blur': 0.3
      }
    }, firstSymbolId);

    // ETIQUETAS DE CLUSTERS (cantidad de puntos - estilo bold)
    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'retc-source',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': [
          'step', ['get', 'point_count'],
          11, 100, 13, 500, 16
        ]
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(0, 0, 0, 0.5)',
        'text-halo-width': 1
      }
    });

    // LÍNEAS DE CONEXIÓN
    map.current.addLayer({
      id: 'connections-line',
      type: 'line',
      source: 'connections-source',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#22d3ee', 'line-width': 1.5, 'line-opacity': 0.4, 'line-dasharray': [1, 3] }
    }, firstSymbolId);

    // ETIQUETAS DE DISTANCIA
    map.current.addLayer({
      id: 'connections-label',
      type: 'symbol',
      source: 'connections-source',
      layout: {
        'text-field': ['get', 'distLabel'],
        'symbol-placement': 'line-center',
        'text-size': 12,
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-offset': [0, -0.8],
        'text-allow-overlap': false,
        'text-ignore-placement': false,
        'text-padding': 5
      },
      paint: {
        'text-color': 'rgba(255, 255, 255, 0.9)',
        'text-halo-color': '#0f172a',
        'text-halo-width': 2,
        'text-opacity': 0.8
      }
    });

    // PUNTOS INDIVIDUALES (solo visibles cuando no hay cluster)
    map.current.addLayer({
      id: 'retc-points-hitbox',
      type: 'circle',
      source: 'retc-source',
      filter: ['!', ['has', 'point_count']],
      paint: { 'circle-color': 'transparent', 'circle-radius': 15 }
    });

    map.current.addLayer({
      id: 'retc-pulse', type: 'circle', source: 'retc-source',
      filter: ['all', ['!', ['has', 'point_count']], ['in', 'id_vu', '']],
      paint: { 'circle-color': '#f43f5e', 'circle-radius': 12, 'circle-opacity': 0, 'circle-blur': 0.4 }
    }, firstSymbolId);

    map.current.addLayer({
      id: 'retc-highlight', type: 'circle', source: 'retc-source',
      filter: ['all', ['!', ['has', 'point_count']], ['==', 'name', '']],
      paint: { 'circle-color': 'transparent', 'circle-radius': 8, 'circle-stroke-width': 3, 'circle-stroke-color': '#fbbf24', 'circle-opacity': 1 }
    }, firstSymbolId);

    map.current.addLayer({
      id: 'retc-glow',
      type: 'circle',
      source: 'retc-source',
      filter: ['!', ['has', 'point_count']],
      paint: { 'circle-color': '#00ffff', 'circle-radius': 8, 'circle-opacity': 0.2, 'circle-blur': 0.6 }
    }, firstSymbolId);

    map.current.addLayer({
      id: 'retc-points',
      type: 'circle',
      source: 'retc-source',
      filter: ['!', ['has', 'point_count']],
      paint: { 'circle-color': '#e0f2fe', 'circle-radius': 3, 'circle-stroke-width': 1.5, 'circle-stroke-color': '#0ea5e9' }
    }, firstSymbolId);

    if (latestProps.current.mapData) map.current.getSource('retc-source').setData(latestProps.current.mapData);
  }, []);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-70.6483, -33.4569],
      zoom: 10,
      attributionControl: false,
      doubleClickZoom: true,
      preserveDrawingBuffer: true // Fix para html2canvas (Pantalla negra)
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.current.on('load', () => {
      initializeLayers();
      setIsMapReady(true);
      animatePulse();
    });

    map.current.on('click', (e) => {
      const currentProps = latestProps.current;

      // Primero verificar si se hizo clic en un cluster
      const clusterFeatures = map.current.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      if (clusterFeatures.length > 0) {
        const clusterId = clusterFeatures[0].properties.cluster_id;
        map.current.getSource('retc-source').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.current.easeTo({
            center: clusterFeatures[0].geometry.coordinates,
            zoom: zoom + 0.5
          });
        });
        return;
      }

      // Luego verificar puntos individuales
      const features = map.current.queryRenderedFeatures(e.point, { layers: ['retc-points-hitbox'] });

      if (features.length > 0) {
        const f = features[0];
        const coords = f.geometry.coordinates.slice();
        let history = f.properties.history;
        if (typeof history === 'string') { try { history = JSON.parse(history); } catch (e) { } }
        setPopupInfo({ lngLat: coords, properties: f.properties, history });
        map.current.flyTo({ center: coords, speed: 0.5 });
        setIsScanMode(false);
      } else if (isScanModeRef.current) {
        setPopupInfo(null);
        handleNewLocation(e.lngLat.lng, e.lngLat.lat);
        updateMapAnalysisLogic(e.lngLat.lng, e.lngLat.lat, currentProps.radius || 3, currentProps.mapData);
        if (currentProps.onLocationSelect) currentProps.onLocationSelect(e.lngLat);
      }
    });

    // Cursor pointer para clusters y puntos
    map.current.on('mouseenter', 'clusters', () => map.current.getCanvas().style.cursor = 'pointer');
    map.current.on('mouseleave', 'clusters', () => updateCursorState(false));
    map.current.on('mouseenter', 'retc-points-hitbox', () => map.current.getCanvas().style.cursor = 'pointer');
    map.current.on('mouseleave', 'retc-points-hitbox', () => updateCursorState(false));

    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, []); // eslint-disable-line

  useEffect(() => {
    if (isMapReady && map.current && map.current.getLayer('retc-highlight')) {
      if (highlightedName) map.current.setFilter('retc-highlight', ['==', 'name', highlightedName]);
      else map.current.setFilter('retc-highlight', ['==', 'name', '']);
    }
  }, [highlightedName, isMapReady]);

  const updateMapAnalysisLogic = (lng, lat, radiusKm, dataGeoJSON) => {
    if (!map.current) return;
    const center = [lng, lat];
    const options = { steps: 64, units: 'kilometers' };
    const circleGeo = turf.circle(center, radiusKm, options);
    if (map.current.getSource('buffer-source')) map.current.getSource('buffer-source').setData(circleGeo);

    if (dataGeoJSON && dataGeoJSON.features) {
      const pointsWithin = turf.pointsWithinPolygon(dataGeoJSON, circleGeo);
      const idsToBlink = pointsWithin.features.map(f => f.properties.id_vu);
      if (map.current.getLayer('retc-pulse')) {
        if (idsToBlink.length > 0) map.current.setFilter('retc-pulse', ['in', 'id_vu', ...idsToBlink]);
        else map.current.setFilter('retc-pulse', ['in', 'id_vu', 'NonExistentID']);
      }

      // Calcular distancia y ordenar por cercanía
      const pointsWithDistance = pointsWithin.features.map(feature => {
        const dist = turf.distance(center, feature.geometry.coordinates, { units: 'kilometers' });
        return { feature, dist };
      }).sort((a, b) => a.dist - b.dist);

      // SOLO TOP 5 MÁS CERCANAS para evitar saturación visual
      const top5Nearest = pointsWithDistance.slice(0, 5);

      // Generar líneas solo para las 5 más cercanas
      const connectionLines = {
        type: 'FeatureCollection',
        features: top5Nearest.map(({ feature, dist }) => {
          const line = turf.lineString([center, feature.geometry.coordinates]);
          line.properties = {
            distLabel: `${dist.toFixed(2)} km`
          };
          return line;
        })
      };

      if (map.current.getSource('connections-source')) {
        map.current.getSource('connections-source').setData(connectionLines);
      }
    }
  };

  const animatePulse = (timestamp) => {
    if (!timestamp) timestamp = performance.now(); // Fix NaN

    if (map.current && map.current.getLayer('retc-pulse')) {
      const opacity = (Math.sin(timestamp / 500) + 1) / 2 * 0.6 + 0.2;
      const radius = 15 + (Math.sin(timestamp / 500) * 3);

      if (!isNaN(opacity) && !isNaN(radius)) {
        map.current.setPaintProperty('retc-pulse', 'circle-opacity', opacity);
        map.current.setPaintProperty('retc-pulse', 'circle-radius', radius);
      }
    }
    animationRef.current = requestAnimationFrame(animatePulse);
  };

  const updateCursorState = (isHoveringIndustry) => {
    if (!map.current) return;
    map.current.getCanvas().style.cursor = isHoveringIndustry ? 'pointer' : (isScanMode ? 'crosshair' : '');
  };
  useEffect(() => { updateCursorState(false); }, [isScanMode]);

  useEffect(() => { if (isMapReady && mapData && map.current.getSource('retc-source')) { map.current.getSource('retc-source').setData(mapData); } }, [mapData, isMapReady]);
  useEffect(() => { if (isMapReady && currentLocation && radius) { updateMapAnalysisLogic(currentLocation.lng, currentLocation.lat, radius, mapData); } }, [radius, currentLocation, isMapReady, mapData]);

  useEffect(() => {
    if (isMapReady && flyToLocation) {
      const { lng, lat } = flyToLocation;
      map.current.flyTo({ center: [lng, lat], zoom: 13.5 });
      setCurrentLocation({ lng, lat });
      if (marker.current) marker.current.setLngLat([lng, lat]);
      else marker.current = new maplibregl.Marker({ color: '#f43f5e' }).setLngLat([lng, lat]).addTo(map.current);
      updateMapAnalysisLogic(lng, lat, radius || 3, mapData);
      setPopupInfo(null);
      setIsScanMode(true);
    }
  }, [flyToLocation, isMapReady]);

  const handleNewLocation = (lng, lat) => {
    setCurrentLocation({ lng, lat });
    if (marker.current) marker.current.setLngLat([lng, lat]);
    else marker.current = new maplibregl.Marker({ color: '#f43f5e' }).setLngLat([lng, lat]).addTo(map.current);
    updateMapAnalysisLogic(lng, lat, radius || 3, mapData);
    onLocationSelect({ lng, lat });
  };
  const closePopup = (e) => { e.stopPropagation(); setPopupInfo(null); };
  const toggleScanMode = () => { setIsScanMode(!isScanMode); };

  return (
    <div ref={mapContainer} className="w-full h-screen absolute top-0 left-0">
      <button
        onClick={toggleScanMode}
        // 🔴 AQUÍ ESTÁ EL CAMBIO DE POSICIÓN: top-20 right-4
        className={`absolute top-20 right-4 z-10 p-2.5 rounded-lg shadow-xl border transition-all duration-300 group ${isScanMode ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/20' : 'bg-slate-900/90 backdrop-blur border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'}`}
        title="Activar modo análisis"
      >
        <ScanEye size={20} className={isScanMode ? 'animate-pulse' : ''} />
      </button>

      {/* LEYENDA DE CLUSTERS - Responsiva */}
      <div className="absolute bottom-20 md:bottom-6 left-2 md:left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-2 md:p-3 shadow-xl max-w-[140px] md:max-w-none">
        <p className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1.5 md:mb-2">Densidad</p>
        <div className="flex flex-col gap-1 md:gap-1.5">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-cyan-600 border border-white/30 shrink-0"></div>
            <span className="text-[9px] md:text-[10px] text-slate-300">&lt; 100</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-violet-600 border border-white/30 shrink-0"></div>
            <span className="text-[9px] md:text-[10px] text-slate-300">100-500</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-rose-600 border border-white/30 shrink-0"></div>
            <span className="text-[9px] md:text-[10px] text-slate-300">&gt; 500</span>
          </div>
        </div>
        <div className="hidden md:block mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sky-300 border border-sky-500"></div>
            <span className="text-[10px] text-slate-400">Punto individual</span>
          </div>
        </div>
      </div>

      {popupInfo && (
        <div ref={popupRef} className="absolute top-0 left-0 z-50 pointer-events-none will-change-transform">
          <div className="transform -translate-x-1/2 -translate-y-[105%]">
            <div className="w-60 p-3 bg-slate-950/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 pointer-events-auto relative transition-all animate-in fade-in zoom-in-95 slide-in-from-bottom-2">
              <button onClick={closePopup} className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-500 rounded-full p-1 border border-slate-700 shadow-lg transition-all"><X size={12} /></button>
              <div className="mb-1">
                <h3 className="font-bold text-slate-100 text-xs leading-tight mb-0.5 pr-2">{popupInfo.properties.name}</h3>
                <span className="inline-block px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-cyan-400 tracking-wide uppercase">{popupInfo.properties.category}</span>
              </div>
              <div className="relative">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <MiniChart history={popupInfo.history} color="#22d3ee" />
              </div>
            </div>
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900/80 absolute left-1/2 -translate-x-1/2 bottom-[-6px] blur-[1px]"></div>
          </div>
        </div>
      )}
    </div>
  );
}