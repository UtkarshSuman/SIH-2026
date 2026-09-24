"""
Alert-system routes to ADD to your existing FastAPI backend.

How to wire this in:
    from alert_routes import router as alert_router
    app.include_router(alert_router)

Requires:
    pip install firebase-admin sqlalchemy psycopg2-binary

Also requires a Firebase service account key file (see README.md) placed at:
    firebase-service-account.json
"""
import os
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, text
import firebase_admin
from firebase_admin import credentials, messaging
from dotenv import load_dotenv
import qrcode
from io import BytesIO
from fastapi.responses import StreamingResponse

load_dotenv()
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://127.0.0.1:5500")

# --- Config: point this at the same DB your main app uses ---
DB_URL = os.environ["DATABASE_URL"]  # replace with your real Render URL
engine = create_engine(DB_URL)

# --- Firebase Admin SDK init (do this once) ---
cred = credentials.Certificate("firebase-service-account.json")
firebase_admin.initialize_app(cred)


def safe_topic(name: str) -> str:
    slug = re.sub(r'[^a-zA-Z0-9_-]', '_', name.strip().lower())
    return re.sub(r'_+', '_', slug).strip('_')


router = APIRouter()


class RegisterDeviceRequest(BaseModel):
    token: str
    region: str


@router.post("/api/register-device")
def register_device(req: RegisterDeviceRequest):
    """Subscribes a device's FCM token to a region topic, e.g. 'region_wayanad'."""
    topic = f"region_{safe_topic(req.region)}"
    try:
        response = messaging.subscribe_to_topic([req.token], topic)
        if response.failure_count > 0:
            raise HTTPException(status_code=500, detail="Failed to subscribe device to topic")
        return {"status": "subscribed", "topic": topic}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/regions")
def get_regions():
    with engine.connect() as conn:
        rows = conn.execute(text(
            "SELECT region_id, display_name FROM regions ORDER BY display_name"
        )).mappings().all()
        return [dict(row) for row in rows]

@router.get("/api/qr")
def get_subscribe_qr():
    subscribe_url = f"{FRONTEND_BASE_URL}/subscriber.html?auto=1"
    img = qrcode.make(subscribe_url)
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

@router.get("/api/region-for-location")
def region_for_location(lat: float, lon: float):
    with engine.connect() as conn:
        result = conn.execute(text("""
           SELECT r.display_name
           FROM habitations h
           JOIN regions r ON h.region_id = r.region_id
           ORDER BY h.geom <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)
            LIMIT 1
        """), {"lat": lat, "lon": lon}).fetchone()
    if not result:
        raise HTTPException(status_code=404, detail="No matching region found")
    return {"region": result[0]}

class ResetRegionRequest(BaseModel):
    region: str


@router.post("/api/reset-region-alerts")
def reset_region_alerts(req: ResetRegionRequest):
    """
    DEMO/TESTING ONLY. Resets alert_sent back to false for every currently-alerted
    habitation in a single region. alert_service.py's poller picks this up on its
    next 5s cycle and sends the real notification for that region only.
    """
    with engine.begin() as conn:
        result = conn.execute(text(
"UPDATE habitations SET alert_sent = false WHERE region_id = :region AND alert_sent = true"        ), {"region": req.region})
        return {"region": req.region, "reset_count": result.rowcount}