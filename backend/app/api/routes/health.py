"""FEATURE: Simple liveness check - lets Next.js (or Docker) confirm this
service is up before sending real requests."""
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok"}