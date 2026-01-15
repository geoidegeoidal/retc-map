import React, { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import MiniChart from './MiniChart';
import { X, ScanEye } from 'lucide-react';

export default function MapBoard({ mapData, onLocationSelect, flyToLocation, radius, highlightedName, highlightedIds }) {
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
  const [selectedYear, setSelectedYear] = useState(2024);
  // Filtros de tonelaje: todos activos por defecto (5 rangos)
  const [activeFilters, setActiveFilters] = useState({
    range1: true, // < 30
    range2: true, // 30-170
    range3: true, // 170-550
    range4: true, // 550-1700
    range5: true  // > 1700
  });
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
      clusterMaxZoom: 10,    // Clusters desaparecen antes (zoom 10) para ver puntos individuales
      clusterRadius: 30      // Radio menor para agrupar menos puntos
    });

    map.current.addLayer({ id: 'buffer-fill', type: 'fill', source: 'buffer-source', paint: { 'fill-color': '#10b981', 'fill-opacity': 0.1 } }, firstSymbolId);
    map.current.addLayer({ id: 'buffer-line', type: 'line', source: 'buffer-source', paint: { 'line-color': '#34d399', 'line-width': 2, 'line-dasharray': [2, 2] } }, firstSymbolId);

    // =====================================================
    // CLUSTERS - COLOR ÚNICO (sin diferenciación por cantidad)
    // =====================================================

    // CAPA 1: GLOW EXTERIOR
    map.current.addLayer({
      id: 'cluster-glow-outer',
      type: 'circle',
      source: 'retc-source',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#06b6d4',
        'circle-radius': [
          'step', ['get', 'point_count'],
          30, 100, 40, 500, 55
        ],
        'circle-opacity': 0.15,
        'circle-blur': 1
      }
    }, firstSymbolId);

    // CAPA 2: GLOW MEDIO
    map.current.addLayer({
      id: 'cluster-glow-mid',
      type: 'circle',
      source: 'retc-source',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#22d3ee',
        'circle-radius': [
          'step', ['get', 'point_count'],
          22, 100, 28, 500, 38
        ],
        'circle-opacity': 0.25,
        'circle-blur': 0.5
      }
    }, firstSymbolId);

    // CAPA 3: CÍRCULO PRINCIPAL
    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'retc-source',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#0891b2',
        'circle-radius': [
          'step', ['get', 'point_count'],
          14, 100, 18, 500, 24
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': 'rgba(255, 255, 255, 0.4)'
      }
    }, firstSymbolId);

    // CAPA 4: NÚCLEO BRILLANTE
    map.current.addLayer({
      id: 'cluster-core',
      type: 'circle',
      source: 'retc-source',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#ffffff',
        'circle-radius': [
          'step', ['get', 'point_count'],
          3, 100, 5, 500, 7
        ],
        'circle-opacity': 0.6,
        'circle-blur': 0.3
      }
    }, firstSymbolId);

    // ETIQUETAS DE CLUSTERS
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
          10, 100, 12, 500, 14
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

    // =====================================================
    // PUNTOS INDIVIDUALES - COLOREADOS POR TONELAJE
    // Quintiles: <30, 30-170, 170-550, 550-1700, >1700 ton
    // =====================================================

    // HITBOX (invisible, para clicks)
    map.current.addLayer({
      id: 'retc-points-hitbox',
      type: 'circle',
      source: 'retc-source',
      filter: ['!', ['has', 'point_count']],
      paint: { 'circle-color': 'transparent', 'circle-radius': 15 }
    });

    // PULSE (para animación)
    map.current.addLayer({
      id: 'retc-pulse', type: 'circle', source: 'retc-source',
      filter: ['all', ['!', ['has', 'point_count']], ['in', 'id_vu', '']],
      paint: { 'circle-color': '#f43f5e', 'circle-radius': 12, 'circle-opacity': 0, 'circle-blur': 0.4 }
    }, firstSymbolId);

    // HIGHLIGHT (para hover desde leyenda)
    map.current.addLayer({
      id: 'retc-highlight', type: 'circle', source: 'retc-source',
      filter: ['all', ['!', ['has', 'point_count']], ['==', 'name', '']],
      paint: { 'circle-color': 'transparent', 'circle-radius': 8, 'circle-stroke-width': 3, 'circle-stroke-color': '#fbbf24', 'circle-opacity': 1 }
    }, firstSymbolId);

    // GLOW POR TONELAJE
    map.current.addLayer({
      id: 'retc-glow',
      type: 'circle',
      source: 'retc-source',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'step', ['get', 'total_tonnage'],
          '#22c55e',      // Verde < 30
          30, '#84cc16',  // Lima 30-170
          170, '#eab308', // Amarillo 170-550
          550, '#f97316', // Naranja 550-1700
          1700, '#ef4444' // Rojo > 1700
        ],
        'circle-radius': 7,
        'circle-opacity': 0.25,
        'circle-blur': 0.5
      }
    }, firstSymbolId);

    // PUNTOS PRINCIPALES - COLOREADOS POR TONELAJE
    map.current.addLayer({
      id: 'retc-points',
      type: 'circle',
      source: 'retc-source',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'step', ['get', 'total_tonnage'],
          '#22c55e',      // Verde < 30 ton
          30, '#84cc16',  // Lima 30-170 ton
          170, '#eab308', // Amarillo 170-550 ton
          550, '#f97316', // Naranja 550-1700 ton
          1700, '#ef4444' // Rojo > 1700 ton
        ],
        'circle-radius': 4,
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(255,255,255,0.5)'
      }
    }, firstSymbolId);

    if (latestProps.current.mapData) map.current.getSource('retc-source').setData(latestProps.current.mapData);
  }, []);

  useEffect(() => {
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-70.6483, -33.4569],
      zoom: 12,
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

  // EFECTO PARA ACTUALIZAR COLORES Y TAMAÑOS DE PUNTOS SEGÚN AÑO SELECCIONADO
  useEffect(() => {
    if (!isMapReady || !map.current) return;

    const tonnageProperty = `tonnage_${selectedYear}`;

    // PALETA MÁS DISTINTIVA: Azul → Violeta → Magenta → Naranja → Rojo
    const colorExpression = [
      'step', ['get', tonnageProperty],
      '#3b82f6',      // Azul < 30
      30, '#8b5cf6',  // Violeta 30-170
      170, '#d946ef', // Magenta 170-550
      550, '#f97316', // Naranja 550-1700
      1700, '#dc2626' // Rojo intenso > 1700
    ];

    // TAMAÑO PROPORCIONAL AL TONELAJE
    const sizeExpression = [
      'step', ['get', tonnageProperty],
      3,              // Pequeño < 30
      30, 4,          // Medio-pequeño 30-170
      170, 5,         // Medio 170-550
      550, 7,         // Grande 550-1700
      1700, 10        // Muy grande > 1700
    ];

    const glowSizeExpression = [
      'step', ['get', tonnageProperty],
      5,              // Pequeño < 30
      30, 6,          // Medio-pequeño 30-170
      170, 8,         // Medio 170-550
      550, 10,        // Grande 550-1700
      1700, 14        // Muy grande > 1700
    ];

    // CONSTRUIR FILTRO BASADO EN RANGOS ACTIVOS
    const filterConditions = [];
    if (activeFilters.range1) filterConditions.push(['<', ['get', tonnageProperty], 30]);
    if (activeFilters.range2) filterConditions.push(['all', ['>=', ['get', tonnageProperty], 30], ['<', ['get', tonnageProperty], 170]]);
    if (activeFilters.range3) filterConditions.push(['all', ['>=', ['get', tonnageProperty], 170], ['<', ['get', tonnageProperty], 550]]);
    if (activeFilters.range4) filterConditions.push(['all', ['>=', ['get', tonnageProperty], 550], ['<', ['get', tonnageProperty], 1700]]);
    if (activeFilters.range5) filterConditions.push(['>=', ['get', tonnageProperty], 1700]);

    // Combinar filtros: mostrar si cumple cualquiera de los rangos activos Y no es un cluster
    const visibilityFilter = filterConditions.length > 0
      ? ['all', ['!', ['has', 'point_count']], ['any', ...filterConditions]]
      : ['all', ['!', ['has', 'point_count']], false]; // Ocultar todo si ningún filtro activo

    // Actualizar capa de puntos principales
    if (map.current.getLayer('retc-points')) {
      map.current.setPaintProperty('retc-points', 'circle-color', colorExpression);

      // Si hay IDs destacados, aumentar un poco su tamaño para que resalten más
      let finalSizeExpression = sizeExpression;
      if (highlightedIds && highlightedIds.length > 0) {
        const stringIds = highlightedIds.map(String);
        const isHighlighted = ['in', ['get', 'id_vu'], ['literal', stringIds]];

        // Stroke blanco brillante para los destacados
        map.current.setPaintProperty('retc-points', 'circle-stroke-color', '#ffffff');
        map.current.setPaintProperty('retc-points', 'circle-stroke-width', ['case', isHighlighted, 3, 0]);

        // Aumentar tamaño 50% si está destacado
        // Nota: MapLibre permite expresiones matemáticas con otras expresiones
        // Pero para mayor seguridad, dejaremos el tamaño base y confiaremos en el stroke grueso blanco
      } else {
        map.current.setPaintProperty('retc-points', 'circle-stroke-width', 0);
      }

      map.current.setPaintProperty('retc-points', 'circle-radius', sizeExpression);
      map.current.setFilter('retc-points', visibilityFilter);
    }
    // Actualizar capa de glow
    if (map.current.getLayer('retc-glow')) {
      map.current.setPaintProperty('retc-glow', 'circle-color', colorExpression);
      map.current.setPaintProperty('retc-glow', 'circle-radius', glowSizeExpression);
      map.current.setFilter('retc-glow', visibilityFilter);
    }
    // Actualizar hitbox también
    if (map.current.getLayer('retc-points-hitbox')) {
      map.current.setFilter('retc-points-hitbox', visibilityFilter);
    }
  }, [selectedYear, isMapReady, activeFilters, highlightedIds]);

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

      {/* LEYENDA CON SELECTOR DE AÑO Y FILTROS */}
      <div className="absolute bottom-20 md:bottom-6 left-2 md:left-4 z-10 bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl p-2 md:p-3 shadow-xl max-w-[170px] md:max-w-[200px]">
        {/* SELECTOR DE AÑO */}
        <div className="mb-2 pb-2 border-b border-white/10">
          <p className="text-[7px] md:text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-1">Seleccionar año de datos</p>
          <div className="flex gap-1">
            {[2021, 2022, 2023, 2024].map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded transition-all ${selectedYear === year
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* FILTRO POR TONELAJE - Clickeable */}
        <p className="text-[7px] md:text-[8px] text-slate-500 uppercase tracking-wider font-bold mb-1.5">Filtrar por toneladas ({selectedYear})</p>
        <div className="flex flex-col gap-1 md:gap-1.5">
          {/* Range 1: < 30 */}
          <button
            onClick={() => setActiveFilters(f => ({ ...f, range1: !f.range1 }))}
            className={`flex items-center gap-1.5 md:gap-2 w-full text-left transition-opacity ${activeFilters.range1 ? 'opacity-100' : 'opacity-40'}`}
          >
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-blue-500 border border-white/30 shrink-0"></div>
            <span className="text-[9px] md:text-[10px] text-slate-300">&lt; 30 ton</span>
          </button>
          {/* Range 2: 30-170 */}
          <button
            onClick={() => setActiveFilters(f => ({ ...f, range2: !f.range2 }))}
            className={`flex items-center gap-1.5 md:gap-2 w-full text-left transition-opacity ${activeFilters.range2 ? 'opacity-100' : 'opacity-40'}`}
          >
            <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-violet-500 border border-white/30 shrink-0"></div>
            <span className="text-[9px] md:text-[10px] text-slate-300">30-170 ton</span>
          </button>
          {/* Range 3: 170-550 */}
          <button
            onClick={() => setActiveFilters(f => ({ ...f, range3: !f.range3 }))}
            className={`flex items-center gap-1.5 md:gap-2 w-full text-left transition-opacity ${activeFilters.range3 ? 'opacity-100' : 'opacity-40'}`}
          >
            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-fuchsia-500 border border-white/30 shrink-0"></div>
            <span className="text-[9px] md:text-[10px] text-slate-300">170-550 ton</span>
          </button>
          {/* Range 4: 550-1700 */}
          <button
            onClick={() => setActiveFilters(f => ({ ...f, range4: !f.range4 }))}
            className={`flex items-center gap-1.5 md:gap-2 w-full text-left transition-opacity ${activeFilters.range4 ? 'opacity-100' : 'opacity-40'}`}
          >
            <div className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-full bg-orange-500 border border-white/30 shrink-0"></div>
            <span className="text-[9px] md:text-[10px] text-slate-300">550-1.7k ton</span>
          </button>
          {/* Range 5: > 1700 */}
          <button
            onClick={() => setActiveFilters(f => ({ ...f, range5: !f.range5 }))}
            className={`flex items-center gap-1.5 md:gap-2 w-full text-left transition-opacity ${activeFilters.range5 ? 'opacity-100' : 'opacity-40'}`}
          >
            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-red-600 border border-white/30 shrink-0"></div>
            <span className="text-[9px] md:text-[10px] text-slate-300">&gt; 1.7k ton</span>
          </button>
        </div>
        {/* Clusters */}
        <div className="hidden md:block mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-600 border border-white/30"></div>
            <span className="text-[10px] text-slate-400">Cluster (agrupados)</span>
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