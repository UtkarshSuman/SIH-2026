"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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

const FALLBACK_ZONES = [
  { zone_id: "Z-KERALA-WAYANAD-01",        name: "Wayanad, Kerala",          defaultHazard: "LANDSLIDE" },
  { zone_id: "Z-UTTARAKHAND-JOSHIMATH-01", name: "Joshimath, Uttarakhand",   defaultHazard: "LANDSLIDE" },
  { zone_id: "Z-ODISHA-PURI-01",           name: "Puri, Odisha",             defaultHazard: "EROSION" },
  { zone_id: "Z-BIHAR-PATNA-01",           name: "Patna, Bihar",             defaultHazard: "FLOOD" },
  { zone_id: "Z-ASSAM-GUWAHATI-01",        name: "Guwahati, Assam",          defaultHazard: "FLOOD" },
  { zone_id: "Z-KERALA-IDUKKI-01",         name: "Idukki, Kerala",           defaultHazard: "LANDSLIDE" },
  { zone_id: "Z-TAMILNADU-NILGIRIS-01",    name: "Nilgiris, Tamil Nadu",      defaultHazard: "LANDSLIDE" },
  { zone_id: "Z-WESTBENGAL-DARJEELING-01", name: "Darjeeling, West Bengal",   defaultHazard: "LANDSLIDE" },
  { zone_id: "Z-ASSAM-DHEMAJI-01",         name: "Dhemaji-Lakhimpur, Assam", defaultHazard: "FLOOD" },
  { zone_id: "Z-GUJARAT-KUTCH-01",         name: "Kutch, Gujarat",           defaultHazard: "EROSION" },
];

const HAZARD_OPTIONS = [
  { id: "LANDSLIDE", icon: "⛰️", label: "Landslide Risk", desc: "Slope instability & debris flow" },
  { id: "FLOOD",     icon: "🌊", label: "Flash Flood",    desc: "Critical water rise & submergence" },
  { id: "CLOUDBURST",icon: "⛈️", label: "Cloudburst",     desc: "Torrential deluge & flash mudslides" },
  { id: "EROSION",   icon: "🏖️", label: "Coastal Surge",  desc: "Destructive wave surge & collapse" },
];

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState("subscribe"); // 'subscribe' | 'test' | 'simulate' | 'history'
  const [zones, setZones] = useState(FALLBACK_ZONES);
  const [selectedZone, setSelectedZone] = useState("Z-KERALA-WAYANAD-01");
  const [useLocation, setUseLocation] = useState(false);
  
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
      .then((r) => r.json())
      .then((d) => { if (d.zones?.length) setZones(d.zones); })
      .catch(() => {});

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
      const data = await res.json();
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
      throw new Error("Notification permission was denied. Please allow notifications in browser settings.");
    }
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service workers not supported in this browser.");
    }
    const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    swReg.active?.postMessage({ type: "INIT_CONFIG", config: FIREBASE_CONFIG });

    const { initializeApp, getApps } = await import("firebase/app");
    const { getMessaging, getToken } = await import("firebase/messaging");
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    const msg = getMessaging(app);
    messagingRef.current = msg;
    const token = await getToken(msg, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
    if (!token) throw new Error("Could not obtain FCM token. Check VAPID key configuration.");
    
    setStoredFcmToken(token);
    try { localStorage.setItem("rescue_arc_fcm_token", token); } catch (_) {}
    return token;
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .ar-hub { font-family:'Plus Jakarta Sans',sans-serif; min-height:100vh; background:#070d18; color:#e2e8f0; position:relative; overflow-x:hidden; }
        .ar-glow { position:absolute; inset:0; background:radial-gradient(ellipse 70% 50% at 20% 15%,rgba(220,38,38,0.18) 0%,transparent 60%),radial-gradient(ellipse 60% 45% at 80% 25%,rgba(234,88,12,0.14) 0%,transparent 50%),radial-gradient(ellipse 70% 60% at 50% 90%,rgba(16,185,129,0.12) 0%,transparent 60%); pointer-events:none; }
        .ar-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px); background-size:36px 36px; pointer-events:none; }
        .ar-container { max-width:1120px; margin:0 auto; padding:48px 20px 80px; position:relative; z-index:10; }
        .badge-pulse { display:inline-flex; align-items:center; gap:8px; padding:6px 14px; background:rgba(220,38,38,0.15); border:1px solid rgba(220,38,38,0.35); border-radius:999px; font-size:12px; font-weight:700; color:#fca5a5; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:20px; }
        .pulse-dot { width:8px; height:8px; border-radius:50%; background:#ef4444; animation:pdot 1.2s infinite ease-in-out; }
        @keyframes pdot { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.3; transform:scale(0.8); } }
        .ar-title { font-size:clamp(32px,5vw,56px); font-weight:900; line-height:1.12; letter-spacing:-0.03em; margin:0 0 16px; color:#f8fafc; }
        .ar-title .grad-red { background:linear-gradient(135deg,#ef4444 0%,#f97316 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
        .ar-desc { font-size:16px; color:#94a3b8; max-width:640px; margin:0 auto 36px; line-height:1.6; }
        
        /* Navigation Tabs */
        .tab-bar { display:flex; justify-content:center; gap:10px; margin-bottom:36px; flex-wrap:wrap; }
        .hub-tab { padding:12px 20px; border-radius:14px; font-size:14px; font-weight:700; border:1px solid rgba(255,255,255,0.1); background:rgba(15,23,42,0.7); color:#94a3b8; cursor:pointer; transition:all 200ms ease; display:flex; align-items:center; gap:8px; backdrop-filter:blur(10px); }
        .hub-tab:hover { background:rgba(255,255,255,0.08); color:#f8fafc; border-color:rgba(255,255,255,0.2); }
        .hub-tab.active { background:linear-gradient(135deg,rgba(220,38,38,0.25) 0%,rgba(249,115,22,0.2) 100%); border-color:rgba(239,68,68,0.5); color:#fecaca; box-shadow:0 8px 24px rgba(220,38,38,0.25); }

        /* Card styles */
        .glass-card { background:rgba(15,23,42,0.85); border:1px solid rgba(255,255,255,0.12); border-radius:24px; padding:36px; box-shadow:0 24px 60px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.08); backdrop-filter:blur(24px); }
        .card-header-title { font-size:22px; font-weight:800; color:#f8fafc; margin:0 0 6px; }
        .card-header-desc { font-size:14px; color:#64748b; margin:0 0 24px; }

        /* Form elements */
        .form-label { display:block; font-size:12px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:8px; }
        .select-input, .text-input { width:100%; padding:13px 16px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:12px; color:#f8fafc; font-size:14px; font-family:inherit; outline:none; transition:border-color 200ms; margin-bottom:20px; }
        .select-input:focus, .text-input:focus { border-color:#ef4444; background:rgba(255,255,255,0.09); }
        .select-input option { background:#0f172a; color:#f8fafc; }

        /* Action button */
        .btn-fire { width:100%; padding:15px 24px; border:none; border-radius:14px; font-size:15px; font-weight:800; font-family:inherit; cursor:pointer; background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%); color:#fff; box-shadow:0 10px 28px rgba(220,38,38,0.4); transition:all 200ms ease; display:flex; align-items:center; justify-content:center; gap:10px; }
        .btn-fire:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 14px 34px rgba(220,38,38,0.55); }
        .btn-fire:disabled { opacity:0.55; cursor:not-allowed; transform:none; }

        .btn-secondary { padding:10px 18px; border-radius:10px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:#e2e8f0; font-weight:600; font-size:13px; cursor:pointer; transition:background 150ms; display:inline-flex; align-items:center; gap:6px; }
        .btn-secondary:hover { background:rgba(255,255,255,0.14); }

        /* Hazard grid selector */
        .hazard-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px; margin-bottom:24px; }
        .hazard-opt { padding:14px; border-radius:14px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.03); cursor:pointer; transition:all 180ms ease; text-align:left; }
        .hazard-opt:hover { background:rgba(255,255,255,0.06); border-color:rgba(255,255,255,0.2); }
        .hazard-opt.active { background:rgba(239,68,68,0.15); border-color:#ef4444; }
        .hazard-opt-title { font-size:14px; font-weight:700; color:#f8fafc; margin-bottom:4px; display:flex; align-items:center; gap:8px; }
        .hazard-opt-desc { font-size:11px; color:#94a3b8; line-height:1.4; }

        /* Severity buttons */
        .sev-group { display:flex; gap:10px; margin-bottom:24px; }
        .sev-btn { flex:1; padding:12px; border-radius:12px; border:1px solid; font-weight:800; font-size:13px; cursor:pointer; text-align:center; transition:all 150ms; }
        .sev-btn.red { background:rgba(220,38,38,0.15); border-color:rgba(220,38,38,0.3); color:#fca5a5; }
        .sev-btn.red.active { background:#dc2626; color:#fff; border-color:#ef4444; box-shadow:0 6px 20px rgba(220,38,38,0.4); }
        .sev-btn.yellow { background:rgba(245,158,11,0.15); border-color:rgba(245,158,11,0.3); color:#fde68a; }
        .sev-btn.yellow.active { background:#d97706; color:#fff; border-color:#f59e0b; box-shadow:0 6px 20px rgba(217,119,6,0.4); }

        /* Output / Feedback Box */
        .feedback-box { padding:16px; border-radius:14px; font-size:13px; line-height:1.5; margin-bottom:20px; border:1px solid; }
        .feedback-box.info { background:rgba(59,130,246,0.1); border-color:rgba(59,130,246,0.25); color:#93c5fd; }
        .feedback-box.success { background:rgba(34,197,94,0.1); border-color:rgba(34,197,94,0.25); color:#86efac; }
        .feedback-box.error { background:rgba(239,68,68,0.12); border-color:rgba(239,68,68,0.3); color:#fca5a5; }

        /* Toast Popup */
        .live-toast { position:fixed; top:24px; right:24px; z-index:9999; max-width:440px; width:calc(100% - 48px); padding:20px; background:rgba(15,23,42,0.96); border:2px solid #ef4444; border-radius:18px; box-shadow:0 24px 70px rgba(0,0,0,0.8),0 0 40px rgba(220,38,38,0.3); backdrop-filter:blur(24px); animation:slideIn 350ms cubic-bezier(0.16,1,0.3,1); }
        @keyframes slideIn { from{ transform:translateX(120%); opacity:0; } to{ transform:translateX(0); opacity:1; } }
        .toast-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; }
        .toast-title { font-size:15px; font-weight:800; color:#fca5a5; }
        .toast-close { background:none; border:none; color:#64748b; font-size:18px; cursor:pointer; padding:0 4px; }
        .toast-close:hover { color:#fff; }
        .toast-body { font-size:13px; color:#cbd5e1; line-height:1.5; }

        /* Table */
        .audit-table { width:100%; border-collapse:collapse; text-align:left; font-size:13px; }
        .audit-table th { padding:12px 14px; background:rgba(255,255,255,0.04); color:#94a3b8; font-weight:700; border-bottom:1px solid rgba(255,255,255,0.1); }
        .audit-table td { padding:14px; border-bottom:1px solid rgba(255,255,255,0.06); color:#cbd5e1; }
        .pill-badge { padding:3px 9px; border-radius:99px; font-size:11px; font-weight:800; display:inline-block; }
        .pill-red { background:rgba(220,38,38,0.2); color:#fca5a5; border:1px solid rgba(220,38,38,0.4); }
        .pill-yellow { background:rgba(245,158,11,0.2); color:#fde68a; border:1px solid rgba(245,158,11,0.4); }
      `}</style>

      <div className="ar-hub">
        <div className="ar-glow" />
        <div className="ar-grid" />

        {/* ============================================================== */}
        {/* LIVE ALERT POPUP TOAST (Triggered by real push or manual test)  */}
        {/* ============================================================== */}
        {liveAlert && (
          <div className="live-toast" role="alert">
            <div className="toast-top">
              <div className="toast-title">{liveAlert.title}</div>
              <button className="toast-close" onClick={() => setLiveAlert(null)}>✕</button>
            </div>
            <div className="toast-body">{liveAlert.body}</div>
            <div style={{ marginTop: "10px", fontSize: "11px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
              <span>🚨 Rescue-Arc Multi-Hazard Protocol</span>
              <span>{liveAlert.time}</span>
            </div>
          </div>
        )}

        <div className="ar-container">
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "36px" }}>
            <div className="badge-pulse">
              <span className="pulse-dot" />
              Real-Time Push &amp; Broadcast Engine
            </div>
            <h1 className="ar-title">
              Rescue Arc <span className="grad-red">Alert &amp; Simulation Hub</span>
            </h1>
            <p className="ar-desc">
              Instant hazard detection, FCM web push notifications, and manual disaster testing suite for disaster management teams and citizens.
            </p>

            {/* Navigation Tabs */}
            <div className="tab-bar">
              <button
                className={`hub-tab ${activeTab === "subscribe" ? "active" : ""}`}
                onClick={() => setActiveTab("subscribe")}
              >
                🔔 1. Subscribe Device
              </button>
              <button
                className={`hub-tab ${activeTab === "test" ? "active" : ""}`}
                onClick={() => setActiveTab("test")}
              >
                ⚡ 2. Test My Device
              </button>
              <button
                className={`hub-tab ${activeTab === "simulate" ? "active" : ""}`}
                onClick={() => setActiveTab("simulate")}
              >
                🚨 3. Simulate Red Zone Alert
              </button>
              <button
                className={`hub-tab ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                📜 4. Broadcast History Log
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: SUBSCRIBE DEVICE                                         */}
          {/* ============================================================== */}
          {activeTab === "subscribe" && (
            <div className="glass-card" style={{ maxWidth: "620px", margin: "0 auto" }}>
              <h2 className="card-header-title">Citizen &amp; Official Alert Registration</h2>
              <p className="card-header-desc">
                Subscribe this device to receive immediate push alerts when hazard risk transitions to Yellow or Red in your zone.
              </p>

              <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
                <button
                  type="button"
                  className={`btn-secondary ${!useLocation ? "active" : ""}`}
                  style={{ flex: 1, borderColor: !useLocation ? "#ef4444" : undefined }}
                  onClick={() => setUseLocation(false)}
                >
                  📍 Select Monitored Zone
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${useLocation ? "active" : ""}`}
                  style={{ flex: 1, borderColor: useLocation ? "#ef4444" : undefined }}
                  onClick={() => setUseLocation(true)}
                >
                  🛰️ Use GPS Auto-Detect
                </button>
              </div>

              {!useLocation ? (
                <div>
                  <label className="form-label">Select Your Target Region</label>
                  <select
                    className="select-input"
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
              ) : (
                <div className="feedback-box info">
                  🛰️ When you click Subscribe, your browser will request GPS permission to associate your device with the nearest high-risk zone.
                </div>
              )}

              {phase !== "idle" && (
                <div
                  className={`feedback-box ${
                    phase === "success" ? "success" : phase === "error" ? "error" : "info"
                  }`}
                >
                  {statusMsg}
                </div>
              )}

              <button
                className="btn-fire"
                disabled={phase === "requesting" || phase === "subscribing"}
                onClick={handleSubscribe}
              >
                {phase === "requesting" || phase === "subscribing" ? "Registering Device…" : "🔔 Subscribe to Hazard Alerts"}
              </button>

              {storedFcmToken && (
                <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid rgba(255,255,255,0.08)", fontSize: "12px", color: "#64748b" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Registered Token:</span>
                    <span style={{ color: "#34d399", fontWeight: 700 }}>● Active</span>
                  </div>
                  <div style={{ fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: "4px", color: "#94a3b8" }}>
                    {storedFcmToken.slice(0, 32)}…
                  </div>
                  <button
                    onClick={() => setActiveTab("test")}
                    style={{ marginTop: "10px", background: "none", border: "none", color: "#ef4444", fontWeight: 700, cursor: "pointer", padding: 0 }}
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
            <div className="glass-card" style={{ maxWidth: "680px", margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <h2 className="card-header-title">⚡ Instant Device Notification Test</h2>
                <span className="pill-badge pill-red">Manual Test Mode</span>
              </div>
              <p className="card-header-desc">
                Send an immediate test push notification to this browser to verify that the Firebase Cloud Messaging pipeline is fully operational.
              </p>

              <label className="form-label">1. Choose Hazard Scenario</label>
              <div className="hazard-grid">
                {HAZARD_OPTIONS.map((h) => (
                  <div
                    key={h.id}
                    className={`hazard-opt ${testHazard === h.id ? "active" : ""}`}
                    onClick={() => setTestHazard(h.id)}
                  >
                    <div className="hazard-opt-title">
                      <span>{h.icon}</span>
                      <span>{h.label}</span>
                    </div>
                    <div className="hazard-opt-desc">{h.desc}</div>
                  </div>
                ))}
              </div>

              <label className="form-label">2. Select Severity Level</label>
              <div className="sev-group">
                <button
                  type="button"
                  className={`sev-btn red ${testColor === "RED" ? "active" : ""}`}
                  onClick={() => setTestColor("RED")}
                >
                  🚨 Emergency RED (Evacuate)
                </button>
                <button
                  type="button"
                  className={`sev-btn yellow ${testColor === "YELLOW" ? "active" : ""}`}
                  onClick={() => setTestColor("YELLOW")}
                >
                  ⚠️ Warning YELLOW (Alert)
                </button>
              </div>

              <label className="form-label">3. Target Region for Test</label>
              <select
                className="select-input"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                {zones.map((z) => (
                  <option key={z.zone_id} value={z.zone_id}>
                    {z.name || z.zone_id}
                  </option>
                ))}
              </select>

              {testStatus.msg && (
                <div className={`feedback-box ${testStatus.state}`}>
                  <div style={{ fontWeight: 700 }}>{testStatus.msg}</div>
                  {testStatus.details && (
                    <div style={{ marginTop: "8px", fontSize: "11px", opacity: 0.9 }}>
                      {testStatus.details.message_id && <div>Message ID: <code>{testStatus.details.message_id}</code></div>}
                      {testStatus.details.title && <div>Title: <code>{testStatus.details.title}</code></div>}
                      {testStatus.details.backend && <div>Backend: <code>{testStatus.details.backend}</code></div>}
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn-fire"
                disabled={testStatus.state === "sending"}
                onClick={handleManualTestPush}
              >
                {testStatus.state === "sending" ? "Dispatching Alert…" : "⚡ Send Instant Test Push Notification"}
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: SIMULATE RED ZONE EMERGENCY BROADCAST                     */}
          {/* ============================================================== */}
          {activeTab === "simulate" && (
            <div className="glass-card" style={{ maxWidth: "720px", margin: "0 auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <h2 className="card-header-title">🚨 Full Zone Disaster Simulation</h2>
                <span className="pill-badge pill-red">Authority Broadcast</span>
              </div>
              <p className="card-header-desc">
                Simulate an automated or manual hazard escalation for an entire region. This inserts a transition classification into Supabase and broadcasts to all active registered subscribers.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="form-label">Target Monitored Zone</label>
                  <select
                    className="select-input"
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
                  <label className="form-label">Primary Hazard Type</label>
                  <select
                    className="select-input"
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

              <label className="form-label">Transition State</label>
              <div className="sev-group">
                <button
                  type="button"
                  className={`sev-btn red ${simColor === "RED" ? "active" : ""}`}
                  onClick={() => setSimColor("RED")}
                >
                  🚨 Escalate to RED (Immediate Evacuation)
                </button>
                <button
                  type="button"
                  className={`sev-btn yellow ${simColor === "YELLOW" ? "active" : ""}`}
                  onClick={() => setSimColor("YELLOW")}
                >
                  ⚠️ Escalate to YELLOW (Hazard Warning)
                </button>
              </div>

              {simResult && (
                <div className={`feedback-box ${simResult.error ? "error" : "success"}`}>
                  {simResult.error ? (
                    <div>Error: {simResult.error}</div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 800, marginBottom: "6px" }}>
                        ✅ Zone Escalated: {simResult.prev_color || "GREEN"} → {simResult.new_color}
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginTop: "10px", fontSize: "12px" }}>
                        <div>Targeted Devices: <strong>{simResult.targeted ?? 1}</strong></div>
                        <div>Delivered Push: <strong>{simResult.delivered ?? 1}</strong></div>
                        <div>Severity: <strong>{simResult.severity_fired ?? "alert"}</strong></div>
                      </div>
                      {simResult.classification_id && (
                        <div style={{ fontSize: "11px", marginTop: "6px", opacity: 0.8 }}>
                          Audit Classification ID: <code>{simResult.classification_id}</code>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn-fire"
                disabled={isSimulating}
                onClick={handleSimulateDisaster}
              >
                {isSimulating ? "Broadcasting Emergency Escalation…" : "🚨 Trigger Disaster Emergency Broadcast"}
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: AUDIT HISTORY LOG                                       */}
          {/* ============================================================== */}
          {activeTab === "history" && (
            <div className="glass-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <div>
                  <h2 className="card-header-title">📜 Alert Broadcast Audit Log</h2>
                  <p className="card-header-desc" style={{ marginBottom: 0 }}>
                    Live records of all push notifications dispatched by the Rescue Arc alert service.
                  </p>
                </div>
                <button className="btn-secondary" onClick={fetchHistory} disabled={isLoadingHistory}>
                  🔄 Refresh
                </button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className="audit-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Zone ID</th>
                      <th>Severity</th>
                      <th>Color Transition</th>
                      <th>Targeted</th>
                      <th>Delivered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                          {isLoadingHistory ? "Loading audit logs…" : "No alert logs found yet."}
                        </td>
                      </tr>
                    ) : (
                      historyLogs.map((log) => (
                        <tr key={log.id}>
                          <td>{new Date(log.sent_at).toLocaleString()}</td>
                          <td style={{ fontWeight: 600 }}>{log.zone_id}</td>
                          <td>
                            <span className={`pill-badge ${log.severity === "alert" ? "pill-red" : "pill-yellow"}`}>
                              {log.severity?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            {log.from_color || "—"} → <strong>{log.to_color}</strong>
                          </td>
                          <td>{log.recipients_targeted ?? 0}</td>
                          <td style={{ color: "#34d399", fontWeight: 700 }}>
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

          {/* Direct admin links footer */}
          <div style={{ marginTop: "40px", textAlign: "center", fontSize: "13px", color: "#64748b", display: "flex", justifyContent: "center", gap: "24px" }}>
            <Link href="/dashboard/admin" style={{ color: "#94a3b8", textDecoration: "underline" }}>
              Admin Dashboard &amp; Capacities
            </Link>
            <span>•</span>
            <Link href="/admin/relocation-sites" style={{ color: "#94a3b8", textDecoration: "underline" }}>
              Relocation Sites Capacity Manager
            </Link>
            <span>•</span>
            <a href="http://localhost:8000/admin" target="_blank" rel="noreferrer" style={{ color: "#ef4444", textDecoration: "underline" }}>
              Python Alert Admin Console (Port 8000) ↗
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
