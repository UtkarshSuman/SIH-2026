"use client";

import { useEffect, useRef, useState } from "react";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCj5i1D_G6wg4g149CUhVf899IX5mifJ00",
  authDomain: "rescue-arc-9b293.firebaseapp.com",
  projectId: "rescue-arc-9b293",
  storageBucket: "rescue-arc-9b293.firebasestorage.app",
  messagingSenderId: "420144730893",
  appId: "1:420144730893:web:d972e7ddc4f45827141644",
};

const VAPID_KEY =
  "BNoRuvQsMJEOrzlmkOlhz75NS_ms9Sk-9L5MwXY0vyHWanoz7qIe4q2kwaHEfpraVqV6Kb2Z1fUzLKZWxINGNVE";

const FALLBACK_ZONES = [
  { zone_id: "Z-UTTARAKHAND-JOSHIMATH-01", name: "Joshimath, Uttarakhand" },
  { zone_id: "Z-KERALA-WAYANAD-01",        name: "Wayanad, Kerala" },
  { zone_id: "Z-KERALA-IDUKKI-01",         name: "Idukki, Kerala" },
  { zone_id: "Z-TAMILNADU-NILGIRIS-01",    name: "Nilgiris, Tamil Nadu" },
  { zone_id: "Z-WESTBENGAL-DARJEELING-01", name: "Darjeeling, West Bengal" },
  { zone_id: "Z-ASSAM-DHEMAJI-01",         name: "Dhemaji-Lakhimpur, Assam" },
  { zone_id: "Z-ODISHA-PURI-01",           name: "Puri, Odisha" },
  { zone_id: "Z-GUJARAT-KUTCH-01",         name: "Kutch, Gujarat" },
  { zone_id: "Z-BIHAR-PATNA-01",           name: "Patna, Bihar" },
  { zone_id: "Z-ASSAM-GUWAHATI-01",        name: "Guwahati, Assam" },
];

const HAZARD_CARDS = [
  { icon: "🌊", label: "Flood Alerts",     color: "#3b82f6", bg: "rgba(59,130,246,0.08)",  border: "rgba(59,130,246,0.25)",  desc: "Flash-flood & river-discharge warnings with real-time sensor data." },
  { icon: "⛰️", label: "Landslide Risk",   color: "#f59e0b", bg: "rgba(245,158,11,0.08)",  border: "rgba(245,158,11,0.25)",  desc: "Slope-stability & soil-saturation alerts for mountain habitations." },
  { icon: "⛈️", label: "Cloudburst",        color: "#8b5cf6", bg: "rgba(139,92,246,0.08)",  border: "rgba(139,92,246,0.25)",  desc: "Intense localised rainfall events that trigger flash-floods & mudslides." },
  { icon: "🏖️", label: "Coastal Erosion",  color: "#14b8a6", bg: "rgba(20,184,166,0.08)",  border: "rgba(20,184,166,0.25)", desc: "Wave-energy surge & shoreline-collapse alerts for coastal communities." },
];

const STEPS = [
  { num: "01", title: "Choose Your Zone",       desc: "Pick the monitored region near you from our GIS-verified zone registry." },
  { num: "02", title: "Allow Notifications",    desc: "Grant browser push permission — takes one click and can be revoked anytime." },
  { num: "03", title: "Stay Informed",          desc: "Receive instant alerts when risk transitions from Green to Yellow or Red." },
];

export default function AlertsPage() {
  const [zones, setZones] = useState(FALLBACK_ZONES);
  const [selectedZone, setSelectedZone] = useState("");
  const [useLocation, setUseLocation] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [subscribedZone, setSubscribedZone] = useState("");
  const [liveAlert, setLiveAlert] = useState(null);
  const messagingRef = useRef(null);

  useEffect(() => {
    fetch("/api/alerts/zones")
      .then((r) => r.json())
      .then((d) => { if (d.zones?.length) setZones(d.zones); })
      .catch(() => {});
  }, []);

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
          setLiveAlert({ title: payload.notification?.title ?? "Rescue-Arc Alert", body: payload.notification?.body ?? "" });
          setTimeout(() => setLiveAlert(null), 8000);
        });
      } catch (_) {}
    })();
    return () => unsub?.();
  }, []);

  async function handleSubscribe() {
    if (!selectedZone && !useLocation) {
      setPhase("error"); setStatusMsg("Please select a zone or enable location detection."); return;
    }
    setPhase("requesting"); setStatusMsg("Requesting notification permission…");
    if (!("Notification" in window)) { setPhase("error"); setStatusMsg("Your browser does not support push notifications."); return; }
    let permission;
    try { permission = await Notification.requestPermission(); }
    catch { setPhase("error"); setStatusMsg("Could not request notification permission."); return; }
    if (permission !== "granted") { setPhase("error"); setStatusMsg("Notification permission denied. Enable it in browser settings and try again."); return; }
    setPhase("subscribing"); setStatusMsg("Registering device with Rescue-Arc…");
    let fcmToken;
    try {
      if (!("serviceWorker" in navigator)) throw new Error("Service workers not supported.");
      const swReg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
      swReg.active?.postMessage({ type: "INIT_CONFIG", config: FIREBASE_CONFIG });
      const { initializeApp, getApps } = await import("firebase/app");
      const { getMessaging, getToken } = await import("firebase/messaging");
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
      const msg = getMessaging(app);
      messagingRef.current = msg;
      const token = await getToken(msg, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
      if (!token) throw new Error("Empty FCM token — check VAPID key.");
      fcmToken = token;
    } catch (err) { setPhase("error"); setStatusMsg("FCM setup failed: " + err.message); return; }
    try {
      let lat = 20.5937, lon = 78.9629;
      if (useLocation) {
        setStatusMsg("Getting your location…");
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
        );
        lat = pos.coords.latitude; lon = pos.coords.longitude;
      }
      const body = { fcm_token: fcmToken, lat, lon };
      if (selectedZone) body.zone_id = selectedZone;
      const res = await fetch("/api/alerts/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error ?? "Server returned " + res.status); }
      const data = await res.json();
      const zoneName = zones.find((z) => z.zone_id === (data.zone_id ?? selectedZone))?.name ?? data.zone_id ?? "your region";
      setSubscribedZone(zoneName); setPhase("success"); setStatusMsg("Subscribed to " + zoneName);
    } catch (err) { setPhase("error"); setStatusMsg(err.message ?? "Subscription failed."); }
  }

  const isLoading = phase === "requesting" || phase === "subscribing";

  return (
    <>
      <style>{`
         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .ar { font-family:'Inter',sans-serif; min-height:100vh; background:#050b14; color:#e2e8f0; overflow-x:hidden; }
        .hbg { position:absolute; inset:0; background:radial-gradient(ellipse 80% 60% at 20% 20%,rgba(220,38,38,.18) 0%,transparent 60%),radial-gradient(ellipse 60% 50% at 80% 10%,rgba(245,158,11,.12) 0%,transparent 50%),radial-gradient(ellipse 70% 80% at 50% 100%,rgba(59,130,246,.10) 0%,transparent 60%); animation:bd 12s ease-in-out infinite alternate; }
        @keyframes bd{0%{opacity:1;transform:scale(1)}100%{opacity:.85;transform:scale(1.04)}}
        .hgrid { position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px); background-size:40px 40px; }
        .hero { position:relative; padding:120px 24px 80px; text-align:center; overflow:hidden; }
        .hbadge { display:inline-flex; align-items:center; gap:8px; padding:6px 16px; background:rgba(220,38,38,.15); border:1px solid rgba(220,38,38,.35); border-radius:999px; font-size:12px; font-weight:600; color:#fca5a5; letter-spacing:.06em; text-transform:uppercase; margin-bottom:28px; animation:pb 2.5s ease-in-out infinite; }
        @keyframes pb{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.4)}50%{box-shadow:0 0 0 8px rgba(220,38,38,0)}}
        .bdot { width:7px; height:7px; border-radius:50%; background:#ef4444; animation:blk 1.2s ease-in-out infinite; }
        @keyframes blk{0%,100%{opacity:1}50%{opacity:.2}}
        .htitle { font-size:clamp(36px,6vw,72px); font-weight:900; line-height:1.08; letter-spacing:-.03em; margin:0 0 20px; background:linear-gradient(135deg,#f8fafc 0%,#94a3b8 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .htitle .ac { background:linear-gradient(90deg,#ef4444 0%,#f97316 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .hsub { font-size:18px; color:#94a3b8; max-width:560px; margin:0 auto 48px; line-height:1.7; }
        .cwrap { max-width:520px; margin:0 auto; position:relative; z-index:10; }
        .scard { background:rgba(15,23,42,.85); border:1px solid rgba(255,255,255,.1); border-radius:24px; padding:36px; box-shadow:0 0 0 1px rgba(255,255,255,.05),0 32px 80px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.08); backdrop-filter:blur(20px); }
        .ct { font-size:22px; font-weight:800; color:#f1f5f9; margin:0 0 6px; }
        .cs { font-size:14px; color:#64748b; margin:0 0 28px; }
        .tabg { display:flex; gap:8px; margin-bottom:22px; background:rgba(255,255,255,.04); border-radius:12px; padding:4px; }
        .tabb { flex:1; padding:9px 0; border:none; border-radius:9px; font-size:13px; font-weight:600; cursor:pointer; transition:background 200ms,color 200ms; background:transparent; color:#64748b; }
        .tabb.act { background:rgba(239,68,68,.2); color:#fca5a5; border:1px solid rgba(239,68,68,.3); }
        .flbl { font-size:12px; font-weight:600; color:#64748b; letter-spacing:.06em; text-transform:uppercase; margin-bottom:8px; }
        .zsel { width:100%; padding:12px 16px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); border-radius:12px; color:#e2e8f0; font-size:14px; font-family:'Inter',sans-serif; margin-bottom:20px; appearance:none; cursor:pointer; outline:none; transition:border-color 200ms; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; }
        .zsel:focus { border-color:rgba(239,68,68,.5); }
        .zsel option { background:#0f172a; color:#e2e8f0; }
        .lhint { display:flex; align-items:center; gap:10px; padding:12px 14px; background:rgba(59,130,246,.08); border:1px solid rgba(59,130,246,.2); border-radius:12px; font-size:13px; color:#93c5fd; margin-bottom:20px; }
        .sbox { display:flex; align-items:flex-start; gap:12px; padding:14px; border-radius:12px; font-size:13px; line-height:1.5; margin-bottom:20px; border:1px solid; }
        .sbox.inf { background:rgba(59,130,246,.08); border-color:rgba(59,130,246,.2); color:#93c5fd; }
        .sbox.ok  { background:rgba(34,197,94,.08);  border-color:rgba(34,197,94,.2);  color:#86efac; }
        .sbox.err { background:rgba(239,68,68,.08);  border-color:rgba(239,68,68,.2);  color:#fca5a5; }
        .sbtn { width:100%; padding:15px 24px; border:none; border-radius:14px; font-size:15px; font-weight:700; font-family:'Inter',sans-serif; cursor:pointer; background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%); color:#fff; box-shadow:0 8px 24px rgba(220,38,38,.35); transition:transform 200ms,box-shadow 200ms,opacity 200ms; position:relative; overflow:hidden; }
        .sbtn::before { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.12) 0%,transparent 60%); border-radius:14px; }
        .sbtn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 32px rgba(220,38,38,.45); }
        .sbtn:disabled { opacity:.55; cursor:not-allowed; transform:none; }
        .sring { width:72px; height:72px; border-radius:50%; background:rgba(34,197,94,.12); border:2px solid rgba(34,197,94,.4); display:flex; align-items:center; justify-content:center; margin:0 auto 20px; font-size:32px; animation:pi 400ms cubic-bezier(.34,1.56,.64,1); }
        @keyframes pi{from{transform:scale(.4);opacity:0}to{transform:scale(1);opacity:1}}
        .stit { font-size:20px; font-weight:800; color:#86efac; margin-bottom:6px; text-align:center; }
        .sbod { font-size:14px; color:#64748b; text-align:center; line-height:1.6; }
        .rlink { display:inline-block; margin-top:18px; font-size:13px; color:#64748b; text-decoration:underline; cursor:pointer; background:none; border:none; font-family:'Inter',sans-serif; }
        .toast { position:fixed; top:24px; right:24px; z-index:9999; max-width:380px; padding:16px 20px; background:rgba(15,23,42,.95); border:1px solid rgba(239,68,68,.45); border-left:4px solid #ef4444; border-radius:14px; box-shadow:0 20px 50px rgba(0,0,0,.6); backdrop-filter:blur(16px); animation:si 400ms cubic-bezier(.34,1.56,.64,1); }
        @keyframes si{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}
        .ttit { font-size:14px; font-weight:700; color:#fca5a5; margin-bottom:4px; }
        .tbod { font-size:13px; color:#94a3b8; line-height:1.5; }
        .sec { padding:80px 24px; max-width:1100px; margin:0 auto; }
        .slbl { font-size:12px; font-weight:700; color:#ef4444; letter-spacing:.1em; text-transform:uppercase; margin-bottom:12px; }
        .stitle { font-size:clamp(28px,4vw,42px); font-weight:800; color:#f1f5f9; letter-spacing:-.02em; margin:0 0 16px; }
        .sbody { font-size:16px; color:#64748b; max-width:520px; line-height:1.7; margin-bottom:48px; }
        .hgrid2 { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:20px; }
        .hcard { padding:24px; border-radius:18px; border:1px solid; transition:transform 240ms,box-shadow 240ms; }
        .hcard:hover { transform:translateY(-4px); box-shadow:0 20px 40px rgba(0,0,0,.3); }
        .hico { font-size:32px; margin-bottom:14px; }
        .hlbl { font-size:15px; font-weight:700; margin-bottom:8px; }
        .hdsc { font-size:13px; color:#64748b; line-height:1.6; }
        .ssec { padding:0 24px 80px; max-width:1100px; margin:0 auto; }
        .sgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:24px; margin-top:48px; }
        .stepcard { background:rgba(255,255,255,.03); border:1px solid rgba(255,255,255,.07); border-radius:18px; padding:28px; position:relative; overflow:hidden; }
        .stepcard::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,#ef4444,#f97316); }
        .snum { font-size:48px; font-weight:900; color:rgba(239,68,68,.15); line-height:1; margin-bottom:16px; letter-spacing:-.04em; }
        .stitl { font-size:17px; font-weight:700; color:#f1f5f9; margin-bottom:8px; }
        .sdsc { font-size:14px; color:#64748b; line-height:1.65; }
        .fcta { padding:80px 24px; text-align:center; background:rgba(239,68,68,.04); border-top:1px solid rgba(239,68,68,.1); }
        .fcta h2 { font-size:32px; font-weight:800; color:#f1f5f9; margin-bottom:12px; }
        .fcta p { font-size:16px; color:#64748b; margin-bottom:32px; }
        .ctabtn { display:inline-block; padding:14px 36px; background:linear-gradient(135deg,#dc2626,#b91c1c); color:#fff; font-size:15px; font-weight:700; border-radius:12px; border:none; cursor:pointer; font-family:'Inter',sans-serif; box-shadow:0 8px 24px rgba(220,38,38,.35); text-decoration:none; transition:transform 200ms,box-shadow 200ms; }
        .ctabtn:hover { transform:translateY(-2px); box-shadow:0 14px 32px rgba(220,38,38,.5); }
        .spin { display:inline-block; width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:sp 700ms linear infinite; vertical-align:middle; margin-right:8px; }
        @keyframes sp{to{transform:rotate(360deg)}}
        @media(max-width:640px){.hero{padding:80px 20px 60px}.scard{padding:24px;border-radius:18px}.toast{left:16px;right:16px;top:16px}}
      `}</style>

      <div className="ar">
        {liveAlert && (
          <div className="toast" role="alert">
            <div className="ttit">🚨 {liveAlert.title}</div>
            <div className="tbod">{liveAlert.body}</div>
          </div>
        )}

        <section className="hero">
          <div className="hbg" />
          <div className="hgrid" />
          <div className="hbadge"><span className="bdot" /> Live GIS Monitoring Active</div>
          <h1 className="htitle">Stay Safe With<br /><span className="ac">Real-Time Hazard Alerts</span></h1>
          <p className="hsub">Subscribe to instant push notifications when your region is flagged as a Red or Yellow hazard zone by our satellite &amp; sensor-driven AI pipeline.</p>

          <div className="cwrap">
            <div className="scard">
              {phase === "success" ? (
                <div>
                  <div className="sring">✓</div>
                  <div className="stit">You're Subscribed!</div>
                  <div className="sbod">You will receive push notifications whenever <strong style={{color:"#86efac"}}>{subscribedZone}</strong> is flagged as a hazard zone. Stay safe.</div>
                  <div style={{textAlign:"center"}}>
                    <button className="rlink" onClick={() => { setPhase("idle"); setSelectedZone(""); }}>Subscribe to another zone</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="ct">Get Hazard Alerts</div>
                  <div className="cs">Choose how to identify your monitored zone.</div>
                   <div className="tabg" role="tablist">
  <button
    role="tab"
    id="tab-select"
    aria-selected={!useLocation}
    className={`tabb ${!useLocation ? "act" : ""}`}
    onClick={() => setUseLocation(false)}
  >
    🗺️ Select Zone
  </button>

  <button
    role="tab"
    id="tab-location"
    aria-selected={useLocation}
    className={`tabb ${useLocation ? "act" : ""}`}
    onClick={() => setUseLocation(true)}
  >
    📍 Use My Location
  </button>
</div>
                  {!useLocation ? (
                    <>
                      <div className="flbl">Select Monitored Zone</div>
                      <select id="zone-selector" className="zsel" value={selectedZone} onChange={(e) => setSelectedZone(e.target.value)} aria-label="Select a monitored hazard zone">
                        <option value="">— Choose a zone —</option>
                        {zones.map((z) => (<option key={z.zone_id} value={z.zone_id}>{z.name}</option>))}
                      </select>
                    </>
                  ) : (
                    <div className="lhint"><span style={{fontSize:20}}>📍</span><span>Your GPS location will be used to automatically match you to the nearest monitored zone.</span></div>
                  )}
                  {phase !== "idle" && (
                    <div className={`sbox ${
  phase === "error"
    ? "err"
    : phase === "success"
    ? "ok"
    : "inf"
}`}role="status">
                      {isLoading && <span className="spin" aria-hidden />}
                      <span>{statusMsg}</span>
                    </div>
                  )}
                  <button id="subscribe-btn" className="sbtn" disabled={isLoading || (!selectedZone && !useLocation)} onClick={handleSubscribe}>
                    {isLoading ? (<><span className="spin" aria-hidden />{statusMsg || "Processing…"}</>) : "🔔 Subscribe to Alerts"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="sec">
          <div className="slbl">Alert Coverage</div>
          <h2 className="stitle">What You'll Be Notified About</h2>
          <p className="sbody">Our ML pipeline monitors four distinct natural hazard types using real-time sensor data, satellite imagery, and GIS analysis.</p>
          <div className="hgrid2">
            {HAZARD_CARDS.map((h) => (
              <div key={h.label} className="hcard" style={{background:h.bg,borderColor:h.border}}>
                <div className="hico">{h.icon}</div>
                <div className="hlbl" style={{color:h.color}}>{h.label}</div>
                <div className="hdsc">{h.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="ssec">
          <div className="slbl">How It Works</div>
          <h2 className="stitle">Three Steps to Safety</h2>
          <div className="sgrid">
            {STEPS.map((s) => (
              <div className="stepcard" key={s.num}>
                <div className="snum">{s.num}</div>
                <div className="stitl">{s.title}</div>
                <div className="sdsc">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="fcta">
          <h2>Don't Wait for Disaster</h2>
          <p>Thousands of people in high-risk zones have no early warning. Be the first to know — and the first to act.</p>
          <button className="ctabtn" onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>Subscribe Now — It's Free</button>
        </section>
      </div>
    </>
  );
}
