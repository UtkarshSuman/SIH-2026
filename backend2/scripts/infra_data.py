# infra_data.py
import os
import requests
import geopandas as gpd
from pyrosm import OSM

# Geofabrik only publishes India extracts at the zone level, not per-state.
# Map each state to its zone so multiple states sharing a zone reuse one
# cached download instead of fetching the same bytes under different names.
GEOFABRIK_ZONE_URLS = {
    "northern-zone": "https://download.geofabrik.de/asia/india/northern-zone-latest.osm.pbf",
    "north-eastern-zone": "https://download.geofabrik.de/asia/india/north-eastern-zone-latest.osm.pbf",
    "eastern-zone": "https://download.geofabrik.de/asia/india/eastern-zone-latest.osm.pbf",
    "central-zone": "https://download.geofabrik.de/asia/india/central-zone-latest.osm.pbf",
    "western-zone": "https://download.geofabrik.de/asia/india/western-zone-latest.osm.pbf",
    "southern-zone": "https://download.geofabrik.de/asia/india/southern-zone-latest.osm.pbf",
}

STATE_TO_ZONE = {
    "uttarakhand": "northern-zone",
    "himachal-pradesh": "northern-zone",
    "assam": "north-eastern-zone",
    "odisha": "eastern-zone",
    "west-bengal": "eastern-zone",
    "gujarat": "western-zone",
    "kerala": "southern-zone",
    "tamil-nadu": "southern-zone",
}

REGION_ZONE_OVERRIDES = {
    "joshimath": "central-zone",   # Chamoli district falls in Central Zone, not Northern
}

def fetch_state_pbf(state, out_dir, region=None):
    zone = REGION_ZONE_OVERRIDES.get(region, STATE_TO_ZONE[state])
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{zone}-latest.osm.pbf")
    if os.path.exists(out_path):
        print(f"Zone PBF already cached at {out_path}")
        return out_path

    url = GEOFABRIK_ZONE_URLS[zone]
    print(f"Downloading {url} (zone-level file, ~100-500MB, please wait)...")
    with requests.get(url, stream=True, timeout=600) as r:
        r.raise_for_status()
        with open(out_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 1024):
                f.write(chunk)
    print(f"Saved to {out_path}")
    return out_path

def load_osm_layers(pbf_path, bbox_wgs84):
    minx, miny, maxx, maxy = bbox_wgs84
    osm = OSM(pbf_path, bounding_box=[minx, miny, maxx, maxy])
    roads_gdf = osm.get_network(network_type="driving")
    facilities_gdf = osm.get_pois(custom_filter={"amenity": ["hospital", "clinic", "doctors"]})

    if roads_gdf is None or roads_gdf.empty:
        raise RuntimeError(
            f"No road network found in bbox {bbox_wgs84}. "
            f"Check that the PBF ({pbf_path}) actually covers this bbox, "
            f"and that the bbox isn't too small/rural for 'driving' ways."
        )
    if facilities_gdf is None or facilities_gdf.empty:
        print(f"WARNING: no healthcare POIs found in bbox {bbox_wgs84} — "
              f"dist_to_hospital_m will be based on empty data downstream.")
        facilities_gdf = gpd.GeoDataFrame(geometry=[], crs="EPSG:4326")

    return roads_gdf, facilities_gdf

def distance_to_nearest_road(villages_gdf, roads_gdf):
    roads_gdf = roads_gdf.to_crs(villages_gdf.crs)
    villages_gdf["dist_to_road_m"] = villages_gdf.geometry.distance(roads_gdf.geometry.unary_union)
    return villages_gdf


def distance_to_nearest_hospital(villages_gdf, facilities_gdf):
    facilities_gdf = facilities_gdf.to_crs(villages_gdf.crs)
    villages_gdf["dist_to_hospital_m"] = villages_gdf.geometry.distance(facilities_gdf.geometry.unary_union)
    return villages_gdf