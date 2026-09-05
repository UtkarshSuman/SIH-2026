"""
FEATURE: Seeds Wayanad's zones with coordinates AND population (used by
relocation planning to know how many people need housing per zone).
Safe to re-run - creates missing zones, updates population on existing
ones if you change the numbers below.
INSTALLATION: none.
"""
from app.gis.database import SessionLocal, engine, Base
from app.gis.models import Zone
from geoalchemy2.shape import from_shape
from shapely.geometry import Point

# PLACEHOLDER population figures - replace with real census/local
# authority data before this drives any real relocation decision.
WAYANAD_TOWNS = [
    {"name": "Kalpetta", "slug": "kalpetta", "lat": 11.6085, "lng": 76.0824, "population": 32000},
    {"name": "Mananthavady", "slug": "mananthavady", "lat": 11.7965, "lng": 76.0059, "population": 25000},
    {"name": "Sulthan Bathery", "slug": "sulthan-bathery", "lat": 11.6673, "lng": 76.2634, "population": 27000},
    {"name": "Vythiri", "slug": "vythiri", "lat": 11.5667, "lng": 76.0833, "population": 15000},
    {"name": "Pulpally", "slug": "pulpally", "lat": 11.7167, "lng": 76.1667, "population": 12000},
    {"name": "Meenangadi", "slug": "meenangadi", "lat": 11.6667, "lng": 76.0333, "population": 18000},
]


def seed():
    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        for town in WAYANAD_TOWNS:
            existing = db.query(Zone).filter(Zone.slug == town["slug"]).first()
            if existing:
                existing.population = town["population"]
                continue
            db.add(
                Zone(
                    name=town["name"],
                    slug=town["slug"],
                    district="Wayanad",
                    state="Kerala",
                    center=from_shape(Point(town["lng"], town["lat"]), srid=4326),
                    radius_meters=5000,
                    population=town["population"],
                )
            )
        db.commit()
        print(f"Seeded/updated {len(WAYANAD_TOWNS)} zones.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()