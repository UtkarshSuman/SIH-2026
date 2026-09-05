"""
FEATURE: Seeds candidate relocation sites with accommodation capacity.
PLACEHOLDER data - replace with real vetted site data before this drives
any real decision. Safe to re-run.
INSTALLATION: none.
"""
from app.gis.database import SessionLocal, engine, Base
from app.gis.models import RelocationSite
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

SITES = [
    {"name": "Proposed Relocation Site A (near Kalpetta)", "lat": 11.6085, "lng": 76.0824, "capacity": 5000},
    {"name": "Proposed Relocation Site B (near Meenangadi)", "lat": 11.6667, "lng": 76.0333, "capacity": 4000},
    {"name": "Proposed Relocation Site C (near Vythiri)", "lat": 11.5667, "lng": 76.0833, "capacity": 3000},
]


def seed():
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        for s in SITES:
            existing = db.query(RelocationSite).filter(RelocationSite.name == s["name"]).first()
            if existing:
                existing.capacity = s["capacity"]
                continue
            db.add(
                RelocationSite(
                    name=s["name"],
                    district="Wayanad",
                    state="Kerala",
                    center=from_shape(Point(s["lng"], s["lat"]), srid=4326),
                    capacity=s["capacity"],
                )
            )
        db.commit()
        print(f"Seeded/updated {len(SITES)} relocation sites.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()