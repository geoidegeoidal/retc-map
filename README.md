# 🌍 EcoMap Chile: Monitor Ambiental Ciudadano

![Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Fast-646CFF?logo=vite&logoColor=white)

> **Democratizando el acceso a la información ambiental.**
> Una herramienta de inteligencia territorial open-source que visualiza, analiza y reporta el impacto industrial utilizando datos del RETC.

---

## 📸 Vistazo Rápido


![Dashboard Preview](https://via.placeholder.com/800x400.png?text=Inserta+aqui+captura+de+EcoMap)

---

## 🚀 Funcionalidades

EcoMap Chile transforma datos fríos en una experiencia interactiva y comprensible.

### 🗺️ Exploración Geoespacial
* **Mapa Vectorial Dark Mode:** Renderizado de alto rendimiento con **MapLibre GL JS**.
* **Buscador Inteligente:** Encuentra direcciones exactas en Chile usando la API de **Nominatim/OSM**.
* **Modo Escáner (Scan Mode):** Herramienta táctica que convierte el cursor en una mira para análisis puntuales en cualquier lugar del territorio.

### 🧠 Análisis en el Navegador (Serverless)
* **Buffers Dinámicos:** Cálculo matemático instantáneo de radios de impacto (1, 3 y 5 km) usando **Turf.js**.
* **Intersección Visual:** Líneas de conexión ("Spider Lines") y etiquetas de distancia neón que conectan tu ubicación con las industrias detectadas.
* **Feedback Reactivo:** Las industrias dentro del rango parpadean suavemente para facilitar su identificación.

### 📊 Storytelling & Datos
* **Dashboard Responsivo:** Panel lateral en escritorio y *Bottom Sheet* deslizable en móviles (estilo Google Maps).
* **Gráficos Históricos:** Visualización de la evolución de emisiones (últimos 5 años) de las Top 5 industrias de la zona.
* **Smart Report (IA):** Generación automática de resúmenes en lenguaje natural (*"Tendencia al alza del 38%..."*).
* **Tarjetas "Glassmorphism":** Popups flotantes con mini-gráficos al hacer clic en una industria.

### 🖨️ Reportabilidad
* **Motor de Exportación:** Genera capturas de alta resolución (PNG) o informes en PDF del estado actual del mapa, superando las limitaciones del contexto WebGL.

---

## 🛠️ Stack Tecnológico

El proyecto utiliza una arquitectura **Client-Side** moderna. No requiere backend activo; todo el procesamiento ocurre en el dispositivo del usuario.

| Área | Tecnología | Uso |
| :--- | :--- | :--- |
| **Core** | ![React](https://img.shields.io/badge/-React-black?logo=react) ![Vite](https://img.shields.io/badge/-Vite-black?logo=vite) | Framework y Build Tool. |
| **Estilos** | ![Tailwind](https://img.shields.io/badge/-Tailwind_CSS-black?logo=tailwindcss) | Diseño UI, Dark Mode y efectos de vidrio. |
| **Mapa** | **MapLibre GL JS** | Renderizado de mapas vectoriales (Fork libre de Mapbox). |
| **Geo-Cálculo** | **Turf.js** | Análisis espacial matemático (Buffers, Distancias). |
| **Datos** | **Recharts** | Gráficos estadísticos interactivos. |
| **Exportación** | **html2canvas + jsPDF** | Generación de reportes e imágenes. |
| **Iconos** | **Lucide React** | Iconografía vectorial ligera. |

---

## 💻 Instalación y Uso Local

Sigue estos pasos para correr el proyecto en tu máquina:

1.  **Clonar el repositorio**
    ```bash
    git clone [https://github.com/TU_USUARIO/retc-map.git](https://github.com/TU_USUARIO/retc-map.git)
    cd retc-map
    ```

2.  **Instalar dependencias**
    ```bash
    npm install
    # Si tienes problemas con versiones de React 19:
    npm install --legacy-peer-deps
    ```

3.  **Correr el servidor de desarrollo**
    ```bash
    npm run dev
    ```

4.  **Abrir en el navegador**
    Visita `http://localhost:5173`

---

## 📂 Estructura del Proyecto

```text
retc-map/
├── public/
│   └── retc_data.geojson  # Base de datos estática (Origen: RETC)
├── src/
│   ├── components/
│   │   ├── MapBoard.jsx   # Lógica del mapa, capas y WebGL
│   │   ├── HistoryChart.jsx # Gráficos con Recharts
│   │   ├── MiniChart.jsx  # Gráficos pequeños para popups
│   │   ├── SearchBar.jsx  # Autocompletado de direcciones
│   │   └── SmartReport.jsx # Generador de texto resumen
│   ├── utils/
│   │   └── analysis.js    # Cerebro matemático (Turf.js)
│   └── App.jsx            # Layout principal y orquestador
└── index.html
