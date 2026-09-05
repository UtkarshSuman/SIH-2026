"""
FEATURE: Public relocation endpoints (no auth, matches /zones being
public):
  - GET /relocation/plan - EVERY currently RED/YELLOW zone, with its
    population and full multi-site allocation. Both relocation pages
    fetch this one endpoint - it's always in sync with whatever the
    hazard pipeline most recently computed.
  - GET /relocation/sites - all candidate sites, for the map.
INSTALLATION: none.
"""
from fastapi import APIRouter
from geoalchemy2.shape import to_shape
from app.gis.database import SessionLocal
from app.gis.models import Zone, ZoneStatus, RelocationSite
from app.hazard.relocation import compute_relocation_plan

router = APIRouter()
SEVERITY = {"GREEN": 0, "YELLOW": 1, "RED": 2}


@router.get("/relocation/plan")
async def get_relocation_plan():
    db = SessionLocal()
    try:
        zones = db.query(Zone).all()
        results = []

        for zone in zones:
            statuses = db.query(ZoneStatus).filter(ZoneStatus.zone_id == zone.id).all()
            if not statuses:
                continue
            worst = max(statuses, key=lambda s: SEVERITY[s.status])
            if worst.status not in ("RED", "YELLOW"):
                continue

            point = to_shape(zone.center)
            plan = compute_relocation_plan(zone.population or 0, point.y, point.x)

            results.append(
                {
                    "zoneId": zone.id,
                    "zoneName": zone.name,
                    "lat": point.y,
                    "lng": point.x,
                    "worstStatus": worst.status,
                    "hazardType": worst.hazard_type,
                    **plan,
                }
            )

        return {"zones": results}
    finally:
        db.close()


@router.get("/relocation/sites")
async def get_relocation_sites():
    db = SessionLocal()
    try:
        sites = db.query(RelocationSite).all()
        return {
            "sites": [
                {"id": s.id, "name": s.name, "lat": to_shape(s.center).y, "lng": to_shape(s.center).x, "capacity": s.capacity}
                for s in sites
            ]
        }
    finally:
        db.close()