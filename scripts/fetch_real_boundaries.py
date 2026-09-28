import httpx
import json
import time
import sys

headers = {
    'User-Agent': 'RescueArc-DisasterRelocation/1.0 (GIS Disaster Management Platform)',
    'Accept': 'application/json'
}

queries = {
    'Z-ODISHA-KENDRAPARA-01': ['Kendrapara District, Odisha', 'Kendrapara, Odisha'],
    'Z-ANDHRA-KRISHNA-01': ['Krishna District, Andhra Pradesh', 'Machilipatnam, Andhra Pradesh'],
    'Z-WESTBENGAL-SUNDARBANS-01': ['South 24 Parganas, West Bengal', 'Sundarbans National Park'],
    'Z-MANIPUR-CHURACHANDPUR-01': ['Churachandpur District, Manipur', 'Churachandpur, Manipur'],
    'Z-RAJASTHAN-BARMER-01': ['Barmer District, Rajasthan', 'Barmer, Rajasthan'],
    'Z-MEGHALAYA-CHERRAPUNJI-01': ['East Khasi Hills, Meghalaya', 'Cherrapunji, Meghalaya', 'Sohra, Meghalaya'],
    'Z-TAMILNADU-NAGAPATTINAM-01': ['Nagapattinam District, Tamil Nadu', 'Nagapattinam, Tamil Nadu'],
    'Z-ASSAM-MAJULI-01': ['Majuli District, Assam', 'Majuli, Assam'],
    'Z-UTTARAKHAND-KEDARNATH-01': ['Rudraprayag District, Uttarakhand', 'Kedarnath, Uttarakhand'],
    'Z-GUJARAT-SURAT-01': ['Surat District, Gujarat', 'Surat, Gujarat'],
    'Z-HIMACHAL-KULLU-01': ['Kullu District, Himachal Pradesh', 'Kullu, Himachal Pradesh'],
    'Z-MAHARASHTRA-RAIGAD-01': ['Raigad District, Maharashtra', 'Raigad, Maharashtra']
}

matched_features = {}

for zid, q_list in queries.items():
    found = False
    for q in q_list:
        time.sleep(1.0)
        params = {
            'q': q,
            'format': 'geojson',
            'polygon_geojson': '1',
            'countrycodes': 'in',
            'limit': '1'
        }
        try:
            r = httpx.get('https://nominatim.openstreetmap.org/search', params=params, headers=headers, timeout=15)
            if r.status_code == 200:
                data = r.json()
                for feat in data.get('features', []):
                    geom = feat.get('geometry', {})
                    gtype = geom.get('type')
                    if gtype in ('Polygon', 'MultiPolygon'):
                        coords = geom.get('coordinates', [])
                        pts = len(coords[0]) if gtype == 'Polygon' else len(coords[0][0])
                        disp_name = feat.get('properties', {}).get('display_name', '')
                        print(f"SUCCESS: {zid} -> {gtype} ({pts} pts) | {disp_name[:60]}")
                        
                        # Store feature with zone_id
                        feature_copy = dict(feat)
                        if 'properties' not in feature_copy:
                            feature_copy['properties'] = {}
                        feature_copy['properties']['zone_id'] = zid
                        feature_copy['properties']['display_name'] = disp_name
                        matched_features[zid] = feature_copy
                        found = True
                        break
        except Exception as e:
            print(f"{zid} query '{q}' error: {e}")
        if found:
            break
    if not found:
        print(f"FAILED: {zid}")

print(f"\nTotal matched: {len(matched_features)} / {len(queries)}")

# Save to temporary json
with open('c:/Users/utkar/SIH/sih-main/scripts/fetched_boundaries.json', 'w', encoding='utf-8') as f:
    json.dump(matched_features, f, indent=2)
print("Saved to scripts/fetched_boundaries.json")
