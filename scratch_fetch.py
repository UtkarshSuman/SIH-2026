import urllib.request
import urllib.parse
import json
import time

queries = {
    'Z-KERALA-IDUKKI-01': ('Idukki, Kerala, India', 76.9700, 9.8500),
    'Z-ASSAM-DHEMAJI-01': ('Dhemaji, Assam, India', 94.5900, 27.4800),
    'Z-GUJARAT-KUTCH-01': ('Kachchh, Gujarat, India', 69.8500, 23.7300),
    'Z-TAMILNADU-NILGIRIS-01': ('The Nilgiris, Tamil Nadu, India', 76.7000, 11.4100)
}

headers = {'User-Agent': 'RescueArc-DisasterManagement-SIH/1.0 (contact: admin@rescuearc.gov.in)'}

results = {}

for zid, (q, lon, lat) in queries.items():
    print(f"Querying for {zid}: {q}...")
    url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(q)}&format=geojson&polygon_geojson=1&limit=1"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            data = json.loads(res.read().decode('utf-8'))
            feats = data.get('features', [])
            if feats:
                feat = feats[0]
                geom = feat.get('geometry', {})
                print(f"  -> SUCCESS: {geom.get('type')}, coords: {len(geom.get('coordinates', []))}")
                # Attach properties consistent with existing zone_boundaries_cache.json
                feat['properties']['zone_id'] = zid
                results[zid] = feat
            else:
                print(f"  -> FAILED: No features")
    except Exception as e:
        print(f"  -> ERROR: {e}")
    time.sleep(1.2) # polite rate limiting for OSM

print(f"Total fetched: {len(results)}")
with open("scratch_boundaries.json", "w") as f:
    json.dump(results, f)
