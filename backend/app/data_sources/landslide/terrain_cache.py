# FEATURE: One-time (rarely re-run) static terrain + soil feature extraction,
#          shared by BOTH the landslide model and the flood model. DEM and
#          SoilGrids rasters are fetched once per region and cached to disk
#          as JSON, keyed by zone_slug, so the 30-min pipeline never touches
#          OpenTopography/SoilGrids on the hot path.
#
#          Landslide reads: slope_deg, clay_pct
#          Flood reads:     elevation_m, flatness_score, low_lying_score
#
#          Run as: python -m app.data_sources.landslide.terrain_cache
#
# INSTALLATION: pip install rasterio numpy scipy owslib requests
#   (owslib is used as the WCS client for SoilGrids; rasterio+scipy for DEM
#   slope/aspect derivation)

from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable

import numpy as np
import rasterio
import requests
from owslib.wcs import WebCoverageService
from rasterio.warp import calculate_default_transform, reproject, Resampling
from scipy import ndimage

from app.core.config import settings
from app.gis.seed_zones import WAYANAD_TOWNS as WAYANAD_ZONES
from app.gis.seed_joshimath_zones import JOSHIMATH_ZONES

logger = logging.getLogger(__name__)

CACHE_DIR = Path(__file__).resolve().parent / "cache"
CACHE_FILE = CACHE_DIR / "terrain_features.json"

# Region bounding boxes: (minx, miny, maxx, maxy) in WGS84
REGION_BBOXES = {
    "wayanad": (75.9, 11.5, 76.4, 11.9),
    "joshimath": (79.50, 30.50, 79.60, 30.60),
}

OPENTOPO_URL = "https://portal.opentopography.org/API/globaldem"
SOILGRIDS_WCS_URL = "https://maps.isric.org/mapserv?map=/map/clay.map"


@dataclass
class StaticZoneFeatures:
    zone_slug: str
    # --- landslide-relevant ---
    slope_deg: float
    clay_pct: float
    # --- flood-relevant ---
    elevation_m: float
    flatness_score: float      # 0-1, higher = flatter = pools water more easily
    low_lying_score: float     # 0-1, elevation percentile within region (1 = lowest)
    source_note: str = "static terrain cache; see README for regeneration cadence"


def _fetch_dem(bbox: tuple[float, float, float, float], out_path: Path) -> Path:
    """Fetch an SRTMGL1 DEM tile for the bbox from OpenTopography."""
    minx, miny, maxx, maxy = bbox
    params = {
        "demtype": "SRTMGL1",
        "south": miny,
        "north": maxy,
        "west": minx,
        "east": maxx,
        "outputFormat": "GTiff",
        "API_Key": settings.opentopo_api_key,
    }
    resp = requests.get(OPENTOPO_URL, params=params, timeout=60)
    resp.raise_for_status()
    out_path.write_bytes(resp.content)
    return out_path


def _fetch_soil_clay(bbox: tuple[float, float, float, float], out_path: Path) -> Path | None:
    """Fetch clay % raster from SoilGrids WCS (0-5cm depth, mean)."""
    try:
        wcs = WebCoverageService(SOILGRIDS_WCS_URL, version="2.0.1")
        coverage_id = [c for c in wcs.contents if "0-5cm_mean" in c][0]
        minx, miny, maxx, maxy = bbox
        response = wcs.getCoverage(
            identifier=[coverage_id],
            subsets=[("X", minx, maxx), ("Y", miny, maxy)],
            format="image/tiff",
        )
        out_path.write_bytes(response.read())
        return out_path
    except Exception:
        logger.exception("SoilGrids fetch failed; clay_pct will fall back to a neutral default")
        return None


def _slope_degrees(dem_path: Path) -> tuple[np.ndarray, rasterio.Affine, str]:
    with rasterio.open(dem_path) as src:
        elevation = src.read(1).astype(float)
        transform = src.transform
        crs = src.crs
        # approximate cell size in meters (works fine for small regional DEMs)
        px_size_deg = transform.a
        px_size_m = px_size_deg * 111_320
        dz_dy, dz_dx = np.gradient(elevation, px_size_m)
        slope_rad = np.arctan(np.hypot(dz_dx, dz_dy))
        slope_deg = np.degrees(slope_rad)
        return slope_deg, transform, str(crs)


def _sample_raster_at(raster: np.ndarray, transform: rasterio.Affine, lat: float, lng: float) -> float:
    row, col = rasterio.transform.rowcol(transform, lng, lat)
    row = int(np.clip(row, 0, raster.shape[0] - 1))
    col = int(np.clip(col, 0, raster.shape[1] - 1))
    val = raster[row, col]
    return float(val) if np.isfinite(val) else float("nan")


def _flatness_score(slope_deg_at_point: float) -> float:
    """0-1: 1.0 at 0 degrees, decaying to ~0 by 10 degrees. Flat land floods; steep land doesn't pool."""
    return float(np.clip(1.0 - (slope_deg_at_point / 10.0), 0.0, 1.0))


def build_cache(zones_by_region: dict[str, list[dict]]) -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    all_features: dict[str, dict] = {}

    for region, zones in zones_by_region.items():
        bbox = REGION_BBOXES[region]
        dem_path = CACHE_DIR / f"{region}_dem.tif"
        soil_path = CACHE_DIR / f"{region}_clay.tif"

        logger.info("Fetching DEM for %s", region)
        _fetch_dem(bbox, dem_path)
        slope_deg, transform, _crs = _slope_degrees(dem_path)

        with rasterio.open(dem_path) as src:
            elevation_raster = src.read(1).astype(float)

        logger.info("Fetching soil clay % for %s", region)
        soil_result = _fetch_soil_clay(bbox, soil_path)
        clay_raster = None
        clay_transform = None
        if soil_result:
            with rasterio.open(soil_result) as src:
                clay_raster = src.read(1).astype(float)
                clay_transform = src.transform

        # elevation percentile lookup for low_lying_score within this region
        valid_elev = elevation_raster[np.isfinite(elevation_raster)]

        for zone in zones:
            lat, lng = zone["lat"], zone["lng"]
            slope_at_pt = _sample_raster_at(slope_deg, transform, lat, lng)
            elev_at_pt = _sample_raster_at(elevation_raster, transform, lat, lng)

            if clay_raster is not None:
                clay_at_pt = _sample_raster_at(clay_raster, clay_transform, lat, lng)
                # SoilGrids clay is in g/kg * 10 in some products; normalize defensively
                clay_pct = clay_at_pt / 10.0 if clay_at_pt > 100 else clay_at_pt
            else:
                clay_pct = 25.0  # neutral fallback, documented in README

            low_lying_score = (
                float(1.0 - (np.searchsorted(np.sort(valid_elev), elev_at_pt) / len(valid_elev)))
                if len(valid_elev) > 0 and np.isfinite(elev_at_pt)
                else 0.5
            )

            feats = StaticZoneFeatures(
                zone_slug=zone["slug"],
                slope_deg=round(slope_at_pt, 2) if np.isfinite(slope_at_pt) else 10.0,
                clay_pct=round(clay_pct, 2),
                elevation_m=round(elev_at_pt, 1) if np.isfinite(elev_at_pt) else 0.0,
                flatness_score=round(_flatness_score(slope_at_pt if np.isfinite(slope_at_pt) else 5.0), 3),
                low_lying_score=round(low_lying_score, 3),
            )
            all_features[zone["slug"]] = asdict(feats)

    CACHE_FILE.write_text(json.dumps(all_features, indent=2))
    logger.info("Wrote static terrain cache for %d zones -> %s", len(all_features), CACHE_FILE)


def load_cache() -> dict[str, dict]:
    if not CACHE_FILE.exists():
        raise FileNotFoundError(
            f"Terrain cache not found at {CACHE_FILE}. Run "
            "`python -m app.data_sources.landslide.terrain_cache` first."
        )
    return json.loads(CACHE_FILE.read_text())


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    build_cache({"wayanad": WAYANAD_ZONES, "joshimath": JOSHIMATH_ZONES})