# check_roads.py
import config
from infra_data import fetch_state_pbf, load_osm_layers

print("Region:", config.ACTIVE_REGION, "| State:", config.STATE)
pbf = fetch_state_pbf(config.STATE, config.GEOFABRIK_DIR, region=config.ACTIVE_REGION)
print("PBF path:", pbf)

roads, facilities = load_osm_layers(pbf, config.BBOX_WGS84)
print("Roads found:", len(roads) if roads is not None else "None")
print("Facilities found:", len(facilities) if facilities is not None else "None")