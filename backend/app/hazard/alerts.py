"""
FEATURE: Sends zone escalation alerts - queries Prisma's `User` table
(read-only, raw SQL - Python doesn't need the full Prisma client just to
read a few columns) for everyone whose `location` matches the zone's
slug, then emails + texts them with a message specific to their zone's
new status. RED and YELLOW get different message wording.
INSTALLATION: pip install sqlalchemy
"""
from sqlalchemy import text
from app.gis.database import SessionLocal
from app.services.email import send_alert_email
from app.services.sms import send_alert_sms
from app.core.config import settings

MESSAGES = {
    "RED": {
        "subject": "URGENT: High {hazard} risk in {zone}",
        "body": "A HIGH risk of {hazard} has been detected in {zone}. Please take precautions and follow local authority guidance. Risk score: {score}.",
    },
    "YELLOW": {
        "subject": "Advisory: Elevated {hazard} risk in {zone}",
        "body": "An ELEVATED risk of {hazard} has been detected in {zone}. Stay alert to updates. Risk score: {score}.",
    },
}


async def send_zone_alert(zone_slug: str, zone_name: str, hazard_type: str, status: str, risk_score: float) -> None:
    if status not in MESSAGES:
        return  # no alert on GREEN

    db = SessionLocal()
    try:
        # Reads Prisma's "User" table directly - table/column names must
        # match Prisma's exact defaults (quoted, case-sensitive).
        rows = db.execute(
            text('SELECT email, "mobileNumber" FROM "User" WHERE location = :slug'),
            {"slug": zone_slug},
        ).fetchall()
    finally:
        db.close()

    template = MESSAGES[status]
    subject = template["subject"].format(hazard=hazard_type, zone=zone_name)
    body = template["body"].format(hazard=hazard_type, zone=zone_name, score=round(risk_score, 2))

    for email, mobile in rows:
        
        if email:
            try:
                await send_alert_email(email, subject, f"<p>{body}</p>")
            except Exception as e:
                print(f"Failed to email {email}: {e}")
        if mobile:
            try:
                await send_alert_sms(mobile, body)
            except Exception as e:
                print(f"Failed to SMS {mobile}: {e}")