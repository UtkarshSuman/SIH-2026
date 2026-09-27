"""api.py — FastAPI app tying the whole pipeline together.

Three endpoint styles:
  GET /api/zone-status/{zone_id}  — pre-computed zone color + priority for
                                     an already-ingested zone_id, read
                                     from HazardReadingStore. Auto-refreshes
                                     first if any hazard's stored reading is
                                     missing or older than cleaning.py's
                                     STALE_AFTER threshold (see
                                     _refresh_if_stale below) — 404s only if
                                     nothing could be ingested at all (e.g.
                                     an unrecognized zone_id).
  GET /api/analyze-point          — the "click anywhere on the map" entry
                                     point. Takes a raw lat/lon, derives a
                                     zone on the fly (zones.zone_from_point
                                     -- no pre-defined zone_id needed),
                                     runs it through the SAME live
                                     fetch -> normalize -> clean -> save
                                     pipeline pipeline_runner.py's CLI
                                     uses, and returns the scored
                                     zone-status result immediately. This
                                     is what the dashboard's map click
                                     should call for an arbitrary place.
  GET /api/place-data             — raw provider dump (weather/osm/
                                     elevation only, no scoring/persist)
                                     for ad-hoc inspection of a point.
Both /api/analyze-point and /api/place-data require the gis_fetcher
package (built separately) to be importable alongside this file.
"""
from __future__ import annotations

# Same .env auto-load as pipeline_runner.py -- the API is a separate
# entry point and needs both keys in os.environ just as early.
from dotenv import load_dotenv
load_dotenv()

import math
import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.prioritization import PrioritizationResult, VulnerabilityInputs, prioritize
from backend.zone_classifier import ZoneClassification, classify_zone
from data_pipeline.cleaning import STALE_AFTER
from data_pipeline.store_factory import create_hazard_reading_store
from data_pipeline.models import HazardType
from data_pipeline.store_factory import create_static_dataset_store
from ml_service.features.feature_engineering import build_feature_dict
from ml_service.inference.ml_predictor import predict

app = FastAPI(title="Disaster Relocation GIS Platform")

# dashboard.html is opened as a bare file:// document (see frontend/dashboard.html's
# API_BASE constant), so the browser sends an `Origin: null` request -- the FastAPI
# default of no CORS headers at all would silently fail every fetch() from it with an
# opaque network error, not an HTTP error. HAZARD_PLATFORM_CORS_ORIGINS lets a real
# deployment restrict this to its actual origin(s) (comma-separated) instead of "*";
# unset defaults to "*" since the API has no auth/cookies for CORS to leak.
_cors_origins_env = os.environ.get("HAZARD_PLATFORM_CORS_ORIGINS")
_cors_origins = [o.strip() for o in _cors_origins_env.split(",") if o.strip()] if _cors_origins_env else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)
store = create_hazard_reading_store()
static_store = create_static_dataset_store()

# Placeholder until population/census ingestion exists — replace with a
# real lookup keyed by zone_id.
_PLACEHOLDER_VULNERABILITY = VulnerabilityInputs(
    population_density_score=0.5,
    socioeconomic_vulnerability_score=0.5,
    disaster_history_score=0.5,
)

try:
    from gis_fetcher.core.base import BBox
    from gis_fetcher.hazard_map import build_fetcher

    # build_fetcher() resolves config/providers.yaml relative to the
    # gis_fetcher package itself when the API isn't run from that
    # package's own directory (see hazard_map._resolve_config_path) --
    # duplicating load_config()/Cache() construction here previously
    # meant this endpoint silently ran with an empty provider config.
    _fetcher = build_fetcher()
except ImportError:
    _fetcher = None
    BBox = None  # type: ignore

try:
    # Imported lazily-guarded the same way as gis_fetcher above: these
    # pull in gis_fetcher transitively (pipeline_runner -> hazard_map),
    # so /api/analyze-point degrades the same way /api/place-data does
    # when gis_fetcher isn't installed alongside this API. ingest_zone is
    # what /api/zone-status's auto-refresh (_refresh_if_stale below) uses.
    from data_pipeline.cleaning import ZoneHistory
    from pipeline_runner import ingest_point, ingest_zone, seed_history_from_store
    from zones import list_zones

    _history = ZoneHistory()
    for _zone in list_zones():
        seed_history_from_store(_zone.zone_id, store, _history)
except ImportError:
    ingest_point = None  # type: ignore
    ingest_zone = None  # type: ignore
    _history = None


def _bbox_from_point(lon: float, lat: float, radius_km: float = 5.0):
    dlat = radius_km / 111.0
    dlon = radius_km / (111.0 * max(0.1, abs(math.cos(math.radians(lat)))))
    return BBox(lon - dlon, lat - dlat, lon + dlon, lat + dlat)


def _is_stale_or_missing(zone_id: str) -> bool:
    """True if any hazard has no stored reading yet, or its most recent
    one is older than cleaning.py's STALE_AFTER window (3 hours) --
    the same threshold clean_reading() already computes at ingest time,
    reused here at read time since a reading gets older the whole time
    it sits in the DB between pipeline runs."""
    now = datetime.now(timezone.utc)
    for hazard in HazardType:
        reading = store.latest_for_zone(zone_id, hazard)
        if reading is None or (now - reading.recorded_at) > STALE_AFTER:
            return True
    return False


def _refresh_if_stale(zone_id: str) -> None:
    """Auto-refresh: run a live ingest for `zone_id` before scoring if any
    hazard's latest stored reading is missing or stale. Without this,
    /api/zone-status could silently serve a days-old reading whenever
    pipeline_runner.py hadn't been re-run recently — e.g. a wave-energy
    reading from 5 days earlier was once served as "current" for
    Z-ODISHA-PURI-01, understating an actively forming storm system (see
    project chat-log, 2026-09-23).

    No-ops quietly if gis_fetcher isn't installed (ingest_zone is None,
    same degrade-gracefully pattern as /api/analyze-point) or if zone_id
    isn't a zones.py-registered zone (get_zone raises inside ingest_zone;
    caught here so an unrecognized id still falls through to
    _score_zone's normal "no readings stored" 404 instead of a 500).

    NOTE: failures here are swallowed on purpose (see below) so a caller
    always gets *some* answer rather than a 500 whenever live refresh
    isn't possible. That means a failed refresh is otherwise invisible to
    the caller -- _score_zone's `oldest_recorded_at` return value is what
    lets zone_status/analyze_point report the data's real age regardless
    of whether this function's own refresh attempt actually succeeded.
    """
    if ingest_zone is None or _history is None:
        return
    if not _is_stale_or_missing(zone_id):
        return
    try:
        ingest_zone(zone_id, store, _history, static_store=static_store)
    except Exception:
        # Live refresh failed (unknown zone_id, every provider down,
        # etc.) — fall through and score whatever's already stored, if
        # anything; _score_zone raises its own 404 when nothing exists.
        pass


def _score_zone(zone_id: str) -> tuple[ZoneClassification, PrioritizationResult, Optional[datetime]]:
    """Shared by /api/zone-status and /api/analyze-point: read whatever
    HazardReadings currently exist for `zone_id` and turn them into a
    classification + priority. Raises ValueError if nothing's stored yet
    (both callers translate that into their own HTTPException).

    Also returns the OLDEST `recorded_at` across the hazards actually
    used to score this zone (not the newest) -- staleness is only as
    good as the stalest hazard reading, so a zone with 3 fresh readings
    and 1 reading from days ago should still be reported as stale
    overall. This is the only place a caller can tell "this data is
    fresh" from "the auto-refresh above silently failed and I'm serving
    what was already in the DB" -- _refresh_if_stale intentionally never
    raises on a failed live refresh.
    """
    features_by_hazard = {}
    oldest_recorded_at: Optional[datetime] = None
    for hazard in HazardType:
        reading = store.latest_for_zone(zone_id, hazard)
        if reading is None:
            continue
        features_by_hazard[hazard] = build_feature_dict(hazard, reading.parameters)
        if oldest_recorded_at is None or reading.recorded_at < oldest_recorded_at:
            oldest_recorded_at = reading.recorded_at

    if not features_by_hazard:
        raise ValueError(f"No readings stored for zone {zone_id}")

    scores = predict(features_by_hazard)
    classification = classify_zone(zone_id, scores)
    result = prioritize(classification, _PLACEHOLDER_VULNERABILITY)
    return classification, result, oldest_recorded_at


def _freshness_fields(oldest_recorded_at: Optional[datetime]) -> dict:
    """Shared response fragment for both scored endpoints. `stale=True`
    when the oldest hazard reading used is missing entirely or older
    than STALE_AFTER -- same rule _is_stale_or_missing already applies
    pre-refresh, applied here post-refresh so it reflects what was
    actually served, not just what was attempted."""
    is_stale = (
        oldest_recorded_at is None
        or (datetime.now(timezone.utc) - oldest_recorded_at) > STALE_AFTER
    )
    return {
        "data_recorded_at": oldest_recorded_at.isoformat() if oldest_recorded_at else None,
        "stale": is_stale,
    }


@app.get("/api/zone-status/{zone_id}")
def zone_status(zone_id: str):
    _refresh_if_stale(zone_id)
    try:
        classification, result, oldest_recorded_at = _score_zone(zone_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    return {
        "zone_id": zone_id,
        "zone_color": classification.color.value,
        "worst_hazard": classification.worst_hazard.value,
        "hazard_scores": {h.value: round(s, 3) for h, s in classification.scores.items()},
        "priority": result.priority.value,
        "priority_score": round(result.priority_score, 3),
        **_freshness_fields(oldest_recorded_at),
    }


@app.get("/api/analyze-point")
def analyze_point(lat: float, lon: float, radius_km: float = 5.0):
    """Click-to-fetch: derives a zone around (lat, lon) — no hardcoded
    zone list involved — live-fetches all 4 hazards' data for it,
    persists it, and returns the same scored shape as /api/zone-status.

    Defined as a plain `def` (not `async def`) on purpose: the pipeline
    underneath (`ingest_point` -> gis_fetcher's `fetcher.fetch()`) uses
    `asyncio.run()` internally, which cannot be called from inside an
    already-running event loop. FastAPI runs sync path functions in a
    worker thread with no event loop of its own, which is exactly what
    that call needs. (/api/place-data below stays `async def` because it
    awaits gis_fetcher's async `fetch_many()` directly instead.)
    """
    if ingest_point is None:
        raise HTTPException(
            status_code=503,
            detail="gis_fetcher package not installed alongside this API — see gis_fetcher.zip",
        )

    zone, summary = ingest_point(lat, lon, store, _history, static_store=static_store, radius_km=radius_km)

    try:
        classification, result, oldest_recorded_at = _score_zone(zone.zone_id)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=f"Fetched data but scoring failed: {exc}") from exc

    return {
        "zone_id": zone.zone_id,
        "zone_name": zone.name,
        "center": {"lat": zone.center[1], "lon": zone.center[0]},
        "bbox": [zone.min_lon, zone.min_lat, zone.max_lon, zone.max_lat],
        "zone_color": classification.color.value,
        "worst_hazard": classification.worst_hazard.value,
        "hazard_scores": {h.value: round(s, 3) for h, s in classification.scores.items()},
        "priority": result.priority.value,
        "priority_score": round(result.priority_score, 3),
        **_freshness_fields(oldest_recorded_at),
        "hazard_details": {
            hazard: {
                "provider_status": info["provider_status"],
                "parameters": info["parameters"],
                "imputed_fields": info["imputed_fields"],
            }
            for hazard, info in summary.items()
        },
    }


@app.get("/api/place-data")
async def place_data(lat: float, lon: float, radius_km: float = 5.0):
    """Raw provider dump for a point — no scoring, no persistence. Handy
    for inspecting what gis_fetcher itself sees at a spot; use
    /api/analyze-point for the actual colored-marker workflow."""
    if _fetcher is None:
        raise HTTPException(
            status_code=503,
            detail="gis_fetcher package not installed alongside this API — see gis_fetcher.zip",
        )
    bbox = _bbox_from_point(lon, lat, radius_km)
    results = await _fetcher.fetch_many(["weather", "osm", "elevation"], bbox)
    return {r.provider: (r.to_geojson() if r.ok else {"error": r.error}) for r in results}
