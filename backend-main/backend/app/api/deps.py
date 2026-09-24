"""
app/api/deps.py — Shared-secret auth between Next.js frontend and FastAPI.

Checks the X-API-Key request header against INTERNAL_API_KEY in .env.
Used by all /rag/* routes and any future protected routes.
"""
from fastapi import Header, HTTPException, status
from app.core.config import settings


async def verify_api_key(x_api_key: str = Header(...)) -> None:
    if not settings.internal_api_key:
        # If no key is configured, allow all requests (dev mode)
        return
    if x_api_key != settings.internal_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key — set X-API-Key header to the value of INTERNAL_API_KEY in your .env",
        )