"""
FEATURE: Shared-secret auth between Next.js and this service - checks the
X-API-Key header on every request against INTERNAL_API_KEY. Both services
run in a trusted environment, this is defense-in-depth not the primary
security boundary (real user auth stays in Next.js/NextAuth).
INSTALLATION: none.
"""
from fastapi import Header, HTTPException, status
from app.core.config import settings


async def verify_api_key(x_api_key: str = Header(...)) -> None:
    if x_api_key != settings.internal_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")