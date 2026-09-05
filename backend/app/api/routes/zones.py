"""
FEATURE: Two public endpoints (no auth - per your requirement, map
viewing needs no login):
  - GET /zones/latest - current status of every zone, as GeoJSON, for
    the map to load on page open
  - POST /zones/refresh - manually triggers the pipeline (rate-limited -
    in-memory cooldown, see chat explanation for why in-memory is fine
    here and when you'd need Redis instead)
INSTALLATION: none beyond what the pipeline already needs.
"""
import time
from datetime import datetime
from fastapi import APIRouter, HTTPException
from geoalchemy2.shape import to_shape
from app.core.config import settings
from app.gis.database import SessionLocal
from app.gis.models import Zone, ZoneStatus
from app.hazard.pipeline import run_hazard_pipeline

router = APIRouter()

_last_refresh_at: float = 0.0


def _zones_to_geojson() -> dict:
    db = SessionLocal()
    try:
        zones = db.query(Zone).all()
        features = []
        for zone in zones:
            point = to_shape(zone.center)
            statuses = db.query(ZoneStatus).filter(ZoneStatus.zone_id == zone.id).all()
            hazards = {
                s.hazard_type: {
                    "status": s.status,
                    "riskScore": s.risk_score,
                    "updatedAt": s.updated_at.isoformat() if s.updated_at else None,
                }
                for s in statuses
            }
            # Worst status across all hazard types - drives the marker color
            severity = {"GREEN": 0, "YELLOW": 1, "RED": 2}
            worst = max(hazards.values(), key=lambda h: severity[h["status"]], default={"status": "GREEN"})

            features.append(
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [point.x, point.y]},
                    "properties": {
                        "zoneId": zone.id,
                        "name": zone.name,
                        "district": zone.district,
                        "radiusMeters": zone.radius_meters,
                        "worstStatus": worst["status"],
                        "hazards": hazards,
                    },
                }
            )
        return {"type": "FeatureCollection", "features": features}
    finally:
        db.close()


@router.get("/zones/latest")
async def get_latest_zones():
    return _zones_to_geojson()


@router.post("/zones/refresh")
async def refresh_zones():
    global _last_refresh_at
    now = time.time()
    elapsed = now - _last_refresh_at

    if elapsed < settings.refresh_cooldown_seconds:
        retry_after = int(settings.refresh_cooldown_seconds - elapsed)
        raise HTTPException(
            status_code=429,
            detail=f"Refresh on cooldown - try again in {retry_after} seconds.",
        )

    _last_refresh_at = now
    summary = await run_hazard_pipeline()
    return {"summary": summary, "zones": _zones_to_geojson()}