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
  // Queremos: [{ year: 2021, "Empresa A": 100, "Empresa B": 50 }, ...]
  const years = [2021, 2022, 2023, 2024];

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
  // Sumamos el total del año 2021 vs 2024 de todas las del radio
  const total2021 = featuresInRadius.reduce((acc, ind) => acc + (ind.properties.history.find(h => h.year === 2021)?.value || 0), 0);
  const total2024 = featuresInRadius.reduce((acc, ind) => acc + (ind.properties.history.find(h => h.year === 2024)?.value || 0), 0);

  let trend = 0;
  if (total2021 > 0) trend = ((total2024 - total2021) / total2021) * 100;

  // 6. NUEVO: Calcular total REGIONAL para el insight de Concentración
  // Usamos la región de la industria más cercana como referencia
  const nearestIndustry = enrichedFeatures.sort((a, b) => a.properties.distance - b.properties.distance)[0];
  const targetRegion = nearestIndustry?.properties?.region || null;

  // Sumar todas las toneladas de esa región (de todos los años)
  let regionalTotal = 0;
  let regionalName = targetRegion;
  if (targetRegion) {
    geoData.features.forEach(f => {
      if (f.properties.region === targetRegion) {
        const total = f.properties.history?.reduce((sum, h) => sum + h.value, 0) || 0;
        regionalTotal += total;
      }
    });
  }

  // Calcular total del Top 5 de la zona
  const top5Total = topEmitters.reduce((acc, f) => {
    return acc + f.properties.history.reduce((sum, h) => sum + h.value, 0);
  }, 0);

  // 7. NUEVO: Distribución por RUBROS (categorías industriales)
  const categoryCount = {};
  featuresInRadius.forEach(f => {
    const cat = f.properties.category || 'Sin clasificar';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // 8. NUEVO: Principales TIPOS DE RESIDUOS (LER)
  const residueCount = {};
  featuresInRadius.forEach(f => {
    const residuesStr = f.properties.residues || '';
    // Los residuos pueden venir separados por comas o punto y coma
    const residueList = residuesStr.split(/[,;]/).map(r => r.trim()).filter(r => r.length > 0);
    residueList.forEach(res => {
      // Tomar solo los primeros 40 caracteres para evitar textos muy largos
      const shortRes = res.length > 40 ? res.substring(0, 37) + '...' : res;
      residueCount[shortRes] = (residueCount[shortRes] || 0) + 1;
    });
  });
  const topResidues = Object.entries(residueCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    stats: {
      count: featuresInRadius.length,
      trend: trend,
      radius: radiusInKm,
      regionalTotal: regionalTotal,
      regionalName: regionalName,
      top5Total: top5Total,
      topCategories: topCategories,
      topResidues: topResidues
    },
    chartData: chartData,
    lineKeys: lineKeys,
    nearest: nearestIndustry,
    topIds: topEmitters.map(f => f.properties.id_vu)
  };
};