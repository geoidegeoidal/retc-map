import * as turf from '@turf/turf';

export const analyzeLocation = (userLocation, geoData, radiusInKm = 3) => {
  if (!geoData || !userLocation) return null;

  const from = turf.point([userLocation.lng, userLocation.lat]);
  
  // 1. Calcular distancia a todas las industrias
  const enrichedFeatures = geoData.features.map(feature => {
    const distance = turf.distance(from, feature, { units: 'kilometers' });
    return { ...feature, properties: { ...feature.properties, distance } };
  });

  // 2. Filtrar las que están dentro del radio seleccionado
  const featuresInRadius = enrichedFeatures.filter(f => f.properties.distance <= radiusInKm);

  // 3. IDENTIFICAR EL TOP 5 (Para no saturar el gráfico con 100 lineas)
  // Ordenamos por impacto total histórico (suma de todos sus años)
  const topEmitters = featuresInRadius.sort((a, b) => {
    const totalA = a.properties.history.reduce((sum, h) => sum + h.value, 0);
    const totalB = b.properties.history.reduce((sum, h) => sum + h.value, 0);
    return totalB - totalA; // De mayor a menor
  }).slice(0, 5); // Nos quedamos solo con las 5 más grandes

  // Extraemos los nombres para saber qué líneas dibujar luego
  const lineKeys = topEmitters.map(f => f.properties.name);

  // 4. PIVOTEAR DATOS (Transformación clave para el gráfico multi-línea)
  // Queremos: [{ year: 2019, "Empresa A": 100, "Empresa B": 50 }, ...]
  const years = [2019, 2020, 2021, 2022, 2023];
  
  const chartData = years.map(year => {
    // Creamos el objeto base del año
    const dataPoint = { year: year.toString() };
    
    // Rellenamos las columnas de cada empresa del Top 5
    topEmitters.forEach(industry => {
      const historyEntry = industry.properties.history.find(h => h.year === year);
      // Usamos el nombre de la empresa como la "llave" del valor
      dataPoint[industry.properties.name] = historyEntry ? historyEntry.value : 0;
    });

    return dataPoint;
  });

  // 5. Calcular la tendencia GENERAL de la zona (para el % del encabezado)
  // Sumamos el total del año 2019 vs 2023 de todas las del radio
  const total2019 = featuresInRadius.reduce((acc, ind) => acc + (ind.properties.history.find(h=>h.year===2019)?.value || 0), 0);
  const total2023 = featuresInRadius.reduce((acc, ind) => acc + (ind.properties.history.find(h=>h.year===2023)?.value || 0), 0);
  
  let trend = 0;
  if (total2019 > 0) trend = ((total2023 - total2019) / total2019) * 100;

  return {
    stats: {
      count: featuresInRadius.length,
      trend: trend,
      radius: radiusInKm
    },
    chartData: chartData,
    lineKeys: lineKeys, // <--- ESTO ES NUEVO: Le dice al gráfico qué lineas dibujar
    nearest: enrichedFeatures.sort((a, b) => a.properties.distance - b.properties.distance)[0]
  };
};