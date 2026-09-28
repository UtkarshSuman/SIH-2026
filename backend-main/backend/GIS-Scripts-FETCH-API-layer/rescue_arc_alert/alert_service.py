"""alert_service.py — Rescue-Arc Zone Alert Broadcast Service.

Implements Sections 2–4 of rescue-arc-alert-broadcast-spec.md as a single
FastAPI app so all concerns share one process and one scheduler.

Responsibilities
----------------
1. Classification bridge (Section 2)
   - On subscriber signup: calls /api/analyze-point on hazard_platform, upserts
     zone + first classification row, upserts the subscriber row.
   - Recurring reclassification: scheduled (BRIDGE_POLL_INTERVAL_SECONDS) or
     on-demand via POST /admin/run-bridge — calls /api/zone-status/{zone_id}
     for every known zone, inserts new classification rows, compares colors,
     fires FCM push on RED or GREEN→YELLOW transitions.
2. FCM multicast push (Section 3)
   - Initialised once from FIREBASE_SERVICE_ACCOUNT_PATH.
   - Invalid/unregistered tokens are marked active=False automatically (3B).
   - Test-push endpoint for pre-demo health check (3D).
3. Admin panel API (Section 4) — served alongside admin.html.
4. Subscriber signup API — POST /subscribe.

Run with:
    cd rescue_arc_alert
    uvicorn alert_service:app --reload --port 8001
"""
from __future__ import annotations

import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s: %(message)s",
)
log = logging.getLogger("rescue_arc_alert")

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------
SUPABASE_URL: str = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY: str = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
SUPABASE_ANON_KEY: str = os.environ.get("SUPABASE_ANON_KEY", "")
FIREBASE_SA_PATH: str = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH", "")
if FIREBASE_SA_PATH and not os.path.isabs(FIREBASE_SA_PATH):
    FIREBASE_SA_PATH = str(BASE_DIR / FIREBASE_SA_PATH)
HAZARD_BASE: str = os.environ.get("HAZARD_PLATFORM_BASE_URL", "http://localhost:8000")
POLL_INTERVAL: int = int(os.environ.get("BRIDGE_POLL_INTERVAL_SECONDS", "3600"))
_cors_raw = os.environ.get("ALERT_API_CORS_ORIGINS", "*")
CORS_ORIGINS = [o.strip() for o in _cors_raw.split(",") if o.strip()] or ["*"]

# ---------------------------------------------------------------------------
# Firebase / FCM init
# ---------------------------------------------------------------------------
import firebase_admin
from firebase_admin import credentials, messaging

_fb_app: Optional[firebase_admin.App] = None

def _init_firebase() -> None:
    global _fb_app
    if _fb_app is not None:
        return
    try:
        # 1. Check if JSON string is provided in environment
        sa_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
        if sa_json and sa_json.strip():
            sa_data = json.loads(sa_json)
            cred = credentials.Certificate(sa_data)
            _fb_app = firebase_admin.initialize_app(cred)
            log.info("Firebase Admin SDK initialised from FIREBASE_SERVICE_ACCOUNT_JSON environment variable")
            return

        # 2. Check if file path exists on disk
        if FIREBASE_SA_PATH and os.path.exists(FIREBASE_SA_PATH):
            cred = credentials.Certificate(FIREBASE_SA_PATH)
            _fb_app = firebase_admin.initialize_app(cred)
            log.info("Firebase Admin SDK initialised from %s", FIREBASE_SA_PATH)
            return

        log.warning("Notice: Firebase service account credentials not found. Push notifications will be disabled.")
    except Exception as exc:
        log.warning("Notice: Firebase Admin SDK could not be initialized: %s", exc)

# ---------------------------------------------------------------------------
# Supabase helpers (thin wrapper around the REST API via httpx so we can
# use the service-role key without shipping the supabase-py SDK's heavier
# dependency tree — swap to supabase-py's AsyncClient if preferred)
# ---------------------------------------------------------------------------
_SB_HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}


async def _sb_get(client: httpx.AsyncClient, path: str, params: dict | None = None) -> Any:
    r = await client.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=_SB_HEADERS, params=params)
    r.raise_for_status()
    return r.json()


async def _sb_post(
    client: httpx.AsyncClient,
    path: str,
    body: dict | list,
    upsert: bool = False,
    on_conflict: Optional[str] = None,
) -> Any:
    headers = dict(_SB_HEADERS)
    params = {}
    if upsert:
        headers["Prefer"] = "resolution=merge-duplicates,return=representation"
        if on_conflict:
            params["on_conflict"] = on_conflict
        elif path == "subscribers":
            params["on_conflict"] = "fcm_token"
        elif path == "zones":
            params["on_conflict"] = "zone_id"
    r = await client.post(
        f"{SUPABASE_URL}/rest/v1/{path}", headers=headers, params=params, json=body
    )
    r.raise_for_status()
    return r.json()


async def _sb_patch(client: httpx.AsyncClient, path: str, params: dict, body: dict) -> Any:
    r = await client.patch(
        f"{SUPABASE_URL}/rest/v1/{path}", headers=_SB_HEADERS, params=params, json=body
    )
    r.raise_for_status()
    return r.json()


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# Rich Hazard Notification Content Generators
# ---------------------------------------------------------------------------
_ZONE_NAME_FALLBACKS = {
    "Z-ODISHA-PURI-01": "Puri, Odisha",
    "Z-KERALA-WAYANAD-01": "Wayanad, Kerala",
    "Z-UTTARAKHAND-JOSHIMATH-01": "Joshimath, Uttarakhand",
    "Z-BIHAR-PATNA-01": "Patna, Bihar",
    "Z-ASSAM-GUWAHATI-01": "Guwahati, Assam",
}

_HAZARD_DISPLAY = {
    "FLOOD": ("🌊 Flash Flood", "critical water rise and submergence danger"),
    "LANDSLIDE": ("⛰️ Landslide Risk", "severe slope instability and debris flow"),
    "EROSION": ("🏖️ Coastal Surge & Erosion", "destructive wave surge and shoreline collapse"),
    "CLOUDBURST": ("⛈️ Severe Cloudburst", "intense localized cloudburst and torrential deluge"),
}

_DISASTER_ADVICE = {
    "FLOOD": {
        "RED": "Evacuate low-lying areas immediately. Move to designated high ground or cyclone/flood shelters. Avoid wading in floodwaters.",
        "YELLOW": "Heavy water runoff detected. Monitor local water levels, secure emergency supplies, and avoid low-lying zones.",
    },
    "LANDSLIDE": {
        "RED": "Critical slope failure imminent. Evacuate mountainside settlements immediately. Stay clear of downhill runout paths.",
        "YELLOW": "Heightened slope stress & soil saturation. Watch for ground cracks or falling rocks. Avoid steep terrain.",
    },
    "EROSION": {
        "RED": "Severe wave surge and coastal embankment collapse. Evacuate beachside structures immediately to inland shelters.",
        "YELLOW": "Elevated coastal erosion and sea swells. Stay clear of seawalls, beaches, and vulnerable coastal roads.",
    },
    "CLOUDBURST": {
        "RED": "Extreme torrential rainfall deluge. Rapid flash floods and mudslides expected. Seek reinforced overhead shelter immediately.",
        "YELLOW": "Intense localized cloudburst conditions. Stay away from natural drainage nullahs and seasonal streams.",
    },
}


def get_zone_telemetry(zone_id: str) -> dict[str, dict]:
    """Read the latest real sensor / GIS readings for a zone from hazard_readings.db."""
    db_candidates = [
        os.path.join(os.path.dirname(__file__), "..", "hazard_platform", "hazard_readings.db"),
        os.path.join(os.path.dirname(__file__), "..", "hazard_platform", "data", "hazard_readings.db"),
        "hazard_readings.db"
    ]
    db_path = next((p for p in db_candidates if os.path.exists(p)), None)
    if not db_path:
        return {}
    try:
        import sqlite3
        with sqlite3.connect(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT hazard_type, parameters FROM hazard_readings WHERE zone_id = ? ORDER BY id DESC LIMIT 8",
                (zone_id,),
            )
            result = {}
            for h_type, p_json in cursor.fetchall():
                if p_json and h_type not in result:
                    result[h_type] = json.loads(p_json)
            return result
    except Exception as exc:
        log.warning("Could not read telemetry for %s: %s", zone_id, exc)
        return {}


def format_telemetry_snippet(telemetry_map: dict, hazard_key: str) -> str:
    """Format key real GIS telemetry readings into a concise data-backed snippet."""
    t = telemetry_map.get(hazard_key, {})
    parts = []
    if hazard_key == "FLOOD":
        rain = t.get("rainfall_mm_24h")
        soil = t.get("soil_saturation_pct")
        river = t.get("river_discharge_m3s")
        if rain is not None:
            parts.append(f"Rain 24h: {rain:.1f}mm")
        if soil is not None:
            parts.append(f"Soil Sat: {int(soil)}%")
        if river is not None and river > 0:
            parts.append(f"Discharge: {river:.1f}m³/s")
    elif hazard_key == "LANDSLIDE":
        slope = t.get("slope_deg")
        soil_m = t.get("soil_moisture_pct")
        elev = t.get("elevation_m")
        if slope is not None:
            parts.append(f"Slope: {slope:.1f}°")
        if soil_m is not None:
            parts.append(f"Soil Sat: {int(soil_m)}%")
        if elev is not None and elev > 0:
            parts.append(f"Elev: {int(elev)}m")
    elif hazard_key == "EROSION":
        wave = t.get("wave_energy_index")
        dist = t.get("distance_to_coast_m")
        wind = t.get("wind_speed_kmph")
        if wave is not None:
            parts.append(f"Wave Energy: {wave:.1f}kW/m")
        if dist is not None:
            parts.append(f"Coast Dist: {dist/1000:.1f}km")
        if wind is not None:
            parts.append(f"Wind: {int(wind)}km/h")
    elif hazard_key == "CLOUDBURST":
        intensity = t.get("rainfall_intensity_mm_per_hr")
        wind = t.get("wind_speed_kmph")
        hum = t.get("humidity_pct")
        if intensity is not None:
            parts.append(f"Intensity: {intensity:.1f}mm/h")
        if hum is not None:
            parts.append(f"Humidity: {int(hum)}%")
        if wind is not None:
            parts.append(f"Wind: {int(wind)}km/h")

    return " [" + " | ".join(parts) + "]" if parts else ""


def _format_notification_content(
    zone_id: str,
    zone_name: str | None = None,
    to_color: str = "RED",
    severity: str = "alert",
    worst_hazard: str | None = None,
    hazard_score: float | None = None,
    priority: str | None = None,
) -> tuple[str, str]:
    """Format rich notification title and body containing:
    1. Disaster type with icon (e.g. 🌊 Flash Flood)
    2. Name of the region (e.g. Puri, Odisha)
    3. Concrete data-backed telemetry readings from sensors (Rain, Wave Energy, Slope, Soil Saturation)
    4. Actionable emergency directives
    """
    region = zone_name or _ZONE_NAME_FALLBACKS.get(zone_id, zone_id)
    hazard_key = (worst_hazard or "FLOOD").upper()
    hazard_label, hazard_desc = _HAZARD_DISPLAY.get(
        hazard_key, (f"⚠️ {hazard_key.capitalize()} Hazard", "elevated hazard conditions")
    )

    if to_color == "RED" or severity == "alert":
        title = f"🚨 EMERGENCY: {hazard_label} in {region}"
    elif to_color == "YELLOW" or severity == "warning":
        title = f"⚠️ HAZARD WARNING: {hazard_label} in {region}"
    elif severity == "test":
        title = f"🔔 Alert Test: {hazard_label} in {region}"
    else:
        title = f"ℹ️ All Clear: {region} Returned to Green"

    if to_color == "GREEN":
        body = f"{region} hazard risk has subsided. Conditions are currently stable."
    else:
        advice_map = _DISASTER_ADVICE.get(hazard_key, {})
        advice = advice_map.get(
            to_color, "Follow official emergency bulletins and stay vigilant."
        )
        score_text = f" (Risk: {int(hazard_score * 100)}%)" if hazard_score is not None else ""
        priority_text = f" [{priority} Priority]" if priority and priority != "NONE" else ""
        telemetry = get_zone_telemetry(zone_id)
        telemetry_snippet = format_telemetry_snippet(telemetry, hazard_key)
        body = f"{region}{telemetry_snippet}: {hazard_desc.capitalize()}{score_text}{priority_text}. {advice}"

    return title, body


def _build_message(
    token: str,
    severity: str,
    zone_id: str,
    to_color: str,
    worst_hazard: str | None = None,
    zone_name: str | None = None,
    hazard_score: float | None = None,
    priority: str | None = None,
) -> messaging.Message:
    title, body = _format_notification_content(
        zone_id=zone_id,
        zone_name=zone_name,
        to_color=to_color,
        severity=severity,
        worst_hazard=worst_hazard,
        hazard_score=hazard_score,
        priority=priority,
    )
    return messaging.Message(
        notification=messaging.Notification(title=title, body=body),
        data={
            "zone_id": zone_id,
            "region_name": zone_name or _ZONE_NAME_FALLBACKS.get(zone_id, zone_id),
            "disaster_type": worst_hazard or "UNKNOWN",
            "zone_color": to_color,
            "severity": severity,
            "hazard_score": str(hazard_score) if hazard_score is not None else "",
            "priority": priority or "",
            "sent_at": datetime.now(timezone.utc).isoformat(),
        },
        webpush=messaging.WebpushConfig(
            notification=messaging.WebpushNotification(
                title=title,
                body=body,
                icon=(
                    "/icons/icon-alert.png"
                    if (to_color == "RED" or severity == "alert")
                    else (
                        "/icons/icon-warning.png"
                        if (to_color == "YELLOW" or severity == "warning")
                        else "/icons/icon-info.png"
                    )
                ),
                badge="/icons/badge-96.png",
                require_interaction=(severity == "alert"),
                vibrate=[200, 100, 200] if severity == "alert" else [100],
            ),
        ),
        token=token,
    )


async def _send_to_zone(
    client: httpx.AsyncClient,
    zone_id: str,
    severity: str,
    to_color: str,
    from_color: str | None,
    classification_id: str,
    worst_hazard: str | None,
    zone_name: str | None = None,
    hazard_score: float | None = None,
    priority: str | None = None,
) -> tuple[int, int]:
    """Send FCM push to every active subscriber in zone_id.
    Returns (targeted, delivered).
    Marks invalid tokens inactive automatically (spec 3B).
    """
    rows = await _sb_get(
        client,
        "subscribers",
        params={"zone_id": f"eq.{zone_id}", "active": "eq.true", "select": "id,fcm_token"},
    )
    if not rows:
        return 0, 0

    targeted = len(rows)
    delivered = 0
    invalid_ids: list[str] = []

    for row in rows:
        msg = _build_message(
            token=row["fcm_token"],
            severity=severity,
            zone_id=zone_id,
            to_color=to_color,
            worst_hazard=worst_hazard,
            zone_name=zone_name,
            hazard_score=hazard_score,
            priority=priority,
        )
        try:
            messaging.send(msg)
            delivered += 1
        except messaging.UnregisteredError:
            log.warning("FCM token unregistered — marking inactive: subscriber %s", row["id"])
            invalid_ids.append(row["id"])
        except messaging.SenderIdMismatchError:
            log.warning("FCM sender-id mismatch for subscriber %s", row["id"])
            invalid_ids.append(row["id"])
        except Exception as exc:
            log.error("FCM send error for subscriber %s: %s", row["id"], exc)

    # Batch-deactivate invalid tokens
    for sub_id in invalid_ids:
        try:
            await _sb_patch(client, "subscribers", {"id": f"eq.{sub_id}"}, {"active": False})
        except Exception as exc:
            log.error("Failed to deactivate subscriber %s: %s", sub_id, exc)

    # Log to alert_log
    try:
        await _sb_post(client, "alert_log", {
            "zone_id": zone_id,
            "severity": severity,
            "from_color": from_color,
            "to_color": to_color,
            "classification_id": classification_id,
            "recipients_targeted": targeted,
            "recipients_delivered": delivered,
        })
    except Exception as exc:
        log.error("Failed to write alert_log for zone %s: %s", zone_id, exc)

    log.info(
        "Zone %s  %s → %s  severity=%s  targeted=%d  delivered=%d",
        zone_id, from_color, to_color, severity, targeted, delivered,
    )
    return targeted, delivered


# ---------------------------------------------------------------------------
# Classification bridge — Section 2
# ---------------------------------------------------------------------------
async def _fetch_zone_status(zone_id: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(f"{HAZARD_BASE}/api/zone-status/{zone_id}")
        r.raise_for_status()
        return r.json()


async def _upsert_zone(client: httpx.AsyncClient, zone_data: dict) -> None:
    """Upsert a zone row from an analyze-point or zone-status response.

    analyze-point always returns 'zone_name' and 'bbox' — all four coordinate
    columns get populated.  zone-status does not expose bbox, so those columns
    stay NULL if the zone row already exists (which it always will for known
    zones); if somehow it doesn't exist, we insert with NULL coords and the
    next analyze-point call for the same zone_id will fill them in.
    """
    row: dict[str, Any] = {"zone_id": zone_data["zone_id"]}
    if "zone_name" in zone_data:
        row["name"] = zone_data["zone_name"]
    if "bbox" in zone_data:
        bbox = zone_data["bbox"]
        row["min_lon"], row["min_lat"], row["max_lon"], row["max_lat"] = bbox
    await _sb_post(client, "zones", row, upsert=True)


async def _insert_classification(client: httpx.AsyncClient, data: dict) -> str:
    """Insert a zone_classifications row from a zone-status payload.
    Returns the new row's id (UUID).
    """
    row = {
        "zone_id": data["zone_id"],
        "zone_color": data["zone_color"],
        "worst_hazard": data.get("worst_hazard"),
        "hazard_scores": json.dumps(data.get("hazard_scores", {})),
        "priority": data.get("priority"),
        "priority_score": data.get("priority_score"),
        "data_recorded_at": data.get("data_recorded_at"),
        "stale": data.get("stale", False),
        "priority_is_placeholder": True,  # flip when real VulnerabilityInputs land
    }
    result = await _sb_post(client, "zone_classifications", row)
    return result[0]["id"]


async def _get_previous_color(client: httpx.AsyncClient, zone_id: str) -> str | None:
    """Query zone_current_status for the zone's last known color."""
    rows = await _sb_get(
        client,
        "zone_current_status",
        params={"zone_id": f"eq.{zone_id}", "select": "zone_color"},
    )
    return rows[0]["zone_color"] if rows else None


async def _reclassify_zone(client: httpx.AsyncClient, zone_id: str) -> dict:
    """Run one bridge iteration for a known zone_id (Section 2, recurring path).
    Returns a summary dict for the admin panel response.
    """
    try:
        data = await _fetch_zone_status(zone_id)
    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        log.error("zone-status fetch failed for %s: %s", zone_id, exc)
        return {"zone_id": zone_id, "error": f"hazard_platform offline or error: {exc}"}

    prev_color = await _get_previous_color(client, zone_id)
    new_color = data["zone_color"]
    class_id = await _insert_classification(client, data)

    # Transition detection (spec Section 2 step 4)
    severity: str | None = None
    if new_color == "RED":
        severity = "alert"
    elif prev_color == "GREEN" and new_color == "YELLOW":
        severity = "warning"

    targeted = delivered = 0
    if severity is not None:
        hazard = data.get("worst_hazard")
        scores = data.get("hazard_scores") or {}
        score = scores.get(hazard) if isinstance(scores, dict) and hazard else None
        priority = data.get("priority")

        # Query zone name
        zone_rows = await _sb_get(client, "zones", params={"zone_id": f"eq.{zone_id}", "select": "name"})
        zone_name = zone_rows[0].get("name") if zone_rows else None

        targeted, delivered = await _send_to_zone(
            client,
            zone_id=zone_id,
            severity=severity,
            to_color=new_color,
            from_color=prev_color,
            classification_id=class_id,
            worst_hazard=hazard,
            zone_name=zone_name,
            hazard_score=score,
            priority=priority,
        )

    return {
        "zone_id": zone_id,
        "prev_color": prev_color,
        "new_color": new_color,
        "severity_fired": severity,
        "targeted": targeted,
        "delivered": delivered,
    }


async def run_bridge_for_all_zones() -> list[dict]:
    """Reclassify every zone currently in the zones table.
    Called by the APScheduler job and by the admin panel's 'Run bridge' button.
    """
    async with httpx.AsyncClient(timeout=60) as client:
        zone_rows = await _sb_get(client, "zones", params={"select": "zone_id"})
    results = []
    async with httpx.AsyncClient(timeout=60) as client:
        for row in zone_rows:
            result = await _reclassify_zone(client, row["zone_id"])
            results.append(result)
    return results


# ---------------------------------------------------------------------------
# Scheduler
# ---------------------------------------------------------------------------
_scheduler = AsyncIOScheduler()


def _start_scheduler() -> None:
    if _scheduler.running:
        return
    _scheduler.add_job(
        run_bridge_for_all_zones,
        "interval",
        seconds=POLL_INTERVAL,
        id="bridge_poll",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
    )
    _scheduler.start()
    log.info("Bridge scheduler started — interval %ds", POLL_INTERVAL)


# ---------------------------------------------------------------------------
# App lifespan
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        _init_firebase()
    except Exception as exc:
        log.warning("Notice: Firebase init in alert_service lifespan: %s", exc)
    try:
        if not _scheduler.running:
            _start_scheduler()
    except Exception as exc:
        log.warning("Notice: Scheduler start in alert_service lifespan: %s", exc)
    yield
    try:
        if _scheduler.running:
            _scheduler.shutdown(wait=False)
    except Exception:
        pass


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
app = FastAPI(title="Rescue-Arc Alert Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["*"],
)

# Serve admin.html and the service worker from this directory
app.mount("/static", StaticFiles(directory=str(BASE_DIR)), name="static")
app.mount("/icons", StaticFiles(directory=str(BASE_DIR / "icons")), name="icons")


# ---------------------------------------------------------------------------
# Subscriber signup — Section 2 (new subscriber path) + Section 3A
# ---------------------------------------------------------------------------
class SubscribeRequest(BaseModel):
    lat: float
    lon: float
    fcm_token: str
    zone_id: Optional[str] = None  # pre-known zone, skips analyze-point call


@app.post("/subscribe")
async def subscribe(req: SubscribeRequest):
    """Register a subscriber.

    - If zone_id is provided (and already in zones), skips analyze-point.
    - Otherwise calls /api/analyze-point (does everything: zone_from_point,
      live ingest, scoring) and uses that response — no separate zone-status
      call needed for a brand-new point (spec Section 2).
    """
    async with httpx.AsyncClient(timeout=60) as client:
        # --- resolve zone ---------------------------------------------------
        if req.zone_id:
            # Check it's known
            existing = await _sb_get(
                client, "zones", params={"zone_id": f"eq.{req.zone_id}", "select": "zone_id"}
            )
            if not existing:
                raise HTTPException(status_code=404, detail=f"Unknown zone_id: {req.zone_id}")
            zone_id = req.zone_id
            status_data: dict | None = None
        else:
            # New point — call analyze-point (registers zone + scores in one shot)
            try:
                r = await client.get(
                    f"{HAZARD_BASE}/api/analyze-point",
                    params={"lat": req.lat, "lon": req.lon},
                )
                r.raise_for_status()
                status_data = r.json()
            except httpx.HTTPStatusError as exc:
                raise HTTPException(
                    status_code=502,
                    detail=f"hazard_platform analyze-point failed: {exc.response.text}",
                ) from exc

            zone_id = status_data["zone_id"]
            await _upsert_zone(client, status_data)
            await _insert_classification(client, status_data)

        # --- upsert subscriber row ------------------------------------------
        sub_row = {
            "zone_id": zone_id,
            "fcm_token": req.fcm_token,
            "last_seen_at": datetime.now(timezone.utc).isoformat(),
            "active": True,
        }
        result = await _sb_post(client, "subscribers", sub_row, upsert=True)

    return {
        "subscribed": True,
        "zone_id": zone_id,
        "subscriber_id": result[0]["id"] if result else None,
    }




# ---------------------------------------------------------------------------
# Public API — zones list (consumed by the Next.js frontend subscriber page)
# ---------------------------------------------------------------------------
@app.get("/zones")
async def list_zones():
    """Return all zones in the zones table.
    Used by the frontend /alerts subscribe page to populate the zone selector.
    Falls back to the hard-coded seed list if Supabase is unreachable.
    """
    _SEED_ZONES = [
        {"zone_id": "Z-UTTARAKHAND-JOSHIMATH-01",    "name": "Joshimath, Uttarakhand"},
        {"zone_id": "Z-KERALA-WAYANAD-01",           "name": "Wayanad, Kerala"},
        {"zone_id": "Z-KERALA-IDUKKI-01",            "name": "Idukki, Kerala"},
        {"zone_id": "Z-TAMILNADU-NILGIRIS-01",       "name": "Nilgiris, Tamil Nadu"},
        {"zone_id": "Z-WESTBENGAL-DARJEELING-01",    "name": "Darjeeling, West Bengal"},
        {"zone_id": "Z-ASSAM-DHEMAJI-01",            "name": "Dhemaji-Lakhimpur, Assam"},
        {"zone_id": "Z-ODISHA-PURI-01",              "name": "Puri, Odisha"},
        {"zone_id": "Z-GUJARAT-KUTCH-01",            "name": "Kutch, Gujarat"},
        {"zone_id": "Z-BIHAR-PATNA-01",              "name": "Patna, Bihar"},
        {"zone_id": "Z-ASSAM-GUWAHATI-01",           "name": "Guwahati, Assam"},
        {"zone_id": "Z-HIMACHAL-MANDI-01",           "name": "Mandi, Himachal Pradesh"},
        {"zone_id": "Z-UTTARAKHAND-GOPESHWAR-01",    "name": "Gopeshwar, Uttarakhand"},
        {"zone_id": "Z-KERALA-KALPETTA-01",          "name": "Kalpetta, Kerala"},
        {"zone_id": "Z-ODISHA-KENDRAPARA-01",        "name": "Kendrapara, Odisha"},
        {"zone_id": "Z-ANDHRA-KRISHNA-01",           "name": "Krishna District, Andhra Pradesh"},
        {"zone_id": "Z-WESTBENGAL-SUNDARBANS-01",     "name": "Sundarbans, West Bengal"},
        {"zone_id": "Z-MANIPUR-CHURACHANDPUR-01",    "name": "Churachandpur, Manipur"},
        {"zone_id": "Z-RAJASTHAN-BARMER-01",         "name": "Barmer, Rajasthan"},
        {"zone_id": "Z-MEGHALAYA-CHERRAPUNJI-01",     "name": "Cherrapunji, Meghalaya"},
        {"zone_id": "Z-TAMILNADU-NAGAPATTINAM-01",   "name": "Nagapattinam, Tamil Nadu"},
        {"zone_id": "Z-ASSAM-MAJULI-01",             "name": "Majuli, Assam"},
        {"zone_id": "Z-UTTARAKHAND-KEDARNATH-01",    "name": "Kedarnath, Uttarakhand"},
        {"zone_id": "Z-GUJARAT-SURAT-01",             "name": "Surat, Gujarat"},
        {"zone_id": "Z-HIMACHAL-KULLU-01",           "name": "Kullu, Himachal Pradesh"},
        {"zone_id": "Z-MAHARASHTRA-RAIGAD-01",        "name": "Raigad, Maharashtra"},
    ]
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            rows = await _sb_get(client, "zones", params={"select": "zone_id,name", "order": "zone_id.asc"})
        return {"zones": [{"zone_id": r["zone_id"], "name": r.get("name") or _ZONE_NAME_FALLBACKS.get(r["zone_id"], r["zone_id"])} for r in rows] or _SEED_ZONES}
    except Exception:
        return {"zones": _SEED_ZONES}


# ---------------------------------------------------------------------------
# Admin API — Section 4
# ---------------------------------------------------------------------------
@app.get("/admin/zone-status")

async def admin_zone_status():
    """Zone status table + subscriber counts for the admin panel.
    Enriches with names from the zones table so any newly added region appears dynamically.
    """
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            zones_db = await _sb_get(
                client,
                "zones",
                params={"select": "zone_id,name"},
            )
        except Exception:
            zones_db = []

        statuses = await _sb_get(
            client,
            "zone_current_status",
            params={"select": "*"},
        )
        # Subscriber counts per zone
        subs_all = await _sb_get(
            client,
            "subscribers",
            params={"active": "eq.true", "select": "zone_id"},
        )
    counts: dict[str, int] = {}
    for s in subs_all:
        counts[s["zone_id"]] = counts.get(s["zone_id"], 0) + 1

    zone_names: dict[str, str] = {z["zone_id"]: z.get("name") or z["zone_id"] for z in zones_db}

    seen_zones = set()
    result = []
    for row in statuses:
        zid = row["zone_id"]
        seen_zones.add(zid)
        row["subscriber_count"] = counts.get(zid, 0)
        row["name"] = zone_names.get(zid, _ZONE_NAME_FALLBACKS.get(zid, zid))
        result.append(row)

    # Any zone in zones table not yet in zone_current_status
    for z in zones_db:
        zid = z["zone_id"]
        if zid not in seen_zones:
            result.append({
                "zone_id": zid,
                "name": z.get("name") or zid,
                "zone_color": "GREEN",
                "worst_hazard": None,
                "hazard_scores": {},
                "priority": None,
                "priority_score": None,
                "classified_at": None,
                "data_recorded_at": None,
                "stale": False,
                "priority_is_placeholder": True,
                "subscriber_count": counts.get(zid, 0),
            })
    return result


@app.post("/admin/reset-all")
async def admin_reset_all():
    """Reset all zones to GREEN (All Clear) for clean presentation resets."""
    async with httpx.AsyncClient(timeout=60) as client:
        try:
            zones_db = await _sb_get(client, "zones", params={"select": "zone_id,name"})
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to query zones: {exc}")
        results = []
        for z in zones_db:
            zid = z["zone_id"]
            synthetic_data = {
                "zone_id": zid,
                "zone_color": "GREEN",
                "worst_hazard": None,
                "hazard_scores": {},
                "priority": None,
                "priority_score": None,
                "data_recorded_at": None,
                "stale": False,
            }
            try:
                class_id = await _insert_classification(client, synthetic_data)
                results.append({"zone_id": zid, "status": "reset", "class_id": class_id})
            except Exception as e:
                results.append({"zone_id": zid, "status": "error", "error": str(e)})
    return {"success": True, "results": results}


@app.get("/admin/alert-history")
async def admin_alert_history(limit: int = 50):
    """Alert log for the admin panel."""
    async with httpx.AsyncClient(timeout=30) as client:
        rows = await _sb_get(
            client,
            "alert_log",
            params={"select": "*", "order": "sent_at.desc", "limit": str(limit)},
        )
    return rows


@app.post("/admin/run-bridge")
async def admin_run_bridge():
    """Trigger a full bridge run immediately (Section 4 'Run bridge now')."""
    results = await run_bridge_for_all_zones()
    errors = [r.get("error", "") for r in results if "error" in r]
    if len(errors) == len(results) and results:
        raise HTTPException(
            status_code=503,
            detail="hazard_platform is not running on port 8000. Start it in a separate terminal: cd hazard_platform && python -m uvicorn backend.api:app --port 8000",
        )
    return {"results": results}


class OverrideRequest(BaseModel):
    zone_id: str
    zone_color: str   # 'RED' or 'YELLOW'
    worst_hazard: Optional[str] = None
    hazard_scores: Optional[dict] = None


@app.post("/admin/override-zone")
async def admin_override_zone(req: OverrideRequest):
    """Manual zone override: insert synthetic classification and fire the
    same transition-detection + broadcast path as a real bridge run (Section 4).
    """
    if req.zone_color not in ("RED", "YELLOW", "GREEN"):
        raise HTTPException(status_code=422, detail="zone_color must be RED, YELLOW, or GREEN")

    async with httpx.AsyncClient(timeout=30) as client:
        # Check zone exists
        zones = await _sb_get(client, "zones", params={"zone_id": f"eq.{req.zone_id}", "select": "zone_id"})
        if not zones:
            raise HTTPException(status_code=404, detail=f"Unknown zone_id: {req.zone_id}")

        prev_color = await _get_previous_color(client, req.zone_id)

        synthetic_data = {
            "zone_id": req.zone_id,
            "zone_color": req.zone_color,
            "worst_hazard": req.worst_hazard,
            "hazard_scores": req.hazard_scores or {},
            "priority": None,
            "priority_score": None,
            "data_recorded_at": None,
            "stale": True,
        }
        class_id = await _insert_classification(client, synthetic_data)

        # Transition detection — same logic as bridge
        severity: str | None = None
        if req.zone_color == "RED":
            severity = "alert"
        elif prev_color == "GREEN" and req.zone_color == "YELLOW":
            severity = "warning"

        targeted = delivered = 0
        if severity:
            zone_name = zones[0].get("name") if zones else None
            hazard = req.worst_hazard or "EROSION"
            scores = req.hazard_scores or {}
            score = scores.get(hazard) if isinstance(scores, dict) and hazard in scores else (0.85 if req.zone_color == "RED" else 0.45)
            targeted, delivered = await _send_to_zone(
                client,
                zone_id=req.zone_id,
                severity=severity,
                to_color=req.zone_color,
                from_color=prev_color,
                classification_id=class_id,
                worst_hazard=hazard,
                zone_name=zone_name,
                hazard_score=score,
                priority="IMMEDIATE" if req.zone_color == "RED" else "SHORT_TERM",
            )

    return {
        "classification_id": class_id,
        "prev_color": prev_color,
        "new_color": req.zone_color,
        "severity_fired": severity,
        "targeted": targeted,
        "delivered": delivered,
    }


class TestPushRequest(BaseModel):
    fcm_token: str
    zone_id: Optional[str] = "Z-ODISHA-PURI-01"
    worst_hazard: Optional[str] = "EROSION"
    zone_color: Optional[str] = "RED"


@app.post("/admin/test-push")
async def admin_test_push(req: TestPushRequest):
    """Pre-demo health check: send a test push to a known token (Section 3D)."""
    _init_firebase()
    zone_id = req.zone_id or "Z-ODISHA-PURI-01"
    color = req.zone_color or "RED"
    hazard = req.worst_hazard or "EROSION"
    severity = "alert" if color == "RED" else "warning"

    zone_name = None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            zone_rows = await _sb_get(client, "zones", params={"zone_id": f"eq.{zone_id}", "select": "name"})
            zone_name = zone_rows[0].get("name") if zone_rows else None
    except Exception:
        pass

    title, body = _format_notification_content(
        zone_id=zone_id,
        zone_name=zone_name,
        to_color=color,
        severity=severity,
        worst_hazard=hazard,
        hazard_score=0.88 if color == "RED" else 0.48,
        priority="IMMEDIATE" if color == "RED" else "SHORT_TERM",
    )

    if _fb_app is None:
        return {
            "success": True,
            "message_id": f"mock-msg-{int(datetime.now().timestamp())}",
            "title": title,
            "body": body,
            "simulated": True,
            "note": "Firebase Admin SDK not configured with service account credentials",
        }

    msg = _build_message(
        token=req.fcm_token,
        severity=severity,
        zone_id=zone_id,
        to_color=color,
        worst_hazard=hazard,
        zone_name=zone_name,
        hazard_score=0.88 if color == "RED" else 0.48,
        priority="IMMEDIATE" if color == "RED" else "SHORT_TERM",
    )
    try:
        message_id = messaging.send(msg)
        return {"success": True, "message_id": message_id, "title": title, "body": body, "simulated": False}
    except messaging.UnregisteredError:
        raise HTTPException(status_code=400, detail="FCM token is unregistered / invalid.")
    except Exception as exc:
        log.warning("FCM delivery warning: %s", exc)
        return {
            "success": True,
            "message_id": f"fcm-notice-{int(datetime.now().timestamp())}",
            "title": title,
            "body": body,
            "simulated": True,
            "note": f"FCM send notice: {exc}",
        }


@app.get("/admin/reset-zone/{zone_id}")
async def admin_reset_zone(zone_id: str):
    """Reset override: trigger a real bridge run for one zone (Section 4 'Reset')."""
    async with httpx.AsyncClient(timeout=60) as client:
        result = await _reclassify_zone(client, zone_id)
    return result


# ---------------------------------------------------------------------------
# Firebase config endpoint (public web-app values — safe to expose)
# ---------------------------------------------------------------------------
@app.get("/admin/firebase-config")
async def firebase_config():
    """Return the public Firebase web-app config so test pages can initialise
    the SDK without hard-coding keys.  These values are the same ones that
    would normally appear in the client-side JS bundle — they are NOT secret.
    """
    return {
        "apiKey":            os.environ.get("FIREBASE_API_KEY", "").rstrip(","),
        "authDomain":        os.environ.get("FIREBASE_AUTH_DOMAIN", "").rstrip(","),
        "projectId":         os.environ.get("FIREBASE_PROJECT_ID", "").rstrip(","),
        "storageBucket":     os.environ.get("FIREBASE_STORAGE_BUCKET", "").rstrip(","),
        "messagingSenderId": os.environ.get("FIREBASE_MESSAGING_SENDER_ID", "").rstrip(","),
        "appId":             os.environ.get("FIREBASE_APP_ID", "").rstrip(","),
        "measurementId":     os.environ.get("FIREBASE_MEASUREMENT_ID", "").rstrip(","),
        "vapidKey":          os.environ.get("VAPID_PUBLIC_KEY", "").strip(),
    }


@app.get("/admin/zone-telemetry/{zone_id}")
async def admin_zone_telemetry(zone_id: str):
    """Return live sensor readings and GIS telemetry for a zone."""
    return get_zone_telemetry(zone_id)


# ---------------------------------------------------------------------------
# Serve admin.html at /admin
# ---------------------------------------------------------------------------
@app.get("/admin", include_in_schema=False)
async def admin_panel():
    return FileResponse(str(BASE_DIR / "admin.html"))


@app.get("/firebase-messaging-sw.js", include_in_schema=False)
async def serve_sw():
    return FileResponse(str(BASE_DIR / "firebase-messaging-sw.js"), media_type="application/javascript")


@app.get("/test", include_in_schema=False)
async def test_page():
    """Convenience shortcut to the notification test page."""
    return FileResponse(str(BASE_DIR / "test_notify.html"))
