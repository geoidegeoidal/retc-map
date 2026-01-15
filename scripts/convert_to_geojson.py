"""
Script para convertir datos SINADER de Excel a GeoJSON para EcoMap Chile.
Agrupa por establecimiento (id_vu) y crea histórico de toneladas por año.
"""
import pandas as pd
import json
from pathlib import Path

# Configuración
INPUT_FILE = Path(__file__).parent.parent / "gi-sinader-2021_2024-consolidado.xlsx"
OUTPUT_FILE = Path(__file__).parent.parent / "public" / "retc_data.geojson"

def main():
    print(f"📂 Leyendo archivo: {INPUT_FILE}")
    df = pd.read_excel(INPUT_FILE)
    
    print(f"   Registros totales: {len(df):,}")
    
    # Filtrar registros sin coordenadas válidas
    df = df.dropna(subset=['latitud', 'longitud'])
    df = df[(df['latitud'] != 0) & (df['longitud'] != 0)]
    print(f"   Registros con coordenadas válidas: {len(df):,}")
    
    # Agrupar toneladas por establecimiento y año
    grouped = df.groupby(['id_vu', 'año']).agg({
        'cantidad_toneladas': 'sum',
        'razon_social': 'first',
        'rubro': 'first',
        'latitud': 'first',
        'longitud': 'first',
        'comuna': 'first',
        'region': 'first'
    }).reset_index()
    
    # Obtener lista de años disponibles
    years = sorted(grouped['año'].unique())
    print(f"   Años disponibles: {years}")
    
    # Crear features GeoJSON
    features = []
    establishments = grouped['id_vu'].unique()
    print(f"   Establecimientos únicos: {len(establishments):,}")
    
    for id_vu in establishments:
        est_data = grouped[grouped['id_vu'] == id_vu]
        
        # Construir historial por año
        history = []
        for year in years:
            year_data = est_data[est_data['año'] == year]
            value = float(year_data['cantidad_toneladas'].sum()) if len(year_data) > 0 else 0
            history.append({"year": int(year), "value": round(value, 2)})
        
        # Obtener datos del establecimiento (primera fila)
        first_row = est_data.iloc[0]
        
        feature = {
            "type": "Feature",
            "properties": {
                "id_vu": str(id_vu),
                "name": str(first_row['razon_social']),
                "category": str(first_row['rubro']),
                "comuna": str(first_row['comuna']),
                "region": str(first_row['region']),
                "history": history
            },
            "geometry": {
                "type": "Point",
                "coordinates": [float(first_row['longitud']), float(first_row['latitud'])]
            }
        }
        features.append(feature)
    
    # Crear GeoJSON final
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    # Guardar archivo
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ GeoJSON generado exitosamente!")
    print(f"   📍 Archivo: {OUTPUT_FILE}")
    print(f"   📊 Total features: {len(features):,}")
    
    # Mostrar muestra de un feature
    if features:
        print(f"\n📋 Ejemplo de feature:")
        sample = features[0]
        print(f"   ID: {sample['properties']['id_vu']}")
        print(f"   Nombre: {sample['properties']['name']}")
        print(f"   Categoría: {sample['properties']['category']}")
        print(f"   Historial: {sample['properties']['history']}")

if __name__ == "__main__":
    main()
