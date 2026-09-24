"""
Minimal test FastAPI app for the rescue_arc database.
3 endpoints: list habitations (optionally by region), get one by id, count by zone_class.

Run with:
    uvicorn test_api:app --reload

Then open http://127.0.0.1:8000/docs for interactive Swagger UI.
"""

from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, text

# Same DB_URL style as load_habitations.py — point this at whichever
# database you're testing against (local rescue_arc, or the Render one).
DB_URL = "postgresql://rescue_arc_db_user:qP4JLFGXgUP4YMc2WpIUlDD6NTP9N7Bn@dpg-daejvson74is73e6ugl0-a.oregon-postgres.render.com/rescue_arc_db"
engine = create_engine(DB_URL)
app = FastAPI(title="Rescue Arc Test API")


@app.get("/api/habitations")
def list_habitations(region: str | None = None, limit: int = 50):
    """List habitations, optionally filtered by region display name."""
    with engine.connect() as conn:
        if region:
            query = text(
                """
                SELECT h.id, h.name, h.zone_class, h.hazard_prob,
                       ST_X(h.geom::geometry) AS lon, ST_Y(h.geom::geometry) AS lat
                FROM habitations h
                JOIN regions r ON h.region_id = r.region_id
                WHERE r.display_name = :region
                LIMIT :limit
                """
            )
            rows = conn.execute(query, {"region": region, "limit": limit}).mappings().all()
        else:
            query = text(
                """
                SELECT id, name, zone_class, hazard_prob,
                       ST_X(geom::geometry) AS lon, ST_Y(geom::geometry) AS lat
                FROM habitations
                LIMIT :limit
                """
            )
            rows = conn.execute(query, {"limit": limit}).mappings().all()
        return {"count": len(rows), "results": [dict(r) for r in rows]}


@app.get("/api/habitations/{habitation_id}")
def get_habitation(habitation_id: int):
    """Get a single habitation by its database id."""
    with engine.connect() as conn:
        query = text(
            """
            SELECT id, name, zone_class, hazard_prob, evacuees, timeline,
                   ST_X(geom::geometry) AS lon, ST_Y(geom::geometry) AS lat
            FROM habitations
            WHERE id = :id
            """
        )
        row = conn.execute(query, {"id": habitation_id}).mappings().first()
        if row is None:
            raise HTTPException(status_code=404, detail="Habitation not found")
        return dict(row)


@app.get("/api/stats/zone-counts")
def zone_counts():
    """Quick sanity-check endpoint: count of habitations per zone_class."""
    with engine.connect() as conn:
        query = text("SELECT zone_class, count(*) AS count FROM habitations GROUP BY zone_class")
        rows = conn.execute(query).mappings().all()
        return {r["zone_class"]: r["count"] for r in rows}
