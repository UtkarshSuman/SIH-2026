"""
FEATURE: The core orchestration - one function, called by BOTH the
30-minute scheduler (automatic) and the manual /zones/refresh endpoint,
so scheduled and manual refreshes always compute zones identically.

For each hazard type: races all registered sources (first successful
response wins), transforms the data, runs that hazard's model, then
upserts ZoneStatus + logs ZoneStatusHistory in ONE transaction per
hazard type - so a failure partway through never leaves the database
(and therefore the frontend) in a half-updated state; the old data for
that hazard simply stays until the next successful run.

After a successful commit, compares old vs new status per zone and
fires an alert only on escalation (crossing into YELLOW/RED, or getting
worse) - not on every refresh.

INSTALLATION: pip install apscheduler httpx sqlalchemy
"""
import asyncio
from datetime import datetime, timedelta
from geoalchemy2.shape import to_shape
from app.gis.database import SessionLocal
from app.gis.models import Zone, ZoneStatus, ZoneStatusHistory
from app.data_sources.registry import HAZARD_SOURCES
from app.hazard.model_registry import HAZARD_MODELS
from app.hazard.alerts import send_zone_alert

STATUS_SEVERITY = {"GREEN": 0, "YELLOW": 1, "RED": 2}


async def _fetch_first_success(sources, zones: list[dict]):
    """Races all sources for a hazard type; returns the first one that
    succeeds. Tries the rest in order if earlier ones fail."""
    tasks = {asyncio.create_task(s.fetch(zones)): s for s in sources}
    pending = set(tasks.keys())

    while pending:
        done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            source = tasks[task]
            try:
                raw = task.result()
                for p in pending:
                    p.cancel()
                return source, raw
            except Exception as e:
                print(f"Source {source.name} failed: {e}")
                continue
    return None, None


def _get_zones(db) -> list[dict]:
    zones = db.query(Zone).all()
    return [
        {"id": z.id, "slug": z.slug, "name": z.name, "lat": to_shape(z.center).y, "lng": to_shape(z.center).x}
        for z in zones
    ]


async def run_hazard_pipeline() -> dict:
    """Returns a summary dict - used both for logging and as the
    manual-refresh endpoint's response."""
    db = SessionLocal()
    summary = {"hazards_updated": [], "alerts_sent": 0}

    try:
        zones = _get_zones(db)
        zone_by_slug = {z["slug"]: z for z in zones}

        for hazard_type, sources in HAZARD_SOURCES.items():
            model = HAZARD_MODELS.get(hazard_type)
            if not model:
                continue

            source, raw = await _fetch_first_success(sources, zones)
            if source is None:
                print(f"All sources failed for {hazard_type} - keeping existing data.")
                continue

            normalized = source.transform(raw, zones)
            predictions = model.predict_batch(normalized)

            escalations = []
            for slug, result in predictions.items():
                zone_info = zone_by_slug.get(slug)
                if not zone_info:
                    continue

                existing = (
                    db.query(ZoneStatus)
                    .filter(ZoneStatus.zone_id == zone_info["id"], ZoneStatus.hazard_type == hazard_type)
                    .first()
                )
                old_status = existing.status if existing else "GREEN"

                if existing:
                    existing.status = result["status"]
                    existing.risk_score = result["risk_score"]
                    existing.raw_output = normalized[slug]
                else:
                    db.add(
                        ZoneStatus(
                            zone_id=zone_info["id"],
                            hazard_type=hazard_type,
                            status=result["status"],
                            risk_score=result["risk_score"],
                            raw_output=normalized[slug],
                        )
                    )

                db.add(
                    ZoneStatusHistory(
                        zone_id=zone_info["id"],
                        hazard_type=hazard_type,
                        status=result["status"],
                        risk_score=result["risk_score"],
                    )
                )

                if STATUS_SEVERITY[result["status"]] > STATUS_SEVERITY[old_status]:
                    escalations.append((zone_info, result))

            db.commit()  # one transaction per hazard type - all zones or none
            summary["hazards_updated"].append(hazard_type)

            for zone_info, result in escalations:
                await send_zone_alert(
                    zone_info["slug"], zone_info["name"], hazard_type, result["status"], result["risk_score"]
                )
                summary["alerts_sent"] += 1

        # Cleanup: keep only the last 24h of history
        cutoff = datetime.utcnow() - timedelta(hours=24)
        db.query(ZoneStatusHistory).filter(ZoneStatusHistory.recorded_at < cutoff).delete()
        db.commit()

    finally:
        db.close()

    return summary