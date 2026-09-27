"""
Try different Nominatim queries for The Nilgiris district to get a Polygon boundary.
Also merge all 4 zones into the existing zone_boundaries_cache.json.
"""
import urllib.request
import urllib.parse
import json
import time

headers = {'User-Agent': 'RescueArc-DisasterManagement-SIH/1.0 (contact: admin@rescuearc.gov.in)'}

def fetch(query, admin_type=None):
    """Fetch from Nominatim, optionally filtering by OSM type."""
    url = (
        f"https://nominatim.openstreetmap.org/search"
        f"?q={urllib.parse.quote(query)}"
        f"&format=geojson&polygon_geojson=1&limit=5"
    )
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=20) as res:
        data = json.loads(res.read().decode('utf-8'))
    return data.get('features', [])

# Try several query strings for Nilgiris
nilgiris_queries = [
    "Nilgiris District, Tamil Nadu, India",
    "The Nilgiris district, Tamil Nadu, India",
    "Nilgiri district, Tamil Nadu, India",
    "Ooty district, Tamil Nadu, India",
]

nilgiris_feat = None
for q in nilgiris_queries:
    print(f"Trying: {q}")
    try:
        feats = fetch(q)
        time.sleep(1.2)
        for feat in feats:
            gtype = feat.get('geometry', {}).get('type', '')
            print(f"  -> {gtype}: {feat.get('properties', {}).get('display_name', '')[:80]}")
            if gtype in ('Polygon', 'MultiPolygon'):
                nilgiris_feat = feat
                print(f"  ✓ Found valid polygon!")
                break
        if nilgiris_feat:
            break
    except Exception as e:
        print(f"  ERROR: {e}")
        time.sleep(1.2)

# Load what was already fetched
with open("scratch_boundaries.json") as f:
    results = json.load(f)

if nilgiris_feat:
    nilgiris_feat['properties']['zone_id'] = 'Z-TAMILNADU-NILGIRIS-01'
    results['Z-TAMILNADU-NILGIRIS-01'] = nilgiris_feat
    print(f"\nNilgiris polygon found and updated!")
else:
    print(f"\nWARNING: Could not find a polygon for Nilgiris. Will use a hand-drawn bounding box.")
    # Fallback: create a hand-drawn approximate bounding box polygon for The Nilgiris district
    # Bbox approx: 76.4 - 77.1 E, 11.1 - 11.7 N
    nilgiris_box = [
        [76.4, 11.1], [76.4, 11.7], [77.1, 11.7], [77.1, 11.1], [76.4, 11.1]
    ]
    results['Z-TAMILNADU-NILGIRIS-01'] = {
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [nilgiris_box]},
        "properties": {
            "zone_id": "Z-TAMILNADU-NILGIRIS-01",
            "display_name": "The Nilgiris District, Tamil Nadu, India",
            "note": "approximate bounding box - no OSM polygon available"
        }
    }

# Now merge into zone_boundaries_cache.json
cache_path = "frontend/src/data/zone_boundaries_cache.json"
with open(cache_path, encoding='utf-8') as f:
    cache = json.load(f)

existing_zone_ids = {
    feat.get('properties', {}).get('zone_id')
    for feat in cache.get('features', [])
}
print(f"\nExisting zone_ids in cache: {sorted(existing_zone_ids)}")

added = []
for zid, feat in results.items():
    if zid not in existing_zone_ids:
        feat['properties']['zone_id'] = zid
        cache['features'].append(feat)
        added.append(zid)
        print(f"  + Added {zid} ({feat['geometry']['type']})")
    else:
        print(f"  ~ Skipping {zid} (already exists)")

with open(cache_path, 'w', encoding='utf-8') as f:
    json.dump(cache, f, separators=(',', ':'))

print(f"\nDone. Added {len(added)} new zones: {added}")
print(f"Total features in cache: {len(cache['features'])}")
