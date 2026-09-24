import os
from dotenv import load_dotenv

load_dotenv()
OPENTOPO_API_KEY = os.environ["OPENTOPO_API_KEY"]

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_DIR = os.path.join(BASE_DIR, "DataSet")

# ---------------------------------------------------------------------
# REGION DEFINITIONS — add a new dict entry here for each new region.
# Flip ACTIVE_REGION to switch which one the whole pipeline runs against.
# ---------------------------------------------------------------------
REGIONS = {
    "joshimath": {
        "crs": "EPSG:32644",  # UTM 44N
        "slope_breaks": {
            "low": (0, 10),
            "moderate": (10, 25),
            "high": (25, 999),
        },
        "bbox_wgs84": (79.40, 30.40, 79.75, 30.70),  # minx, miny, maxx, maxy
        "state": "uttarakhand",
    },
    "wayanad": {
        "crs": "EPSG:32643",  # UTM 43N
        "slope_breaks": {
            "low": (0, 15),
            "moderate": (15, 30),
            "high": (30, 999),
        },
        "bbox_wgs84": (75.70, 11.35, 76.55, 11.90),  # minx, miny, maxx, maxy — padded
        "state": "kerala",
    },
    "kendrapara": {
        "crs": "EPSG:32645",  # UTM 45N
        "slope_breaks": {
            "low": (0, 1),
            "moderate": (1, 2),
            "high": (2, 999),
        },
        "bbox_wgs84": (86.00, 20.20, 86.50, 20.60),  # minx, miny, maxx, maxy — padded
        "state": "odisha",
    },
    "puri": {
        "crs": "EPSG:32645",  # UTM 45N, same zone as Kendrapara
        "slope_breaks": {
            "low": (0, 1),
            "moderate": (1, 2),
            "high": (2, 999),
        },
        "bbox_wgs84": (84.48, 19.40, 86.45, 20.50),  # padded slightly beyond official district extent (84.483,19.467,86.417,20.443) for buffer safety, same convention as other regions
        "state": "odisha",
    },
    "khordha": {
        "crs": "EPSG:32645",  # UTM 45N, same zone as Kendrapara/Puri
        "slope_breaks": {
            "low": (0, 1),
            "moderate": (1, 2),
            "high": (2, 999),
        },
        "bbox_wgs84": (85.55, 19.90, 86.05, 20.35),  # minx, miny, maxx, maxy — covers Bhubaneswar
        "state": "odisha",
    },
    "cuttack": {
        "crs": "EPSG:32645",
        "slope_breaks": {
            "low": (0, 1),
            "moderate": (1, 2),
            "high": (2, 999),
        },
        "bbox_wgs84": (85.65, 20.20, 86.15, 20.65),
        "state": "odisha",
    },
    "ganjam": {
        "crs": "EPSG:32645",
        "slope_breaks": {
            "low": (0, 1),
            "moderate": (1, 2),
            "high": (2, 999),
        },
        "bbox_wgs84": (84.55, 19.15, 85.35, 19.95),
        "state": "odisha",
    },
    "mayurbhanj": {
        "crs": "EPSG:32645",
        "slope_breaks": {
            "low": (0, 5),
            "moderate": (5, 15),
            "high": (15, 999),
        },
        "bbox_wgs84": (85.85, 21.60, 86.85, 22.45),
        "state": "odisha",
    },
    "bhadrak": {
        "crs": "EPSG:32645",
        "slope_breaks": {"low": (0, 1), "moderate": (1, 2), "high": (2, 999)},
        "bbox_wgs84": (86.30, 20.95, 86.75, 21.35),
        "state": "odisha",
    },
    "angul": {
        "crs": "EPSG:32645",
        "slope_breaks": {"low": (0, 5), "moderate": (5, 15), "high": (15, 999)},
        "bbox_wgs84": (84.60, 20.55, 85.40, 21.20),
        "state": "odisha",
    },
    "gajapati": {
        "crs": "EPSG:32645",
        "slope_breaks": {"low": (0, 10), "moderate": (10, 25), "high": (25, 999)},
        "bbox_wgs84": (83.85, 18.60, 84.55, 19.35),
        "state": "odisha",
    },
    "bargarh": {
        "crs": "EPSG:32645",
        "slope_breaks": {"low": (0, 2), "moderate": (2, 5), "high": (5, 999)},
        "bbox_wgs84": (83.15, 20.85, 83.95, 21.55),
        "state": "odisha",
    },
    "uttarkashi": {
        "crs": "EPSG:32644",
        "slope_breaks": {"low": (0, 10), "moderate": (10, 25), "high": (25, 999)},
        "bbox_wgs84": (77.65, 30.30, 79.10, 31.35),
        "state": "uttarakhand",
    },
    "idukki": {
        "crs": "EPSG:32643",
        "slope_breaks": {"low": (0, 15), "moderate": (15, 30), "high": (30, 999)},
        "bbox_wgs84": (76.55, 9.45, 77.55, 10.45),
        "state": "kerala",
    },
    "darjeeling": {
        "crs": "EPSG:32645",
        "slope_breaks": {"low": (0, 12), "moderate": (12, 28), "high": (28, 999)},
        "bbox_wgs84": (87.90, 26.65, 88.65, 27.20),
        "state": "west-bengal",
    },
    "nilgiris": {
        "crs": "EPSG:32643",
        "slope_breaks": {"low": (0, 15), "moderate": (15, 30), "high": (30, 999)},
        "bbox_wgs84": (76.35, 11.10, 77.05, 11.85),
        "state": "tamil-nadu",
    },
    "dhemaji": {
        "crs": "EPSG:32646",
        "slope_breaks": {"low": (0, 1), "moderate": (1, 2), "high": (2, 999)},
        "bbox_wgs84": (94.10, 27.20, 95.30, 28.00),
        "state": "assam",
    },
    "kutch": {
        "crs": "EPSG:32642",
        "slope_breaks": {"low": (0, 1), "moderate": (1, 2), "high": (2, 999)},
        "bbox_wgs84": (68.00, 22.40, 71.90, 24.80),
        "state": "gujarat",
    },
    "kullu": {
        "crs": "EPSG:32643",
        "slope_breaks": {"low": (0, 10), "moderate": (10, 25), "high": (25, 999)},
        "bbox_wgs84": (76.75, 31.55, 78.00, 32.60),
        "state": "himachal-pradesh",
    },
}

ACTIVE_REGION = "joshimath"   # <-- change this one line to switch regions

_region = REGIONS[ACTIVE_REGION]
TARGET_CRS_UTM = _region["crs"]
SLOPE_CLASS_BREAKS = _region["slope_breaks"]
BBOX_WGS84 = _region["bbox_wgs84"]   # (minx, miny, maxx, maxy) = (west, south, east, north)
STATE = _region["state"]
SOURCE_CRS = "EPSG:4326"

# ---------------------------------------------------------------------
# REGION-SPECIFIC OUTPUT PATHS — all outputs now go under DataSet\<region>\
# so different regions' runs never overwrite each other.
# ---------------------------------------------------------------------
REGION_DIR = os.path.join(DATASET_DIR, ACTIVE_REGION)
os.makedirs(REGION_DIR, exist_ok=True)

# Raster inputs/outputs
DEM_RAW = os.path.join(REGION_DIR, "dem_raw.tif")
DEM_UTM = os.path.join(REGION_DIR, "dem_utm.tif")
SLOPE_RAW = os.path.join(REGION_DIR, "slope.tif")
SLOPE_CLASSIFIED = os.path.join(REGION_DIR, "slope_classified.tif")

# Vector inputs/outputs
RED_ZONES = os.path.join(REGION_DIR, "red_zones.gpkg")
VILLAGES_RAW = os.path.join(REGION_DIR, "villages_raw.geojson")
VILLAGES_UTM = os.path.join(REGION_DIR, "villages_utm.gpkg")
VILLAGE_BUFFERS = os.path.join(REGION_DIR, "village_buffers_final.gpkg")
ML_READY_CSV = os.path.join(REGION_DIR, "ml_ready_villages.csv")

# Buffer distance around villages (meters)
VILLAGE_BUFFER_DIST_M = 500

# Rainfall lookback window (Open-Meteo)
RAINFALL_LOOKBACK_DAYS = 30

GLOFAS_MODE = "historical"   # or "live"
GLOFAS_HISTORICAL_DATE = "2023-01-08"
GLOFAS_RAW = os.path.join(
      REGION_DIR,
      f"glofas_{GLOFAS_MODE}.nc" if GLOFAS_MODE == "live" else f"glofas_historical_{GLOFAS_HISTORICAL_DATE}.nc"
  )

# ---------------------------------------------------------------------
# SHARED (NOT region-specific) — same for every region, stays at top level
# ---------------------------------------------------------------------

# River network dataset (HydroRIVERS) — shared reference layer, not per-region
RIVER_NETWORK_SHP = os.path.join(DATASET_DIR, "hydrorivers_asia", "HydroRIVERS_v10_as.gdb")
WORLDPOP_INDIA_RASTER = os.path.join(DATASET_DIR, "ind_ppp_2020_1km_Aggregated.tif")
GEOFABRIK_DIR = os.path.join(DATASET_DIR, "geofabrik_pbf")  # shared, not per-region

# --- Soil (SoilGrids) settings — still region-specific outputs, so under REGION_DIR ---
SOIL_RAW_DIR = os.path.join(REGION_DIR, "soil", "raw")   # unprocessed WCS downloads
SOIL_UTM_DIR = os.path.join(REGION_DIR, "soil")          # final UTM-reprojected rasters

SOIL_CLAY = os.path.join(SOIL_UTM_DIR, "clay_content.tif")
SOIL_SILT = os.path.join(SOIL_UTM_DIR, "silt_content.tif")
SOIL_SAND = os.path.join(SOIL_UTM_DIR, "sand_content.tif")
# --- Population (WorldPop) settings — region-specific outputs, same pattern as soil ---
POP_RAW_DIR = os.path.join(REGION_DIR, "population", "raw")
POP_UTM_DIR = os.path.join(REGION_DIR, "population")

# PostGIS connection — shared across regions
PG_CONN = {
    "host": os.getenv("PG_HOST", "localhost"),
    "port": os.getenv("PG_PORT", "5432"),
    "dbname": os.getenv("PG_DB", "sih_gis"),
    "user": os.getenv("PG_USER", "postgres"),
    "password": os.getenv("PG_PASSWORD", ""),
}