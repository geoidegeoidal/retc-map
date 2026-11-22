"""Convert the official annual SINADER GI Excel books to the viewer's GeoJSON."""
import argparse
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation
import hashlib
import json
from pathlib import Path
from python_calamine import CalamineWorkbook

CATALOG = "https://datosretc.mma.gob.cl/dataset/residuos"
ROOT = Path(__file__).resolve().parents[1]


def clean(value):
    return " ".join(str(value or "").split())


def decimal(value):
    try:
        result = Decimal(str(value))
        return result if result.is_finite() else None
    except InvalidOperation:
        return None


def coordinates(lon, lat):
    if isinstance(lon, (int, float)) and isinstance(lat, (int, float)):
        # Chilean mainland, islands and the far south; reject swapped, zero and overseas points.
        if -113 <= lon <= -65 and -57 <= lat <= -17:
            return round(lon, 6), round(lat, 6)
    return None


def aggregate(rows, year):
    cols = {clean(label).lower(): i for i, label in enumerate(next(rows))}
    fields = ('año', 'id_vu', 'cantidad_toneladas', 'nombre_establecimiento',
              'razon_social', 'longitud', 'latitud', 'region', 'comuna', 'rubro',
              'ler_subcapitulo', 'rol_establecimiento', 'tipo_recepcion')
    missing = set(fields) - cols.keys()
    if missing:
        raise ValueError(f"{year}: missing columns {sorted(missing)}")
    establishments = {}
    audit = Counter(rows=0, non_generator_or_inflow=0, invalid_id_or_tonnage=0,
                    unlocated_rows=0, ambiguous_locations=0, flagged=0)
    source = Decimal(0)
    for row in rows:
        def cell(key):
            i = cols.get(key)
            return row[i] if i is not None and i < len(row) else None

        if not any(row):
            continue
        audit['rows'] += 1
        if decimal(cell('año')) != year:
            raise ValueError(f"{year}: unexpected row year at data row {audit['rows']}")
        flow = cell('tipo_recepcion')
        if clean(cell('rol_establecimiento')).lower() != 'generador industrial' or (
            flow not in (None, '') and decimal(flow) != 2
        ):
            audit['non_generator_or_inflow'] += 1
            continue
        amount = decimal(cell('cantidad_toneladas'))
        key = decimal(cell('id_vu'))
        if key is None or key <= 0 or key != key.to_integral_value() or amount is None:
            audit['invalid_id_or_tonnage'] += 1
            continue
        meta = establishments.setdefault(str(int(key)), [Decimal(0), Counter(), Counter(), set()])
        meta[0] += amount
        source += amount
        audit['flagged'] += int(decimal(cell('es_outlier')) == 1)
        name = clean(cell('nombre_establecimiento')) or clean(cell('razon_social'))
        meta[2][(name, clean(cell('rubro')))] += 1
        xy = coordinates(cell('longitud'), cell('latitud'))
        if xy:
            meta[1][(*xy, clean(cell('region')), clean(cell('comuna')))] += 1
        else:
            audit['unlocated_rows'] += 1
        residue = clean(cell('ler_subcapitulo'))
        if residue:
            meta[3].add(residue)

    retained = {}
    unmapped = Decimal(0)
    for key, (tonnes, places, labels, residues) in establishments.items():
        if not places:
            unmapped += tonnes
            continue
        audit['ambiguous_locations'] += int(len(places) > 1)
        lng, lat, region, comuna = places.most_common(1)[0][0]
        name, category = labels.most_common(1)[0][0]
        retained[key] = (tonnes, (lng, lat, region, comuna), name, category, sorted(residues))
    mapped = sum((r[0] for r in retained.values()), Decimal(0))
    if not retained or mapped + unmapped != source:
        raise ValueError(f"{year}: invalid aggregate")
    audit.update(located_sites=len(retained), unlocated_sites=len(establishments)-len(retained),
                 positive_sites=sum(record[0] > 0 for record in retained.values()))
    return retained, dict(audit, source_t=float(source), mapped_t=float(mapped), unmapped_t=float(unmapped))


def build(source_dir, entries):
    by_site = defaultdict(dict)
    provenance = {}
    for entry in sorted(entries, key=lambda e: e['year']):
        year = entry['year']
        paths = [p for p in source_dir.glob(f"{year}.*") if p.suffix.lower() in ('.xlsx', '.download')]
        if len(paths) != 1 or year in provenance:
            raise ValueError(f"{year}: expected exactly one workbook and source record")
        path = paths[0]
        book = CalamineWorkbook.from_path(path)
        records, audit = aggregate(book.get_sheet_by_name('Datos').iter_rows(), year)
        with path.open('rb') as raw:
            provenance[year] = dict(audit, url=entry['url'], sha256=hashlib.file_digest(raw, 'sha256').hexdigest())
        for key, record in records.items():
            by_site[key][year] = record
        print(year, audit, flush=True)

    features = []
    for key, records in sorted(by_site.items(), key=lambda item: int(item[0])):
        _, latest, name, category, residues = records[max(records)]
        props = dict(id_vu=key, name=name or f"Establecimiento {key}", region=latest[2], comuna=latest[3],
                     category=category, residue_types=residues)
        locations, details = {}, {}
        for year, (tonnes, place, annual_name, rubro, types) in records.items():
            props[f"tonnage_{year}"] = float(tonnes)
            if place != latest:
                locations[year] = place
            if (annual_name, rubro, types) != (name, category, residues):
                details[year] = [annual_name or props['name'], rubro, types]
        if locations:
            props['locations'] = locations
        if details:
            props['annual_details'] = details
        features.append(dict(type="Feature", properties=props, geometry=dict(type="Point", coordinates=latest[:2])))
    return dict(type="FeatureCollection", years=sorted(provenance), source=CATALOG, license="ODbL-1.0",
                coverage=provenance, features=features)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source_dir", type=Path)
    parser.add_argument("sources", type=Path, help="JSON list of {year, url} from the RETC catalogue")
    parser.add_argument("--output", type=Path, default=ROOT / "public" / "retc_data.geojson")
    args = parser.parse_args()
    entries = json.loads(args.sources.read_text(encoding="utf-8-sig"))
    dataset = build(args.source_dir, entries)
    if args.output.exists():
        parser.error("Output file already exists: validate a separate candidate before replacing it.")
    with args.output.open('x', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, allow_nan=False, separators=(',', ':'))
    print(f"{len(dataset['features']):,} sites across {len(dataset['years'])} years", flush=True)


if __name__ == "__main__":
    main()
