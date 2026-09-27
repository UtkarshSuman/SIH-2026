/**
 * subscriber.js — Rescue-Arc browser-side subscription flow
 *
 * Implements Section 3A of the spec:
 *   - Separates "permission granted" from "token registered with backend"
 *   - Serves via HTTPS/localhost only (SW won't register on file://)
 *   - VAPID key from window.RESCUE_ARC_CONFIG (set by admin.html / embed page)
 *   - Sends FCM token to POST /subscribe on the alert backend
 *
 * Usage from a page:
 *   <script>
 *     window.RESCUE_ARC_CONFIG = {
 *       vapidKey:         "BH...",
 *       alertApiBase:     "http://localhost:8001",
 *       firebaseConfig:   { apiKey: "...", ... },
 *       // Optional — pass a zone_id to skip the analyze-point call:
 *       // zoneId: "Z-BIHAR-PATNA-01",
 *     };
 *   </script>
 *   <script src="subscriber.js" type="module"></script>
 */

import { initializeApp }         from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";

const cfg = window.RESCUE_ARC_CONFIG || {};
const VAPID_KEY     = cfg.vapidKey      || "";
const API_BASE      = cfg.alertApiBase  || "http://localhost:8001";
const FB_CONFIG     = cfg.firebaseConfig || {};
const PRESET_ZONE   = cfg.zoneId        || null;

// ---- Status reporting helpers ----------------------------------------
function _status(msg, isError = false) {
  console[isError ? "error" : "log"]("[Rescue-Arc]", msg);
  document.dispatchEvent(new CustomEvent("rescue-arc-status", {
    detail: { message: msg, isError },
  }));
}

// ---- Main subscribe flow --------------------------------------------
export async function subscribe(lat, lon) {
  // Step 1 — permission
  let permission;
  try {
    permission = await Notification.requestPermission();
  } catch (err) {
    _status("Notification.requestPermission() failed — browser may not support it.", true);
    throw err;
  }

  if (permission !== "granted") {
    _status("Notification permission denied by user. Alerts will not be delivered.", true);
    throw new Error("permission_denied");
  }
  _status("Notification permission granted.");

  // Step 2 — service worker + FCM token
  let fcmToken;
  try {
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers are not supported in this browser.");
    }
    const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    // Pass Firebase config to the SW so it can initialise Firebase internally
    swReg.active?.postMessage({ type: "INIT_CONFIG", config: FB_CONFIG });

    const app = initializeApp(FB_CONFIG);
    const messaging = getMessaging(app);
    fcmToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (!fcmToken) {
      throw new Error("getToken returned empty — check VAPID key and Firebase config.");
    }
    _status("FCM token obtained.");
  } catch (err) {
    _status(`FCM token registration failed: ${err.message}`, true);
    throw err;
  }

  // Step 3 — register with alert backend (separate step so we can report each failure)
  try {
    const body = { fcm_token: fcmToken, lat, lon };
    if (PRESET_ZONE) body.zone_id = PRESET_ZONE;

    const res = await fetch(`${API_BASE}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Backend returned ${res.status}: ${detail}`);
    }

    const data = await res.json();
    _status(`Subscribed to zone ${data.zone_id} (subscriber ${data.subscriber_id}).`);
    return data;
  } catch (err) {
    _status(`Backend registration failed: ${err.message}`, true);
    throw err;
  }
}

// Auto-wire to any button with id="rescue-arc-subscribe-btn"
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("rescue-arc-subscribe-btn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Getting location…";
    try {
      const { lat, lon } = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          reject,
          { timeout: 10000 }
        )
      );
      btn.textContent = "Subscribing…";
      const result = await subscribe(lat, lon);
      btn.textContent = `✓ Subscribed — Zone ${result.zone_id}`;
    } catch (err) {
      btn.textContent = "Subscription failed — check console";
      btn.disabled = false;
    }
  });
});
