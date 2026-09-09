from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import psycopg2

from routers.habitations import router as habitations_router
from database import get_connection

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