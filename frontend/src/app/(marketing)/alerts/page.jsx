"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { OfflineFallbackBanner } from "@/components/ui/offline-fallback-banner";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCj5i1D_G6wg4g149CUhVf899IX5mifJ00",
  authDomain: "rescue-arc-9b293.firebaseapp.com",
  projectId: "rescue-arc-9b293",
  storageBucket: "rescue-arc-9b293.firebasestorage.app",
  messagingSenderId: "420144730893",
  appId: "1:420144730893:web:d972e7ddc4f45827141644",
};

const VAPID_KEY =
  "BClYIBxo0Bja4sxNdjJffH4aMaaW7P_ajlDaZco7gu1ocIg5MCWGZvs44D3D2LMCewVOw9XoGeDD1K-4j1GU-tQ";

const HAZARD_OPTIONS = [
  { id: "LANDSLIDE", icon: "⛰️", label: "Landslide Risk", desc: "Slope instability & debris flow" },
  { id: "FLOOD",     icon: "🌊", label: "Flash Flood",    desc: "Critical water rise & submergence" },
  { id: "CLOUDBURST",icon: "⛈️", label: "Cloudburst",     desc: "Torrential deluge & flash mudslides" },
  { id: "EROSION",   icon: "🏖️", label: "Coastal Surge",  desc: "Destructive wave surge & collapse" },
];

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState("subscribe"); // 'subscribe' | 'test' | 'simulate' | 'history'
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [useLocation, setUseLocation] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [fallbackWarning, setFallbackWarning] = useState("");
  
  // Subscription state
  const [phase, setPhase] = useState("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [subscribedZone, setSubscribedZone] = useState("");
  const [storedFcmToken, setStoredFcmToken] = useState("");
  
  // Testing state
  const [testHazard, setTestHazard] = useState("LANDSLIDE");
  const [testColor, setTestColor] = useState("RED");
  const [testCustomTitle, setTestCustomTitle] = useState("");
  const [testCustomBody, setTestCustomBody] = useState("");
  const [testStatus, setTestStatus] = useState({ state: "idle", msg: "", details: null });

  // Simulation state
  const [simZone, setSimZone] = useState("Z-KERALA-WAYANAD-01");
  const [simColor, setSimColor] = useState("RED");
  const [simHazard, setSimHazard] = useState("LANDSLIDE");
  const [simResult, setSimResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // History state
  const [historyLogs, setHistoryLogs] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Live Toast state
  const [liveAlert, setLiveAlert] = useState(null);
  const messagingRef = useRef(null);

  // Load zones on mount
  useEffect(() => {
    fetch("/api/alerts/zones")
      .then((r) => {
        const isFb = r.headers.get("x-is-fallback") === "true";
        if (isFb) {
          setIsFallback(true);
          setFallbackWarning(
            r.headers.get("x-fallback-warning") ||
            "Database or backend offline using internal latest data."
          );
        }
        return r.json();
      })
      .then((d) => {
        if (d?.isFallback) {
          setIsFallback(true);
          setFallbackWarning(
            d.warning || "Database or backend offline using internal latest data."
          );
        }
        if (d?.zones?.length) {
          setZones(d.zones);
          setSelectedZone((prev) => (prev ? prev : d.zones[0]?.zone_id || ""));
        }
      })
      .catch((err) => {
        console.warn("Alert zones load failed:", err);
      });

    // Try reading cached token from localStorage
    try {
      const cached = localStorage.getItem("rescue_arc_fcm_token");
      if (cached) setStoredFcmToken(cached);
    } catch (_) {}
  }, []);

  // Listen for incoming foreground Firebase push notifications
  useEffect(() => {
    let unsub;
    (async () => {
      try {
        const { initializeApp, getApps } = await import("firebase/app");
        const { getMessaging, onMessage } = await import("firebase/messaging");
        const app = getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
        const msg = getMessaging(app);
        messagingRef.current = msg;
        unsub = onMessage(msg, (payload) => {
          setLiveAlert({
            title: payload.notification?.title ?? "Rescue-Arc Alert",
            body: payload.notification?.body ?? "Immediate hazard alert triggered.",
            time: new Date().toLocaleTimeString(),
          });
          setTimeout(() => setLiveAlert(null), 12000);
        });
      } catch (_) {}
    })();
    return () => unsub?.();
  }, []);

  // Fetch audit history when tab changes to history
  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  async function fetchHistory() {
    setIsLoadingHistory(true);
    try {
      const res = await fetch("/api/alerts/history");
      const isFb = res.headers.get("x-is-fallback") === "true";
      if (isFb) {
        setIsFallback(true);
        setFallbackWarning(
          res.headers.get("x-fallback-warning") ||
          "Database or backend offline using internal latest data."
        );
      }
      const data = await res.json();
      if (data?.isFallback) {
        setIsFallback(true);
        setFallbackWarning(
          data.warning || "Database or backend offline using internal latest data."
        );
      }
      if (data.alerts) setHistoryLogs(data.alerts);
    } catch (e) {
      console.warn("History fetch error:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  // Handle Push Permission & Token retrieval
  async function obtainFcmToken() {
    if (!("Notification" in window)) {
      throw new Error("Your browser does not support web push notifications.");
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Notification permission was denied. Please allow notifications in your browser settings.");
    }
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers are not supported in this browser.");
    }
    
    // Register and ensure service worker is active and ready
    await navigator.serviceWorker.register("/firebase-messaging-sw.js", { scope: "/" });
    const swReg = await navigator.serviceWorker.ready;
    swReg.active?.postMessage({ type: "INIT_CONFIG", config: FIREBASE_CONFIG });

    const { initializeApp, getApps } = await import("firebase/app");
    const { getMessaging, getToken } = await import("firebase/messaging");
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    const msg = getMessaging(app);
    messagingRef.current = msg;

    try {
      const token = await getToken(msg, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
      if (!token) throw new Error("Could not obtain FCM token. Check VAPID key configuration.");
      
      setStoredFcmToken(token);
      try { localStorage.setItem("rescue_arc_fcm_token", token); } catch (_) {}
      return token;
    } catch (pushErr) {
      const errStr = pushErr?.message || String(pushErr);
      if (errStr.toLowerCase().includes("push service error") || errStr.toLowerCase().includes("registration failed")) {
        const isBrave = typeof window !== "undefined" && Boolean(window.navigator?.brave);
        let detail = "Google Push Service was blocked by your browser environment.";
        if (isBrave) {
          detail = "Brave Browser blocks Google Push by default. Enable 'Use Google services for push messaging' in brave://settings/privacy and restart Brave, or use In-App Dev Mode.";
        } else {
          detail = "Google Push Service connection failed (commonly caused by Incognito mode, ad blockers, or a network firewall blocking mtalk.google.com).";
        }
        throw new Error(`Registration failed (Push Service Error): ${detail}`);
      }
      throw pushErr;
    }
  }

  // Fallback registration for local testing or blocked push service environments
  async function handleSimulatedSubscribe() {
    setPhase("subscribing");
    setStatusMsg("Registering in In-App Notification Mode…");
    const simToken = `DEV_LOCAL_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setStoredFcmToken(simToken);
    try { localStorage.setItem("rescue_arc_fcm_token", simToken); } catch (_) {}

    const zoneName = zones.find((z) => z.zone_id === selectedZone)?.name ?? selectedZone;
    setSubscribedZone(zoneName);
    setPhase("success");
    setStatusMsg(`Device successfully subscribed in In-App Mode for ${zoneName}! (You will receive foreground toast alerts)`);
  }

  // Handle standard user subscription
  async function handleSubscribe() {
    setPhase("requesting");
    setStatusMsg("Requesting notification permission…");
    try {
      const token = await obtainFcmToken();
      setPhase("subscribing");
      setStatusMsg("Registering device token with Rescue Arc Alert Engine…");

      let lat = 20.5937, lon = 78.9629;
      if (useLocation) {
        setStatusMsg("Detecting your GPS location…");
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
        ).catch(() => null);
        if (pos) { lat = pos.coords.latitude; lon = pos.coords.longitude; }
      }

      const body = { fcm_token: token, lat, lon, zone_id: selectedZone };
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      const zoneName = zones.find((z) => z.zone_id === (data.zone_id ?? selectedZone))?.name ?? selectedZone;
      setSubscribedZone(zoneName);
      setPhase("success");
      setStatusMsg(`Device successfully subscribed for ${zoneName}!`);
    } catch (err) {
      setPhase("error");
      setStatusMsg(err.message || "Failed to complete subscription.");
    }
  }

  // Handle manual test push directly to this device
  async function handleManualTestPush() {
    setTestStatus({ state: "sending", msg: "Preparing test push payload…", details: null });
    try {
      let token = storedFcmToken;
      if (!token) {
        setTestStatus({ state: "sending", msg: "Requesting notification permission & token…", details: null });
        token = await obtainFcmToken();
      }

      setTestStatus({ state: "sending", msg: "Dispatching push to Firebase Admin SDK…", details: null });
      const res = await fetch("/api/alerts/test-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fcm_token: token,
          zone_id: selectedZone,
          worst_hazard: testHazard,
          zone_color: testColor,
          custom_title: testCustomTitle || undefined,
          custom_body: testCustomBody || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setTestStatus({
          state: "success",
          msg: "Test alert dispatched! Check your device notifications.",
          details: data,
        });

        // Also trigger foreground banner for immediate visual proof
        setLiveAlert({
          title: data.title || `🚨 Emergency Alert: ${testHazard} Test`,
          body: data.body || "Real-time push delivered to device. Relocation protocols active.",
          time: new Date().toLocaleTimeString(),
        });
      } else {
        throw new Error(data.error || data.detail || "Server failed to deliver push");
      }
    } catch (err) {
      setTestStatus({ state: "error", msg: err.message || "Test push failed", details: null });
    }
  }

  // Handle full zone disaster simulation
  async function handleSimulateDisaster() {
    setIsSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch("/api/alerts/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zone_id: simZone,
          zone_color: simColor,
          worst_hazard: simHazard,
        }),
      });
      const data = await res.json();
      setSimResult(data);

      const targetZoneName = zones.find(z => z.zone_id === simZone)?.name || simZone;
      setLiveAlert({
        title: `🚨 EMERGENCY BROADCAST: ${simHazard} RED ALERT`,
        body: `Zone ${targetZoneName} state transitioned to ${simColor}. Multicast alert broadcasted to all registered field devices.`,
        time: new Date().toLocaleTimeString(),
      });
    } catch (err) {
      setSimResult({ error: err.message || "Simulation failed" });
    } finally {
      setIsSimulating(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 antialiased pb-20">
      {/* ============================================================== */}
      {/* LIVE ALERT POPUP TOAST (Foreground Push Notification)           */}
      {/* ============================================================== */}
      {liveAlert && (
        <div
          className="fixed top-24 right-5 sm:right-8 z-[10000] max-w-md w-[calc(100%-40px)] rounded-2xl border-2 border-red-500 bg-white p-5 shadow-2xl shadow-red-500/20 transition-all duration-300 animate-in fade-in slide-in-from-top-4"
          role="alert"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h4 className="text-sm font-extrabold text-red-700 tracking-tight">{liveAlert.title}</h4>
            </div>
            <button
              onClick={() => setLiveAlert(null)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-700 font-medium">{liveAlert.body}</p>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-[11px] text-slate-500 font-mono">
            <span className="font-semibold text-red-600">🚨 Rescue Arc Multi-Hazard Alert</span>
            <span>{liveAlert.time}</span>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* HEADER SECTION                                                 */}
      {/* ============================================================== */}
      <section className="border-b border-emerald-100 bg-white px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-red-700 uppercase tracking-wider">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  Real-Time Broadcast Engine
                </span>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-widest hidden sm:inline-block">
                  • FCM Web Push
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Emergency Alert <span className="text-emerald-700">&amp; Simulation Hub</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Instant hazard detection, FCM web push notifications, and real-time disaster test dispatching for field response units and citizens.
              </p>
            </div>

            {/* Quick status badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-700 shadow-xs">
                {isFallback ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Offline Cache Mode</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Database Connected</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-700 shadow-xs">
                <span>
                  Monitored Regions: <strong className="text-slate-900">{zones.length}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-700 shadow-xs">
                <span className={`h-2 w-2 rounded-full ${storedFcmToken ? "bg-emerald-500" : "bg-amber-400"}`} />
                <span>
                  This Device:{" "}
                  <strong className={storedFcmToken ? "text-emerald-700 font-bold" : "text-amber-700 font-semibold"}>
                    {storedFcmToken ? "Subscribed" : "Unregistered"}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* MAIN CONTAINER                                                 */}
      {/* ============================================================== */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Offline Fallback Warning Banner */}
        {isFallback && (
          <div className="mb-8">
            <OfflineFallbackBanner
              isFallback={true}
              message={fallbackWarning || "Database or backend offline using internal latest data."}
              source="Internal Latest Snapshot"
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8 flex items-center justify-start sm:justify-center overflow-x-auto pb-2 scrollbar-none gap-2">
          {[
            { id: "subscribe", label: "1. Subscribe Device", icon: "🔔" },
            { id: "test", label: "2. Test My Device", icon: "⚡" },
            { id: "simulate", label: "3. Simulate Red Zone Alert", icon: "🚨" },
            { id: "history", label: "4. Broadcast History Log", icon: "📜" },
          ].map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-emerald-700 text-white shadow-md shadow-emerald-700/20 active:scale-[0.98]"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 shadow-xs"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* TAB 1: SUBSCRIBE DEVICE                                         */}
        {/* ============================================================== */}
        {activeTab === "subscribe" && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-lg">
                🔔
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">Citizen &amp; Official Alert Registration</h2>
                <p className="text-xs text-slate-500">Enable real-time push warnings when risk rises in your jurisdiction.</p>
              </div>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Subscribe your browser to receive push notifications when hazard severity transitions to Yellow (Warning) or Red (Evacuate).
            </p>

            {/* Location mode toggle */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className={`flex-1 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition-all border ${
                  !useLocation
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => setUseLocation(false)}
              >
                📍 Select Monitored Region
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl py-3 px-4 text-xs sm:text-sm font-bold transition-all border ${
                  useLocation
                    ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => setUseLocation(true)}
              >
                🛰️ Use GPS Auto-Detect
              </button>
            </div>

            <div className="mt-6">
              {!useLocation ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Target Region to Monitor
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                  >
                    {zones.map((z) => (
                      <option key={z.zone_id} value={z.zone_id}>
                        {z.name || z.zone_id} ({z.zone_id})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-xs leading-relaxed text-blue-900">
                  🛰️ When you click Subscribe, your browser will prompt for GPS location access to match you with the nearest active hazard zone.
                </div>
              )}
            </div>

            {/* Feedback Message */}
            {phase !== "idle" && (
              <div
                className={`mt-6 rounded-xl border p-4 text-xs sm:text-sm font-medium ${
                  phase === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : phase === "error"
                    ? "border-red-200 bg-red-50 text-red-900"
                    : "border-blue-200 bg-blue-50 text-blue-900"
                }`}
              >
                <div className="flex items-start gap-2">
                  {phase === "requesting" || phase === "subscribing" ? (
                    <span className="h-4 w-4 mt-0.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : phase === "success" ? (
                    <span className="mt-0.5 shrink-0">✓</span>
                  ) : (
                    <span className="mt-0.5 shrink-0">⚠️</span>
                  )}
                  <div className="flex-1">
                    <span>{statusMsg}</span>
                    {phase === "error" && (
                      <div className="mt-3 pt-3 border-t border-red-200/80 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-red-700">Blocked by browser or network?</span>
                        <button
                          type="button"
                          onClick={handleSimulatedSubscribe}
                          className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 text-xs shadow-xs transition-colors"
                        >
                          Enable In-App Dev Mode (Bypass Push Service) →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3.5 px-6 shadow-md shadow-emerald-700/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              disabled={phase === "requesting" || phase === "subscribing"}
              onClick={handleSubscribe}
            >
              {phase === "requesting" || phase === "subscribing" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Registering Device…</span>
                </>
              ) : (
                <>
                  <span>🔔</span>
                  <span>Subscribe to Hazard Alerts</span>
                </>
              )}
            </button>

            {/* Registered Token Card */}
            {storedFcmToken && (
              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-slate-700">Device Token Cached:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active in Browser
                  </span>
                </div>
                <div className="mt-2 font-mono text-[11px] text-slate-500 break-all bg-white p-2 rounded-lg border border-slate-200/80">
                  {storedFcmToken.slice(0, 48)}…
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("test")}
                  className="mt-3 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Proceed to Test My Device →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: TEST PUSH TO MY DEVICE                                   */}
        {/* ============================================================== */}
        {activeTab === "test" && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-bold text-lg">
                  ⚡
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950">Instant Device Notification Test</h2>
                  <p className="text-xs text-slate-500">Verify end-to-end delivery to this screen.</p>
                </div>
              </div>
              <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-700 uppercase tracking-wide">
                Live Test Mode
              </span>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Send an immediate test push notification through Firebase Admin SDK to ensure real-time delivery works on this device.
            </p>

            {/* Hazard Scenario Selection */}
            <div className="mt-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                1. Choose Hazard Scenario
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {HAZARD_OPTIONS.map((h) => {
                  const isSel = testHazard === h.id;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setTestHazard(h.id)}
                      className={`rounded-xl border p-3 text-left transition-all ${
                        isSel
                          ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                        <span>{h.icon}</span>
                        <span>{h.label}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 leading-snug">{h.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Severity Level Selection */}
            <div className="mt-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                2. Select Severity Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`rounded-xl border py-3 px-4 font-bold text-xs sm:text-sm transition-all ${
                    testColor === "RED"
                      ? "border-red-600 bg-red-600 text-white shadow-md shadow-red-600/20"
                      : "border-red-200 bg-red-50/80 text-red-700 hover:bg-red-100"
                  }`}
                  onClick={() => setTestColor("RED")}
                >
                  🚨 Emergency RED (Evacuate)
                </button>
                <button
                  type="button"
                  className={`rounded-xl border py-3 px-4 font-bold text-xs sm:text-sm transition-all ${
                    testColor === "YELLOW"
                      ? "border-amber-600 bg-amber-600 text-white shadow-md shadow-amber-600/20"
                      : "border-amber-200 bg-amber-50/80 text-amber-700 hover:bg-amber-100"
                  }`}
                  onClick={() => setTestColor("YELLOW")}
                >
                  ⚠️ Warning YELLOW (Alert)
                </button>
              </div>
            </div>

            {/* Target Region */}
            <div className="mt-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                3. Target Region for Test
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                {zones.map((z) => (
                  <option key={z.zone_id} value={z.zone_id}>
                    {z.name || z.zone_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Feedback */}
            {testStatus.msg && (
              <div
                className={`mt-6 rounded-xl border p-4 text-xs sm:text-sm ${
                  testStatus.state === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : testStatus.state === "error"
                    ? "border-red-200 bg-red-50 text-red-900"
                    : "border-blue-200 bg-blue-50 text-blue-900"
                }`}
              >
                <div className="font-bold">{testStatus.msg}</div>
                {testStatus.details && (
                  <div className="mt-2 space-y-1 text-[11px] font-mono opacity-90 border-t border-current/10 pt-2">
                    {testStatus.details.message_id && <div>Message ID: {testStatus.details.message_id}</div>}
                    {testStatus.details.title && <div>Title: {testStatus.details.title}</div>}
                  </div>
                )}
              </div>
            )}

            {/* Dispatch Button */}
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold py-3.5 px-6 shadow-md shadow-emerald-700/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              disabled={testStatus.state === "sending"}
              onClick={handleManualTestPush}
            >
              {testStatus.state === "sending" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Dispatching Alert…</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Send Instant Test Push Notification</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: SIMULATE RED ZONE ESCALATION                             */}
        {/* ============================================================== */}
        {activeTab === "simulate" && (
          <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold text-lg">
                  🚨
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950">Full Zone Disaster Simulation</h2>
                  <p className="text-xs text-slate-500">Trigger multi-subscriber regional escalation.</p>
                </div>
              </div>
              <span className="rounded-full bg-red-50 border border-red-200 px-2.5 py-1 text-[11px] font-bold text-red-700 uppercase tracking-wide">
                Authority Broadcast
              </span>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Simulate an emergency escalation for a monitored region. This writes an audit snapshot to Supabase and broadcasts push notifications to all registered field devices in that zone.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Target Zone
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  value={simZone}
                  onChange={(e) => setSimZone(e.target.value)}
                >
                  {zones.map((z) => (
                    <option key={z.zone_id} value={z.zone_id}>
                      {z.name || z.zone_id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Primary Hazard Type
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  value={simHazard}
                  onChange={(e) => setSimHazard(e.target.value)}
                >
                  {HAZARD_OPTIONS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.icon} {h.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Severity Escalation */}
            <div className="mt-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Escalation State Target
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`rounded-xl border py-3 px-4 font-bold text-xs sm:text-sm transition-all ${
                    simColor === "RED"
                      ? "border-red-600 bg-red-600 text-white shadow-md shadow-red-600/20"
                      : "border-red-200 bg-red-50/80 text-red-700 hover:bg-red-100"
                  }`}
                  onClick={() => setSimColor("RED")}
                >
                  🚨 Escalate to RED (Immediate Evacuation)
                </button>
                <button
                  type="button"
                  className={`rounded-xl border py-3 px-4 font-bold text-xs sm:text-sm transition-all ${
                    simColor === "YELLOW"
                      ? "border-amber-600 bg-amber-600 text-white shadow-md shadow-amber-600/20"
                      : "border-amber-200 bg-amber-50/80 text-amber-700 hover:bg-amber-100"
                  }`}
                  onClick={() => setSimColor("YELLOW")}
                >
                  ⚠️ Escalate to YELLOW (Hazard Warning)
                </button>
              </div>
            </div>

            {/* Simulation Results Box */}
            {simResult && (
              <div
                className={`mt-6 rounded-xl border p-4 text-xs sm:text-sm ${
                  simResult.error
                    ? "border-red-200 bg-red-50 text-red-900"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
                }`}
              >
                {simResult.error ? (
                  <div>Error: {simResult.error}</div>
                ) : (
                  <div>
                    <div className="font-extrabold text-sm text-emerald-950 mb-2">
                      ✓ Zone Escalated: {simResult.prev_color || "GREEN"} → {simResult.new_color}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs border-t border-emerald-200/60 pt-2 font-medium">
                      <div>
                        Targeted: <strong>{simResult.targeted ?? 1}</strong>
                      </div>
                      <div>
                        Delivered: <strong>{simResult.delivered ?? 1}</strong>
                      </div>
                      <div>
                        Severity: <strong>{simResult.severity_fired ?? "alert"}</strong>
                      </div>
                    </div>
                    {simResult.classification_id && (
                      <div className="mt-2 text-[11px] font-mono text-emerald-800">
                        Audit ID: {simResult.classification_id}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Trigger Button */}
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3.5 px-6 shadow-md shadow-red-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              disabled={isSimulating}
              onClick={handleSimulateDisaster}
            >
              {isSimulating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Broadcasting Emergency Escalation…</span>
                </>
              ) : (
                <>
                  <span>🚨</span>
                  <span>Trigger Disaster Emergency Broadcast</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: AUDIT HISTORY LOG                                       */}
        {/* ============================================================== */}
        {activeTab === "history" && (
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200 font-bold text-lg">
                  📜
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-950">Alert Broadcast Audit Log</h2>
                  <p className="text-xs text-slate-500">Live records of all push dispatches stored in Supabase.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={fetchHistory}
                disabled={isLoadingHistory}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-all shadow-xs"
              >
                <span className={isLoadingHistory ? "animate-spin" : ""}>🔄</span>
                <span>Refresh Log</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Zone ID</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Transition</th>
                    <th className="py-3 px-4 text-center">Targeted</th>
                    <th className="py-3 px-4 text-center">Delivered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {historyLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                        {isLoadingHistory ? "Loading audit records from database…" : "No alert broadcast records found yet."}
                      </td>
                    </tr>
                  ) : (
                    historyLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                          {new Date(log.sent_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {log.zone_id}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border ${
                              log.severity === "alert"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {log.severity || "ALERT"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                          {log.from_color || "—"} → <span className="text-emerald-700">{log.to_color}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">{log.recipients_targeted ?? 0}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                          {log.recipients_delivered ?? 0}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Navigation & Documentation Links */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500">
          <Link href="/dashboard/admin" className="hover:text-emerald-700 hover:underline transition-colors">
            Admin Capacities Dashboard
          </Link>
          <span>•</span>
          <Link href="/admin/relocation-sites" className="hover:text-emerald-700 hover:underline transition-colors">
            Relocation Sites Manager
          </Link>
          <span>•</span>
          <Link href="/redzone" className="hover:text-emerald-700 hover:underline transition-colors">
            Live Hazard Map View
          </Link>
        </div>
      </div>
    </main>
  );
}
