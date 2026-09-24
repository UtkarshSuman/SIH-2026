from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import psycopg2

from routers.habitations import router as habitations_router
from database import get_connection
from app.api.routes import rag
from alert_routes import router as alert_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your actual frontend origin before production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(habitations_router)
app.include_router(alert_router)
app.include_router(rag.router, prefix="/api/v1", tags=["rag"])

from pathlib import Path
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from app.rag.models import ensure_table

_backend_dir = Path(__file__).resolve().parent
_admin_html = _backend_dir / "admin.html"
_rag_admin_html = _backend_dir / "rag_admin.html"

@app.on_event("startup")
def on_startup():
    """Ensure database tables exist on startup (idempotent)."""
    try:
        ensure_table()
    except Exception as exc:
        # Non-fatal: in local dev without DB or during initial setup
        print(f"[startup] Warning initializing DB tables: {exc}")

@app.get("/admin", include_in_schema=False)
def serve_admin():
    if _admin_html.exists():
        return FileResponse(_admin_html)
    return JSONResponse(status_code=404, content={"detail": "admin.html not found"})

@app.get("/admin/documents", include_in_schema=False)
@app.get("/admin/rag", include_in_schema=False)
def serve_rag_admin():
    if _rag_admin_html.exists():
        return FileResponse(_rag_admin_html)
    return JSONResponse(status_code=404, content={"detail": "rag_admin.html not found"})

@app.get("/health")
def health_check():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        return {"status": "ok", "database": "ok"}
    except (psycopg2.Error, RuntimeError) as exc:
        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", "database": "unavailable", "error": str(exc)},
        )
    finally:
        if conn is not None:
            conn.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)