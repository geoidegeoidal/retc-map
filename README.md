# 🌍 HuellaRETC: Monitor Ambiental Ciudadano

![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)
![MapLibre](https://img.shields.io/badge/MapLibre%20GL-4.x-396CB2?logo=mapbox&logoColor=white)

> **Democratizando el acceso a la información ambiental.**
> Explora generadores industriales, compara periodos y prepara reportes con datos de residuos no peligrosos del SINADER/RETC.

**[Inicio rápido](#inicio-rapido) · [Funcionalidades](#funcionalidades) · [Datos](#datos) · [Despliegue](#despliegue)**

> Los tonelajes describen residuos declarados: por sí solos no miden exposición, peligrosidad ni riesgo para la salud.

---

## 📸 Vistazo Rápido

![HuellaRETC Dashboard](public/ecomap_dashboard.png)
*Vista del mapa interactivo mostrando generadores industriales en la Región Metropolitana*

---

<a id="inicio-rapido"></a>
## 💻 Inicio rápido

**Requisitos:** Node.js `^20.19.0 || >=22.12.0` (según Vite en `package-lock.json`) y npm.

```bash
git clone https://github.com/geoidegeoidal/retc-map.git
cd retc-map
npm install
npm run dev
```

Abre la URL que indique Vite; con el puerto predeterminado, la ruta del proyecto es **http://localhost:5173/retc-map/**. El GeoJSON ya está incluido: no necesitas regenerar los datos para explorar el visor.

Si la instalación informa un conflicto de dependencias pares de React, revisa primero el mensaje. La alternativa `npm install --legacy-peer-deps` omite esa validación; úsala con esa limitación en cuenta, no como garantía de compatibilidad.

| Comando | Uso |
| :--- | :--- |
| `npm run dev` | Desarrollo local |
| `npm run build` | Generar `dist/` |
| `npm run preview` | Revisar localmente el build |
| `npm run lint` | Comprobaciones de ESLint |
| `npm test` | Ejecutar Vitest |

---

<a id="funcionalidades"></a>
## 🚀 Funcionalidades

HuellaRETC transforma datos oficiales de residuos industriales en una experiencia interactiva y comprensible.

### 🗺️ Exploración Geoespacial
* **Mapa Vectorial Dark Mode:** Renderizado de alto rendimiento con **MapLibre GL JS** v4.
* **11,444 Establecimientos:** Visualización de generadores industriales de residuos no peligrosos (2021-2024).
* **Clustering Inteligente:** Agrupación dinámica de puntos según el nivel de zoom.
* **Buscador Inteligente:** Encuentra direcciones exactas en Chile usando la API de **Nominatim/OSM**.
* **Modo Escáner (Scan Mode):** Herramienta táctica que activa análisis espacial al hacer clic en cualquier punto del mapa.

### 🧠 Análisis en el Navegador (100% Client-Side)
* **Buffers Dinámicos:** Cálculo matemático instantáneo con radios de 1, 3 y 5 km usando **Turf.js**.
* **Spider Lines (Líneas Neón):** Conexiones visuales desde tu ubicación hacia las industrias cercanas con etiquetas de distancia.
* **Feedback Reactivo:** Las industrias dentro del radio parpadean suavemente para facilitar su identificación.
* **Filtros Temporales:** Selector de año (2021-2024) para analizar evolución temporal.
* **Filtros por Tonelaje:** Filtra puntos según rangos de generación (<30t, 30-170t, 170-550t, 550-1.7K, >1.7K).

### 📊 Storytelling & Datos
* **Dashboard Responsivo:** Panel lateral con estadísticas y gráficos.
* **Gráficos Históricos:** Visualización de tendencias del Top 5 industrias del área seleccionada (2021-2024) con **Recharts**.
* **Leyenda Interactiva:** Hover en leyenda resalta industrias correspondientes en el mapa.
* **Smart Report:** Generación automática de resúmenes en lenguaje natural (*"Tendencia al alza del 38%..."*).
* **Mini-Charts en Popups:** Gráficos sparkline al hacer clic en una industria.

### 🖨️ Exportación Profesional
* **Reportes Multi-Página:** Exportación de informes completos de 2 páginas en formato vertical (portrait).
* **Página 1:** Métricas clave, snapshot del mapa, resumen analítico y tabla de Top 5 generadores.
* **Página 2:** Ranking gráfico Top 5, evolución temporal (2021-2024) e insights clave.
* **Exportar a PNG:** Captura de alta resolución (2 archivos separados por página).
* **Exportar a PDF:** Documento multi-página listo para imprimir o compartir.
* **Vista Cenital Automática:** Los mapas se exportan siempre en vista desde arriba (pitch=0°).
* **Contenido Adaptativo Móvil:** En dispositivos móviles, el reporte reemplaza el mapa por:
  - Peso en la región (% del total regional)
  - Densidad industrial (industrias/km²)
  - Principales rubros industriales (top 4)
  - Principales tipos de residuos LER (top 4)

### 🎓 Onboarding Interactivo
* **Modal de Bienvenida:** Introducción a funcionalidades con leyenda de colores.
* **Tutorial Guiado:** Tour paso a paso de las 4 funcionalidades principales.

---

## 🛠️ Stack Tecnológico

La aplicación utiliza una arquitectura **client-side**: el análisis y la exportación se ejecutan en el navegador, sin un backend propio. Esto no implica funcionamiento sin conexión: la búsqueda de direcciones utiliza Nominatim/OSM.

| Área | Tecnología | Versión | Uso |
| :--- | :--- | :--- | :--- |
| **Core** | React + Vite | 19 / 7.x | Framework moderno con HMR ultra-rápido |
| **Estilos** | Tailwind CSS | 3.4 | Diseño UI responsivo, Dark Mode |
| **Mapa** | MapLibre GL JS | 4.x | Mapas vectoriales WebGL (fork libre de Mapbox) |
| **Geo-Cálculo** | Turf.js | 7.x | Análisis espacial (buffers, distancias, intersecciones) |
| **Gráficos** | Recharts | 3.5 | Charts interactivos (LineChart, custom tooltips) |
| **Exportación** | html2canvas + jsPDF | 1.4 / 3.x | Generación de reportes PNG/PDF |
| **Iconos** | Lucide React | 0.344 | Iconografía vectorial consistente |
| **Utilidades** | clsx + tailwind-merge | 2.x | Composición de clases CSS |

---

## 📂 Estructura del Proyecto

```text
retc-map/
├── public/
│   └── retc_data.geojson         # 11,444 establecimientos (GeoJSON)
├── scripts/
│   └── convert_to_geojson.py     # Script de conversión SINADER → GeoJSON
├── src/
│   ├── components/
│   │   ├── MapBoard.jsx          # Mapa principal
│   │   │                         #   - Clustering, capas, popups
│   │   │                         #   - Scan Mode y Spider Lines
│   │   │                         #   - Leyenda interactiva
│   │   ├── HistoryChart.jsx      # Gráfico de tendencias Top 5
│   │   ├── MiniChart.jsx         # Sparklines para popups
│   │   ├── SearchBar.jsx         # Búsqueda con Nominatim API
│   │   ├── SmartReport.jsx       # Resumen en lenguaje natural
│   │   ├── ReportTemplate.jsx    # Plantilla para exportar PDF
│   │   ├── WelcomeModal.jsx      # Modal de bienvenida
│   │   └── TutorialOverlay.jsx   # Tutorial interactivo (4 pasos)
│   ├── utils/
│   │   └── analysis.js           # Lógica de análisis con Turf.js
│   │                             #   - Buffer analysis
│   │                             #   - Top 5 calculation
│   │                             #   - Trend calculation
│   ├── App.jsx                   # Orquestador principal
│   ├── App.css                   # Estilos específicos
│   ├── index.css                 # Estilos globales + Tailwind
│   └── main.jsx                  # Entry point
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

<a id="datos"></a>
## 🔄 Actualización de Datos

El visor consume [\`public/retc_data.geojson\`](public/retc_data.geojson), incluido en el repositorio. La regeneración es un paso independiente del uso de la aplicación.

El script espera el Excel consolidado `gi-sinader-2021_2024-consolidado.xlsx` en la raíz; ese archivo **no está incluido**. También requiere un entorno Python con `pandas` y un motor de lectura de XLSX. Prepara esos insumos antes de ejecutar la conversión.

### Script de Conversión

```bash
cd scripts
python convert_to_geojson.py
```

El script:
1. Lee el archivo Excel consolidado
2. Filtra registros con coordenadas válidas
3. Agrupa por establecimiento (`id_vu`) y año
4. Genera propiedades con tonelaje por año (`tonnage_2021`, `tonnage_2022`, etc.)
5. Exporta a `public/retc_data.geojson`

### Estructura del GeoJSON

```json
{
  "type": "Feature",
  "properties": {
    "id_vu": "123456",
    "name": "Razón Social",
    "category": "Rubro Industrial",
    "comuna": "Santiago",
    "region": "Metropolitana",
    "total_tonnage": 1234.56,
    "tonnage_2021": 300.00,
    "tonnage_2022": 320.00,
    "tonnage_2023": 290.00,
    "tonnage_2024": 324.56,
    "history": [
      {"year": 2021, "value": 300.00},
      {"year": 2022, "value": 320.00},
      {"year": 2023, "value": 290.00},
      {"year": 2024, "value": 324.56}
    ]
  },
  "geometry": {
    "type": "Point",
    "coordinates": [-70.6506, -33.4372]
  }
}
```

---

<a id="despliegue"></a>
## 🚀 Despliegue

### GitHub Pages

El proyecto está configurado para desplegar a GitHub Pages:

```bash
npm run deploy
```

Este comando ejecuta `vite build` y despliega la carpeta `dist/` usando `gh-pages`.

### Build de Producción

```bash
npm run build     # Genera bundle en /dist
npm run preview   # Preview local del build
```

---

## 📊 Fuente de Datos

| Fuente | Descripción |
| :--- | :--- |
| **RETC** | Registro de Emisiones y Transferencia de Contaminantes |
| **SINADER** | Sistema Nacional de Declaración de Residuos |
| **Periodo** | 2021 - 2024 |
| **Categoría** | Generadores Industriales (GI) de residuos no peligrosos |

---

## 📄 Licencia

Este proyecto declara licencia MIT en su documentación. El archivo `LICENSE` aún no está incluido en el repositorio; consulta al autor para confirmar los términos antes de redistribuirlo. Esta nota no añade ni modifica una licencia.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor abre un Issue o Pull Request.

---

<p align="center">
  <sub>Desarrollado con 💚 para democratizar el acceso a la información ambiental en Chile.</sub>
</p>
