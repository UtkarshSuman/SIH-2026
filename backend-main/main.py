import sys
import os
from pathlib import Path
from contextlib import asynccontextmanager

# ---------------------------------------------------------------------------
# Setup sys.path so subpackages can be imported seamlessly
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR / "backend"))
sys.path.insert(0, str(BASE_DIR / "backend" / "GIS-Scripts-FETCH-API-layer" / "rescue_arc_alert"))
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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
