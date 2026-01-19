# 🌍 HuellaRETC: Monitor Ambiental Ciudadano

![Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)
![MapLibre](https://img.shields.io/badge/MapLibre%20GL-4.x-396CB2?logo=mapbox&logoColor=white)

> **Democratizando el acceso a la información ambiental.**
> Una herramienta de inteligencia territorial open-source que visualiza, analiza y reporta el impacto de la generación de residuos industriales utilizando datos del SINADER/RETC.

---

## 📸 Vistazo Rápido

![HuellaRETC Dashboard](public/ecomap_dashboard.png)
*Vista del mapa interactivo mostrando generadores industriales en la Región Metropolitana*

---

## 🚀 Funcionalidades

EcoMap Chile transforma datos oficiales de residuos industriales en una experiencia interactiva y comprensible.

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
* **Exportar a PNG:** Captura de alta resolución del reporte de análisis.
* **Exportar a PDF:** Informes completos con métricas, mapa, tabla de Top 5 y tendencias.
* **Vista Cenital Automática:** Los mapas se exportan siempre en vista desde arriba (pitch=0°), sin inclinación, para máxima legibilidad en reportes impresos.

### 🎓 Onboarding Interactivo
* **Modal de Bienvenida:** Introducción a funcionalidades con leyenda de colores.
* **Tutorial Guiado:** Tour paso a paso de las 4 funcionalidades principales.

---

## 🛠️ Stack Tecnológico

El proyecto utiliza una arquitectura **100% Client-Side**. No requiere backend; todo el procesamiento ocurre en el dispositivo del usuario.

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
│   │   ├── MapBoard.jsx          # Mapa principal (618 líneas)
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

## 💻 Instalación y Uso Local

### Requisitos Previos
- Node.js 18+
- npm o pnpm

### Pasos

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/geoidegeoidal/retc-map.git
   cd retc-map
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```
   > Si hay problemas con peer dependencies de React 19:
   > ```bash
   > npm install --legacy-peer-deps
   > ```

3. **Correr el servidor de desarrollo**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**
   ```
   http://localhost:5173
   ```

---

## 🔄 Actualización de Datos

Los datos provienen del archivo Excel consolidado `gi-sinader-2021_2024-consolidado.xlsx` (SINADER/RETC).

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

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor abre un Issue o Pull Request.

---

<p align="center">
  <sub>Desarrollado con 💚 para democratizar el acceso a la información ambiental en Chile.</sub>
</p>
