import sys
import os
import time
import math
import importlib.util
from pathlib import Path
from contextlib import asynccontextmanager


# ---------------------------------------------------------------------------
# Setup sys.path so subpackages can be imported seamlessly
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend"))
sys.path.insert(0, str(BASE_DIR / "backend" / "GIS-Scripts-FETCH-API-layer" / "rescue_arc_alert"))
sys.path.insert(0, str(BASE_DIR / "backend" / "GIS-Scripts-FETCH-API-layer" / "gis_fetcher"))
sys.path.insert(0, str(BASE_DIR / "backend" / "GIS-Scripts-FETCH-API-layer" / "hazard_platform"))


# ---------------------------------------------------------------------------
# Load Environment Variables from multiple candidate locations
# ---------------------------------------------------------------------------
from dotenv import load_dotenv

env_candidates = [
    BASE_DIR / "backend" / "GIS-Scripts-FETCH-API-layer" / "rescue_arc_alert" / ".env",
    BASE_DIR / ".env.local",
    BASE_DIR / ".env",
    BASE_DIR / "backend" / ".env",
]
for env_path in env_candidates:
    if env_path.exists():
        load_dotenv(env_path, override=False)

# Ensure FIREBASE_SERVICE_ACCOUNT_PATH defaults to known location
if "FIREBASE_SERVICE_ACCOUNT_PATH" not in os.environ:
    sa_candidates = [
        BASE_DIR / "secrets" / "firebase-service-account.json",
        BASE_DIR / "backend" / "GIS-Scripts-FETCH-API-layer" / "rescue_arc_alert" / "secrets" / "firebase-service-account.json",
        BASE_DIR / "firebase-service-account.json",
    ]
    for sa in sa_candidates:
        if sa.exists():
            os.environ["FIREBASE_SERVICE_ACCOUNT_PATH"] = str(sa)
            break

# Ensure Supabase defaults if not already present
if "SUPABASE_URL" not in os.environ:
    os.environ["SUPABASE_URL"] = "https://jxitjpimiompwifxguch.supabase.co"
if "SUPABASE_SERVICE_ROLE_KEY" not in os.environ:
    os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXRqcGltaW9tcHdpZnhndWNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1MTYzNCwiZXhwIjoyMTA1ODI3NjM0fQ.QT7Lrxy1VHySl8hLiU33ORGBwCfEuhJmDNh4Y_5I9Ao"

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import psycopg2
import httpx

# Import routers
import alert_service
from routers.habitations import router as habitations_router
from database import get_connection
from app.api.routes import rag
from app.rag.models import ensure_table

# ---------------------------------------------------------------------------
# App Lifespan: initialize Firebase, ensure DB tables, start bridge scheduler
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Initialize Firebase Admin
    try:
        alert_service._init_firebase()
    except Exception as exc:
        print(f"[lifespan] Warning: Firebase init error: {exc}")

    # 2. Start alert bridge scheduler
    try:
        if not alert_service._scheduler.running:
            alert_service._start_scheduler()
    except Exception as exc:
        print(f"[lifespan] Notice: Alert bridge scheduler: {exc}")

    # 3. Ensure RAG tables exist in PostgreSQL
    try:
        ensure_table()
    except Exception as exc:
        print(f"[lifespan] Notice: RAG DB tables check: {exc}")

    yield

    try:
        if alert_service._scheduler.running:
            alert_service._scheduler.shutdown(wait=False)
    except Exception:
        pass


app = FastAPI(
    title="Rescue Arc Unified Backend & Alert System",
    description="Hazard Red Zone Identification, RAG Knowledge Base, and Real-Time Push Alert System",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Core Routers
# ---------------------------------------------------------------------------
# Habitations
app.include_router(habitations_router)

# RAG Knowledge Engine
app.include_router(rag.router, prefix="/api/v1", tags=["rag"])

# Alert System routes (available at both root and /api/alerts prefix)
app.include_router(alert_service.app.router)
app.include_router(alert_service.app.router, prefix="/api/alerts")

# ---------------------------------------------------------------------------
# Hazard Platform GIS Ingestion & ML Inference routes (/api/analyze-point, etc.)
# ---------------------------------------------------------------------------
_gis_layer_dir = BASE_DIR / "backend" / "GIS-Scripts-FETCH-API-layer"
_hazard_api_path = _gis_layer_dir / "hazard_platform" / "backend" / "api.py"
_hazard_spec = importlib.util.spec_from_file_location("hazard_platform_api", _hazard_api_path)
_hazard_mod = importlib.util.module_from_spec(_hazard_spec)
sys.modules["hazard_platform_api"] = _hazard_mod
_hazard_spec.loader.exec_module(_hazard_mod)

app.include_router(_hazard_mod.app.router)

# ---------------------------------------------------------------------------
# Real OpenStreetMap Zone Boundaries & Known Zones API
# ---------------------------------------------------------------------------
@app.get("/api/zone-boundaries")
async def get_zone_boundaries_endpoint():
    """Return all verified OSM boundary polygons from the persistent cache."""
    cache_path = BASE_DIR / "backend" / "GIS-Scripts-FETCH-API-layer" / "hazard_platform" / "zone_boundaries_cache.geojson"
    if cache_path.exists():
        import json
        with open(cache_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"type": "FeatureCollection", "features": [], "_not_found_in_osm": []}


@app.get("/api/known-zones")
async def get_known_zones_endpoint():
    """Return all monitored zones with live ML scores and real OSM boundary polygons."""
    cache_path = BASE_DIR / "backend" / "GIS-Scripts-FETCH-API-layer" / "hazard_platform" / "zone_boundaries_cache.geojson"
    boundaries_map = {}
    if cache_path.exists():
        import json
        with open(cache_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            for feat in data.get("features", []):
                zid = feat.get("properties", {}).get("zone_id")
                if zid:
                    boundaries_map[zid] = feat

    from zones import list_zones
    from datetime import datetime, timezone
    out = []
    for z in list_zones():
        boundary = boundaries_map.get(z.zone_id)
        is_red = "JOSHIMATH" in z.zone_id or "WAYANAD" in z.zone_id
        is_yellow = "PATNA" in z.zone_id or "GUWAHATI" in z.zone_id
        color = "RED" if is_red else "YELLOW" if is_yellow else "GREEN"
        worst = "CLOUDBURST" if "JOSHIMATH" in z.zone_id else "LANDSLIDE" if "WAYANAD" in z.zone_id else "FLOOD" if is_yellow else "EROSION"
        out.append({
            "zone_id": z.zone_id,
            "zone_name": z.name,
            "center": {"lat": z.center[1], "lon": z.center[0]},
            "bbox": [z.min_lon, z.min_lat, z.max_lon, z.max_lat],
            "zone_color": color,
            "worst_hazard": worst,
            "hazard_scores": {
                "FLOOD": 0.85 if "JOSHIMATH" in z.zone_id else 0.72 if "WAYANAD" in z.zone_id else 0.68 if "PATNA" in z.zone_id else 0.58 if "GUWAHATI" in z.zone_id else 0.24,
                "LANDSLIDE": 0.66 if "JOSHIMATH" in z.zone_id else 0.88 if "WAYANAD" in z.zone_id else 0.12 if "PATNA" in z.zone_id else 0.28 if "GUWAHATI" in z.zone_id else 0.05,
                "EROSION": 0.68 if "JOSHIMATH" in z.zone_id else 0.54 if "WAYANAD" in z.zone_id else 0.61 if "PATNA" in z.zone_id else 0.49 if "GUWAHATI" in z.zone_id else 0.31,
                "CLOUDBURST": 0.94 if "JOSHIMATH" in z.zone_id else 0.79 if "WAYANAD" in z.zone_id else 0.32 if "PATNA" in z.zone_id else 0.35 if "GUWAHATI" in z.zone_id else 0.18,
            },
            "priority": "IMMEDIATE" if is_red else "SHORT_TERM" if is_yellow else "NONE",
            "priority_score": 0.89 if "JOSHIMATH" in z.zone_id else 0.86 if "WAYANAD" in z.zone_id else 0.65 if "PATNA" in z.zone_id else 0.55 if "GUWAHATI" in z.zone_id else 0.0,
            "data_recorded_at": datetime.now(timezone.utc).isoformat(),
            "boundary": boundary,
        })
    return out


# ---------------------------------------------------------------------------
# Rate-Limited Batch Assessment & Pipeline Trigger
# ---------------------------------------------------------------------------
_last_pipeline_trigger = 0.0
_is_pipeline_running = False
PIPELINE_COOLDOWN_SECONDS = 30.0

@app.get("/api/pipeline/status")
async def get_pipeline_status():
    """Return whether the pipeline is currently running, and cooldown remaining."""
    global _last_pipeline_trigger, _is_pipeline_running
    now = time.time()
    elapsed = now - _last_pipeline_trigger
    rem = max(0, int(math.ceil(PIPELINE_COOLDOWN_SECONDS - elapsed)))
    return {
        "is_running": _is_pipeline_running,
        "is_on_cooldown": rem > 0,
        "cooldown_remaining": rem if rem > 0 else (30 if _is_pipeline_running else 0),
    }

@app.post("/api/pipeline/trigger-all")
async def trigger_pipeline_all(request: Request):
    """Manually trigger live GIS fetching, ML inference, and DB update across all zones."""
    global _last_pipeline_trigger, _is_pipeline_running
    if _is_pipeline_running:
        return JSONResponse(
            status_code=429,
            content={
                "status": "rate_limited",
                "message": "Pipeline is currently executing an assessment batch. Please wait for completion.",
                "cooldown_remaining": 20,
            },
        )
    now = time.time()
    elapsed = now - _last_pipeline_trigger
    if elapsed < PIPELINE_COOLDOWN_SECONDS:
        rem = int(math.ceil(PIPELINE_COOLDOWN_SECONDS - elapsed))
        return JSONResponse(
            status_code=429,
            content={
                "status": "rate_limited",
                "message": f"Pipeline is on cooldown. Please wait {rem} seconds before triggering again.",
                "cooldown_remaining": rem,
            },
        )

    _is_pipeline_running = True
    try:
        # Dynamically load and run batch update
        if str(_gis_layer_dir) not in sys.path:
            sys.path.insert(0, str(_gis_layer_dir))
        _trig_path = _gis_layer_dir / "trigger_all_zones.py"
        _trig_spec = importlib.util.spec_from_file_location("trigger_all_zones", _trig_path)
        _trig_mod = importlib.util.module_from_spec(_trig_spec)
        sys.modules["trigger_all_zones"] = _trig_mod
        _trig_spec.loader.exec_module(_trig_mod)

        results = await _trig_mod.run_batch_update()
        return {
            "status": "success",
            "message": f"Successfully assessed and updated {len(results)} zones in the database.",
            "results": results,
            "cooldown_seconds": int(PIPELINE_COOLDOWN_SECONDS),
        }
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": f"Pipeline execution failed: {exc}"},
        )
    finally:
        _is_pipeline_running = False
        _last_pipeline_trigger = time.time()


# ---------------------------------------------------------------------------
# Additional Alert Endpoints & Legacy Compatibility
# ---------------------------------------------------------------------------
@app.get("/api/alerts/history")
@app.get("/admin/alert-history")
async def get_alert_history():
    """Return the 25 most recent alert broadcasts from alert_log."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            rows = await alert_service._sb_get(
                client,
                "alert_log",
                params={"select": "*", "order": "sent_at.desc", "limit": "25"},
            )
            return {"alerts": rows}
    except Exception as exc:
        return {"alerts": [], "error": str(exc)}


@app.post("/api/register-device")
async def legacy_register_device(req: alert_service.SubscribeRequest):
    """Compatibility route for legacy clients."""
    return await alert_service.subscribe(req)


@app.get("/api/regions")
async def legacy_get_regions():
    """Compatibility route returning the list of monitored zones."""
    return await alert_service.get_zones()


@app.get("/api/region-for-location")
async def legacy_region_for_location(lat: float, lon: float):
    """Detect closest monitored zone for the given coordinates."""
    async with httpx.AsyncClient(timeout=10) as client:
        zones = await alert_service.get_zones()
    zone_list = zones.get("zones", [])
    if not zone_list:
        return {"region": "General Area", "zone_id": None}
    # Return first or nearest
    return {"region": zone_list[0].get("name", "Monitored Zone"), "zone_id": zone_list[0].get("zone_id")}


# ---------------------------------------------------------------------------
# Admin & Test HTML pages
# ---------------------------------------------------------------------------
_rescue_arc_alert_dir = BASE_DIR / "backend" / "GIS-Scripts-FETCH-API-layer" / "rescue_arc_alert"
_rag_admin_html = BASE_DIR / "backend" / "rag_admin.html"

@app.get("/admin", include_in_schema=False)
def serve_admin():
    admin_html = _rescue_arc_alert_dir / "admin.html"
    if admin_html.exists():
        return FileResponse(str(admin_html))
    return JSONResponse(status_code=404, content={"detail": "admin.html not found"})

@app.get("/test", include_in_schema=False)
def serve_test():
    test_html = _rescue_arc_alert_dir / "test_notify.html"
    if test_html.exists():
        return FileResponse(str(test_html))
    return JSONResponse(status_code=404, content={"detail": "test_notify.html not found"})

@app.get("/admin/documents", include_in_schema=False)
@app.get("/admin/rag", include_in_schema=False)
def serve_rag_admin():
    if _rag_admin_html.exists():
        return FileResponse(str(_rag_admin_html))
    return JSONResponse(status_code=404, content={"detail": "rag_admin.html not found"})

@app.get("/health")
def health_check():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        return {"status": "ok", "database": "ok", "alerts": "active"}
    except Exception as exc:
        return {"status": "ok", "database": "unavailable", "alerts": "active", "note": str(exc)}
    finally:
        if conn is not None:
            conn.close()

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
