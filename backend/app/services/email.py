"""
FEATURE: Brevo email sending, Python side - used for zone alert emails.
Same Brevo account/API key as the frontend's Brevo integration.
INSTALLATION: pip install httpx
"""
import httpx
from app.core.config import settings

BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email"


async def send_alert_email(to: str, subject: str, html: str) -> None:
    async with httpx.AsyncClient(timeout=10.0) as client:
        res = await client.post(
            BREVO_ENDPOINT,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "api-key": settings.brevo_api_key,
            },
            json={
                "sender": {"name": settings.brevo_sender_name, "email": settings.brevo_sender_email},
                "to": [{"email": to}],
                "subject": subject,
                "htmlContent": html,
            },
        )
        res.raise_for_status()