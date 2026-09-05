"""
FEATURE: Fast2SMS sending, Python side - used for zone alert SMS.
India-only, 10-digit numbers, free-tier daily quota - same limitations
as the frontend's Fast2SMS integration.
INSTALLATION: pip install httpx
"""
import httpx
from app.core.config import settings

FAST2SMS_ENDPOINT = "https://www.fast2sms.com/dev/bulkV2"


async def send_alert_sms(phone_number: str, message: str) -> None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(
            FAST2SMS_ENDPOINT,
            headers={"authorization": settings.fast2sms_api_key, "Content-Type": "application/json"},
            json={"route": "q", "message": message, "language": "english", "flash": 0, "numbers": phone_number},
        )
        res.raise_for_status()