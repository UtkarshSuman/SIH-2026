/**
 * Serves the subscriber page for push notification signup.
 * Content is inlined so it works on Vercel where backend2/ doesn't exist at runtime.
 * Redirects to the subscriber page served by the backend, or renders inline.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const auto = searchParams.get("auto");

  // Redirect to the backend's subscriber page if BACKEND2_URL is set,
  // otherwise serve a minimal inline version.
  const backendUrl = process.env.BACKEND2_URL;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Rescue Arc — Hazard Alerts</title>
    <link
      href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600&display=swap"
      rel="stylesheet"
    />
    <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"><\/script>
    <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"><\/script>
    <style>
      :root {
        --ink: #102b21;
        --muted: #60766c;
        --line: #dcebe3;
        --surface: #ffffff;
        --surface-soft: #f3faf6;
        --emerald: #087f5b;
        --emerald-dark: #056b4d;
        --emerald-soft: #e4f5ee;
      }
      body {
        min-height: 100vh;
        margin: 0;
        padding: 32px 18px;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        background: linear-gradient(135deg, #f8fcfa 0%, #eef8f3 100%);
        color: var(--ink);
        font-family: "Plus Jakarta Sans", sans-serif;
      }
      main {
        width: 100%;
        max-width: 520px;
        padding: 30px;
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid var(--line);
        border-radius: 20px;
        box-shadow: 0 18px 50px rgba(30, 83, 61, 0.12);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 22px;
        border-bottom: 1px solid #e7f1ec;
      }
      .brand img {
        width: 42px;
        height: 42px;
        border: 1px solid #b8e3ce;
        border-radius: 12px;
      }
      .brand-name {
        color: var(--ink);
        font-size: 17px;
        font-weight: 800;
      }
      .brand-name span { color: var(--emerald); }
      .brand-caption {
        margin-top: 3px;
        color: var(--muted);
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .intro { padding: 26px 0 18px; }
      h2 {
        margin: 0 0 8px;
        color: var(--ink);
        font-size: 26px;
        letter-spacing: -0.03em;
      }
      .intro p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.65;
      }
      button {
        width: 100%;
        font-size: 14px;
        padding: 13px 20px;
        border-radius: 10px;
        border: none;
        background: var(--emerald);
        color: #ffffff;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 7px 16px rgba(8, 127, 91, 0.16);
        transition: background 160ms ease, transform 160ms ease;
      }
      button:hover:not(:disabled) { background: var(--emerald-dark); transform: translateY(-1px); }
      button:disabled { background: #b8c9c1; color: #f5faf7; box-shadow: none; cursor: wait; }
      #retryLocationBtn {
        width: auto;
        margin-top: 10px;
        padding: 9px 14px;
        background: var(--surface-soft);
        border: 1px solid #b8e3ce;
        color: var(--emerald-dark);
        box-shadow: none;
      }
      #status {
        margin: 0 0 14px;
        padding: 11px 13px;
        border: 1px solid #cfe8db;
        border-radius: 10px;
        background: var(--surface-soft);
        color: #2d5d49;
        font-size: 13px;
        line-height: 1.45;
      }
      @media (max-width: 560px) {
        body { padding: 16px 12px; }
        main { padding: 22px 18px; border-radius: 16px; }
        h2 { font-size: 23px; }
      }
    </style>
  </head>
  <body>
    <main>
    <div class="brand">
      <img src="/logo.jpeg" alt="Rescue Arc logo" />
      <div>
        <div class="brand-name">Rescue <span>Arc</span></div>
        <div class="brand-caption">Hazard Red Zone Hub</div>
      </div>
    </div>

    <div class="intro">
      <h2>Hazard alerts for your area</h2>
      <p>Subscribe to receive an instant notification if your region is flagged as a hazard zone.</p>
    </div>

    <p id="status">Detecting your region…</p>
    <button id="subscribe" disabled>Subscribe to alerts</button>
    <button id="retryLocationBtn" style="display: none">Retry location</button>
    </main>

<script>
          const firebaseConfig = {
            apiKey: "AIzaSyCmfXDnyRHm8TD-Yi8dJdCgN72SS8hC_cI",
            authDomain: "rescue-arc.firebaseapp.com",
            projectId: "rescue-arc",
            storageBucket: "rescue-arc.firebasestorage.app",
            messagingSenderId: "524996615036",
            appId: "1:524996615036:web:e43e7ba29046444705a2f9",
          };
          const VAPID_KEY =
            "BNoRuvQsMJEOrzlmkOlhz75NS_ms9Sk-9L5MwXY0vyHWanoz7qIe4q2kwaHEfpraVqV6Kb2Z1fUzLKZWxINGNVE";

          const BACKEND_URL = "/api/backend";

          firebase.initializeApp(firebaseConfig);
          const messaging = firebase.messaging();
          const statusEl = document.getElementById("status");
          const btn = document.getElementById("subscribe");
          const retryBtn = document.getElementById("retryLocationBtn");
          let detectedRegion = null;

          const isAutoMode =
            new URLSearchParams(window.location.search).get("auto") === "1";

          function detectRegion() {
            statusEl.innerText = "Detecting your region…";
            retryBtn.style.display = "none";
            btn.disabled = true;

            if (!navigator.geolocation) {
              statusEl.innerText = "Location isn't supported on this device.";
              retryBtn.style.display = "inline-block";
              return;
            }

            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                  const res = await fetch(
                    BACKEND_URL + "/region-for-location?lat=" + latitude + "&lon=" + longitude,
                  );
                  if (!res.ok) throw new Error("no match");
                  const data = await res.json();
                  detectedRegion = data.region;
                  statusEl.innerText = "Region detected: " + detectedRegion;
                  btn.disabled = false;
                  if (isAutoMode) subscribeUser();
                } catch (e) {
                  detectedRegion = null;
                  statusEl.innerText =
                    "Your area isn't in our database yet — you can still subscribe for general alerts.";
                  btn.disabled = false;
                  if (isAutoMode) subscribeUser();
                }
              },
              () => {
                statusEl.innerText =
                  "Location permission denied — enable it to subscribe.";
                retryBtn.style.display = "inline-block";
              },
              { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
            );
          }

          retryBtn.addEventListener("click", detectRegion);
          window.addEventListener("load", detectRegion);

          async function subscribeUser() {
            btn.disabled = true;
            statusEl.innerText = "Requesting permission...";
            try {
              const permission = await Notification.requestPermission();
              if (permission !== "granted") {
                statusEl.innerText =
                  "Permission denied. Enable notifications in browser settings.";
                btn.disabled = false;
                return;
              }
              const registration = await navigator.serviceWorker.register(
                "/firebase-messaging-sw.js",
              );
              const token = await messaging.getToken({
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration,
              });

              const res = await fetch(BACKEND_URL + "/register-device", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token,
                  region: detectedRegion || "unassigned",
                }),
              });
              if (res.ok) {
                statusEl.innerText = detectedRegion
                  ? "Subscribed to alerts for " + detectedRegion + "."
                  : "Subscribed — your area isn't matched to a region yet, but you'll get general alerts.";
              } else {
                statusEl.innerText =
                  "Server error while registering. Check backend logs.";
              }
            } catch (err) {
              statusEl.innerText = "Error: " + err.message;
            }
            btn.disabled = false;
          }

          btn.onclick = subscribeUser;
          messaging.onMessage((payload) => {
            statusEl.style.color = "#facc15";
            statusEl.innerText = (payload.notification?.title || "Alert") + " — " + (payload.notification?.body || "");
          });
    <\/script>
  </body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}