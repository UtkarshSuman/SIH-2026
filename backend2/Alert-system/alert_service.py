"""
Standalone alert-trigger service. Runs SEPARATELY from your main FastAPI backend
(as discussed) — it only needs read/write access to the same database.

Run with:
    python alert_service.py

It polls the habitations table every POLL_INTERVAL_SECONDS for rows that are
red-zone and not yet alerted, sends a push notification to that region's topic,
and marks them as sent so they aren't re-alerted on the next poll.

Requires:
    pip install firebase-admin sqlalchemy psycopg2-binary

Also requires:
    - firebase-service-account.json in the same folder (see README.md for how to get this)
    - the habitations table to have an alert_sent boolean column
      (see migrate_add_alert_column.sql if it doesn't yet)
"""

import time
import os
import re
from sqlalchemy import create_engine, text
import firebase_admin
from firebase_admin import credentials, messaging
from dotenv import load_dotenv

load_dotenv()
# --- Config ---
DB_URL = os.environ["DATABASE_URL"] # replace with your real Render URL
POLL_INTERVAL_SECONDS = 5

engine = create_engine(DB_URL)

cred = credentials.Certificate("firebase-service-account.json")
firebase_admin.initialize_app(cred)


def safe_topic(name: str) -> str:
    slug = re.sub(r'[^a-zA-Z0-9_-]', '_', name.strip().lower())
    return re.sub(r'_+', '_', slug).strip('_')

def build_alert_copy(region: str, timeline: str) -> tuple[str, str]:
    """Rescue Arc-themed push copy."""
    title = f"🚨 Rescue Arc — Red Zone: {region}"
    body = (
        f"{region} has been flagged as a hazard red zone "
        f"(timeline: {timeline}). Relocation protocols active — "
        f"open Rescue Arc for evacuation routing."
    )
    return title, body
def check_and_alert():
    with engine.connect() as conn:
        rows = conn.execute(text(
            """
            SELECT h.id, h.name, h.hazard_prob, h.timeline, r.display_name AS region
            FROM habitations h
            JOIN regions r ON h.region_id = r.region_id
            WHERE h.zone_class = 'red' AND (h.alert_sent IS NULL OR h.alert_sent = FALSE)
            """
        )).mappings().all()

        print(f"Poll cycle: found {len(rows)} matching rows")
        for row in rows:
            topic = f"region_{safe_topic(row['region'])}"
            title, body = build_alert_copy(row['region'], row['timeline'])
            msg = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                topic=topic,
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        icon="https://YOUR_DEPLOYED_DOMAIN/assets/rescue-arc-icon.png",
                        badge="https://YOUR_DEPLOYED_DOMAIN/assets/rescue-arc-badge.png",
                        vibrate=[200, 100, 200],
                        tag="rescue-arc-alert",
                        require_interaction=True,
                    ),
                    fcm_options=messaging.WebpushFCMOptions(
                        link="https://YOUR_DEPLOYED_DOMAIN/dashboard.html"
                    ),
                ),
            )
            try:
                messaging.send(msg)
                conn.execute(
                    text("UPDATE habitations SET alert_sent = TRUE WHERE id = :id"),
                    {"id": row["id"]}
                )
                conn.commit()
                print(f"Alert sent for habitation {row['id']} ({row['name']}) -> topic {topic}")
            except Exception as e:
                print(f"Failed to send alert for habitation {row['id']}: {e}")


if __name__ == "__main__":
    print(f"Alert service running, polling every {POLL_INTERVAL_SECONDS}s. Ctrl+C to stop.")
    while True:
        check_and_alert()
        time.sleep(POLL_INTERVAL_SECONDS)
