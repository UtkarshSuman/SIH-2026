"""
FEATURE: Multi-site relocation allocation - for a zone's population,
ranks all RelocationSites by distance and greedily allocates population
to the nearest ones until fully covered (or sites run out). Server-side
version of what was earlier prototyped client-side, now driven by real
database records.

KNOWN LIMITATION: allocates each zone independently - doesn't prevent a
site's capacity being counted toward multiple zones at once if two
zones are both near it. A full multi-zone solver (bin-packing/linear
programming) is the real upgrade path once several zones are genuinely
competing for the same sites simultaneously.
INSTALLATION: none.
"""
from geoalchemy2.shape import to_shape
from app.gis.database import SessionLocal
from app.gis.models import RelocationSite
from app.gis.geo_utils import haversine_km


def compute_relocation_plan(population: int, zone_lat: float, zone_lng: float) -> dict:
    db = SessionLocal()
    try:
        sites = db.query(RelocationSite).all()
        ranked = sorted(
            (
                {"site": s, "distance_km": haversine_km(zone_lat, zone_lng, to_shape(s.center).y, to_shape(s.center).x)}
                for s in sites
            ),
            key=lambda r: r["distance_km"],
        )

        remaining = population
        allocations = []
        for r in ranked:
            if remaining <= 0:
                break
            site = r["site"]
            contribution = min(site.capacity, remaining)
            allocations.append(
                {
                    "siteId": site.id,
                    "siteName": site.name,
                    "distanceKm": round(r["distance_km"], 1),
                    "capacity": site.capacity,
                    "contribution": contribution,
                }
            )
            remaining -= contribution

        total_used = population - max(remaining, 0)
        return {
            "population": population,
            "allocations": allocations,
            "totalCapacityUsed": total_used,
            "isFullyAccommodated": remaining <= 0,
            "shortfall": max(remaining, 0),
        }
    finally:
        db.close()