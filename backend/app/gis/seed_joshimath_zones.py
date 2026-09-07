# FEATURE: Seeds Joshimath, Uttarakhand as Zone rows (same pattern as
#          seed_zones.py's Wayanad taluks). Joshimath itself is a small hill
#          town (~pop. 20,000) and does not have precisely surveyed
#          ward-boundary centroids in open data the way Wayanad's taluk towns
#          do — the coordinates below are APPROXIMATE, placed by
#          cross-referencing subsidence-coverage maps and OSM-visible
#          neighbourhood locations relative to the town center
#          (30.5548, 79.5644). Replace with surveyed centroids if/when the
#          project owner has better ward-boundary data (e.g. from ISRO/NRSC's
#          Joshimath subsidence assessment, which does have ward-level
#          polygons but wasn't accessible as an open dataset at the time of
#          writing).
#
# INSTALLATION: no new packages beyond what seed_zones.py already uses

import uuid

from app.gis.models import Zone
from app.gis.database import SessionLocal
from geoalchemy2.shape import from_shape
from shapely.geometry import Point
# reuse whatever session helper seed_zones.py defines

JOSHIMATH_ZONES = [
    {
        "id": str(uuid.uuid4()),
        "slug": "joshimath-marwari",
        "name": "Marwari Ward",
        "district": "Chamoli",
        "state": "Uttarakhand",
        "lat": 30.5568,
        "lng": 79.5651,
        "radius_meters": 800,
        "population": 5000
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "joshimath-singhdhar",
        "name": "Singhdhar Ward",
        "district": "Chamoli",
        "state": "Uttarakhand",
        "lat": 30.5531,
        "lng": 79.5622,
        "radius_meters": 800,
        "population": 5000
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "joshimath-sunil",
        "name": "Sunil Ward",
        "district": "Chamoli",
        "state": "Uttarakhand",
        "lat": 30.5559,
        "lng": 79.5678,
        "radius_meters": 800,
        "population": 5000
    },
    {
        "id": str(uuid.uuid4()),
        "slug": "joshimath-manoharbagh",
        "name": "Manoharbagh Ward",
        "district": "Chamoli",
        "state": "Uttarakhand",
        "lat": 30.5540,
        "lng": 79.5600,
        "radius_meters": 800,
        "population": 5000
    },
    {
        # Town-center fallback zone — kept even with the ward zones above so
        # a single "Joshimath" alert/coverage area still exists if ward-level
        # zones are ever pruned. Marked clearly as an approximation.
        "id": str(uuid.uuid4()),
        "slug": "joshimath-town",
        "name": "Joshimath (Town Center — approximate)",
        "district": "Chamoli",
        "state": "Uttarakhand",
        "lat": 30.5548,
        "lng": 79.5644,
        "radius_meters": 3000,
        "population": 5000
    },
]


def seed_joshimath_zones() -> None:
    session = SessionLocal()
    try:
        for z in JOSHIMATH_ZONES:
            existing = session.query(Zone).filter_by(slug=z["slug"]).first()
            if existing:
                continue
            zone = Zone(
                id=z["id"],
                name=z["name"],
                slug=z["slug"],
                district=z["district"],
                state=z["state"],
                center=from_shape(Point(z["lng"], z["lat"]), srid=4326),
                radius_meters=z["radius_meters"],
            )
            session.add(zone)
        session.commit()
        print(f"Seeded {len(JOSHIMATH_ZONES)} Joshimath zones.")
    finally:
        session.close()


if __name__ == "__main__":
    seed_joshimath_zones()