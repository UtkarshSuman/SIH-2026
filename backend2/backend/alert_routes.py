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
import json
import re
from pathlib import Path
import psycopg2
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_connection
from dotenv import load_dotenv
from fastapi.responses import Response

load_dotenv()
FRONTEND_BASE_URL = os.environ.get("FRONTEND_BASE_URL", "http://127.0.0.1:5500")

# --- Config: point this at the same DB your main app uses ---
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
        import firebase_admin
        from firebase_admin import credentials, messaging

        firebase_credentials_path = Path(__file__).resolve().parents[1] / "Alert-system" / "firebase-service-account.json"
        firebase_credentials_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
        if not firebase_credentials_json and not firebase_credentials_path.exists():
            raise HTTPException(status_code=503, detail="Firebase alert service is not configured")
        if not firebase_admin._apps:
            certificate = (
                credentials.Certificate(json.loads(firebase_credentials_json))
                if firebase_credentials_json
                else credentials.Certificate(str(firebase_credentials_path))
            )
            firebase_admin.initialize_app(certificate)

        response = messaging.subscribe_to_topic([req.token], topic)
        if response.failure_count > 0:
            raise HTTPException(status_code=500, detail="Failed to subscribe device to topic")
        return {"status": "subscribed", "topic": topic}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/regions")
def get_regions():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT region_id, display_name FROM regions ORDER BY display_name")
        return [{"region_id": row[0], "display_name": row[1]} for row in cur.fetchall()]
    except psycopg2.OperationalError as exc:
        print(f"DB connection failed in get_regions: {exc}")
        raise HTTPException(status_code=503, detail="Database is unavailable") from exc
        if "conn" in locals():
            conn.close()

@router.get("/api/qr")
def get_subscribe_qr():
    import qrcode
    from qrcode.image.svg import SvgImage

    subscribe_url = f"{FRONTEND_BASE_URL}/subscribe?auto=1"
    img = qrcode.make(subscribe_url, image_factory=SvgImage)
    return Response(content=img.to_string(), media_type="image/svg+xml")

@router.get("/api/region-for-location")
def region_for_location(lat: float, lon: float):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
           SELECT r.display_name
           FROM habitations h
           JOIN regions r ON h.region_id = r.region_id
           ORDER BY h.geom <-> ST_SetSRID(ST_MakePoint(%s, %s), 4326)
            LIMIT 1
        """, (lon, lat))
        result = cur.fetchone()
    except psycopg2.OperationalError as exc:
        print(f"DB connection failed in region_for_location: {exc}")
        raise HTTPException(status_code=503, detail="Database is unavailable") from exc
    finally:
        if "conn" in locals():
            conn.close()
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
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE habitations SET alert_sent = false WHERE region_id = %s AND alert_sent = true",
            (req.region,),
        )
        conn.commit()
        return {"region": req.region, "reset_count": cur.rowcount}
    finally:
        conn.close()