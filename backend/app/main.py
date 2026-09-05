"""
FEATURE: FastAPI entrypoint - now also starts APScheduler on startup,
which calls the SAME pipeline function every 30 minutes that the manual
refresh endpoint calls, so scheduled and manual refreshes never compute
zones differently.
INSTALLATION: pip install apscheduler
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.models.registry import load_all_models
from app.api.routes import health, predict, rag, zones
from app.hazard.pipeline import run_hazard_pipeline
from app.api.routes import relocation

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_all_models()
    scheduler.add_job(run_hazard_pipeline, "interval", minutes=30, id="hazard_pipeline")
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="SIH ML Service", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(predict.router, prefix="/api/v1", tags=["ml"])
app.include_router(rag.router, prefix="/api/v1", tags=["rag"])
app.include_router(zones.router, prefix="/api/v1", tags=["zones"])
app.include_router(relocation.router, prefix="/api/v1", tags=["relocation"])