import json
from fastapi import APIRouter, HTTPException
from typing import Optional
import psycopg2
from database import get_connection

router = APIRouter()

# new
def _get_region_map(cur):
    cur.execute("SELECT region_id, slug, hazard_types FROM regions;")
    return {row[0]: {"slug": row[1], "hazard_types": row[2]} for row in cur.fetchall()}

@router.get("/api/habitations")
def get_habitations(region: Optional[str] = None):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        region_id = None
        if region and region != "ALL":
            cur.execute("SELECT region_id FROM regions WHERE slug = %s;", (region,))
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail=f"Unknown region slug: {region}")
            region_id = row[0]

        cur.execute("SELECT get_habitations_geojson(%s);", (region_id,))
        result = cur.fetchone()[0]

        # --- stamp each feature with its region slug ---
        if isinstance(result, str):
            result = json.loads(result)

        # new
        region_map = _get_region_map(cur)
        for feature in result.get("features", []):
            rid = feature["properties"].get("region_id")
            info = region_map.get(rid, {})
            feature["properties"]["region"] = info.get("slug")
            feature["properties"]["hazard_types"] = info.get("hazard_types")
        # --- end ---

        cur.close()
        conn.close()
        return result
    except HTTPException:
        raise
    except psycopg2.OperationalError as e:
        raise HTTPException(status_code=503, detail="Database is unavailable") from e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn is not None:
            conn.close()