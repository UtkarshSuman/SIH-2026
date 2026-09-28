"use client";

import { useState } from "react";
import {
  Globe,
  Layers,
  Cpu,
  Bell,
  Navigation,
  Database,
  ServerCrash,
  ArrowRight,
  CheckCircle2,
  Radio,
  Zap,
  Shield,
  Activity,
  Smartphone,
  Mail,
  MapPin,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

const workflowNodes = [
  {
    id: "ingestion",
    step: "01",
    label: "Live Data Ingestion",
    sublabel: "9+ Authoritative Public APIs",
    icon: Globe,
    color: "emerald",
    status: "Streaming 24/7",
    summary:
      "Automated concurrent fetching from meteorological, hydrological, and satellite observation APIs across zone bounding boxes.",
    details: {
      inputs: [
        "Open-Meteo Weather (Rain 24h/72h, Temp, Humidity)",
        "NASA POWER Agroclimatology (Soil Wetness Fractions)",
        "Open-Meteo GloFAS Flood API (River Discharge m³/s)",
        "Open-Meteo Marine API (Wave Height & Period)",
        "OpenStreetMap Overpass API (Coastline, Amenities)",
        "Agromonitoring Sentinel-2 NDVI (Vegetation Index)",
        "USGS FDSN API (Earthquakes Magnitude ≥2.5)",
        "Google Earth Engine / ISRIC (Soil Texture Classes)",
      ],
      processing: "Concurrent async requests with exponential backoff & rate-limiting queue.",
      output: "Raw heterogeneous JSON payloads aligned to local zone bounding boxes.",
      resilience: "Tiered on-disk cache (Dynamic: 3h; Static soil/elevation: 90 days).",
    },
  },
  {
    id: "normalization",
    step: "02",
    label: "GIS Normalization",
    sublabel: "ETL & Geospatial Feature Building",
    icon: Layers,
    color: "teal",
    status: "Standardized Units",
    summary:
      "Cleans, validates, and aligns raw telemetry into standard physical parameters and GeoJSON feature collections.",
    details: {
      inputs: ["Raw API responses", "Zone bounding boxes (BBox)", "Cached OSM administrative boundaries"],
      processing:
        "Unit conversions (mm/hr, m³/s, degree slopes, 0-100% moisture), spatial distance-to-river/coast calculations, and outlier cleaning.",
      output: "Normalized FeatureCollection with 14 hazard-specific physical input dimensions.",
      resilience: "Deterministic fallback imputation for missing or delayed sensor readings.",
    },
  },
  {
    id: "ml_inference",
    step: "03",
    label: "Dual ML Inference",
    sublabel: "RandomForest & GradientBoosting",
    icon: Cpu,
    color: "blue",
    status: "Instant Inference",
    summary:
      "Trained ML models score multi-hazard vulnerability and predict risk color tiers for each zone.",
    details: {
      inputs: [
        "Normalized physical metrics (Rainfall, Slope, Wetness, Discharge, Soil)",
        "Historical disaster recurrence frequencies (UN ReliefWeb)",
        "Population density and terrain load factors",
      ],
      processing:
        "Dual-model ensemble inference evaluating Flood, Landslide, Coastal Erosion, and Cloudburst severity indices.",
      output: "Predicted Hazard Score (0.00 – 1.00), Zone Color (GREEN, YELLOW, RED), and Urgency Priority.",
      resilience: "Rule-based heuristic classifier fallback if ML service is unreachable.",
    },
  },
  {
    id: "alert_system",
    step: "04A",
    label: "Alert System Trigger",
    sublabel: "State-Shift Broadcast Engine",
    icon: Bell,
    color: "amber",
    status: "G➔Y & Y➔R Triggers",
    summary:
      "Detects color transitions (Green to Yellow or Yellow to Red) and dispatches instant push, SMS, and email alerts.",
    details: {
      inputs: ["Real-time classification changes from ML engine", "Registered subscriber phone numbers & FCM device tokens"],
      processing:
        "Classification bridge compares previous vs. current zone color; triggers multi-channel broadcast on escalation.",
      output: "Firebase Cloud Messaging (FCM) web/mobile push notifications, Fast2SMS mobile alerts, and Brevo emergency emails.",
      resilience: "Dead-letter retry queue for failed SMS / FCM tokens automatically flagged inactive.",
    },
  },
  {
    id: "relocation_engine",
    step: "04B",
    label: "Relocation & Capacity",
    sublabel: "Terrain Carrying Capacity & Safe Routes",
    icon: Navigation,
    color: "indigo",
    status: "Turn-by-Turn Safe Paths",
    summary:
      "Computes shelter carrying capacity and pairs vulnerable red/yellow zone populations to the nearest safe relief centers.",
    details: {
      inputs: [
        "Identified RED and YELLOW hazard zones",
        "Habitation population counts",
        "Designated relief shelter capacities and environmental carrying limits",
      ],
      processing:
        "Carrying capacity load-balancing algorithm + OSRM road routing engine calculating safe driving corridors.",
      output: "Target shelter pairings, excess population transfer allocations, and turn-by-turn road polyline coordinates.",
      resilience: "Pre-computed static safe routes cached locally for all registered district shelters.",
    },
  },
  {
    id: "database_sync",
    step: "05",
    label: "Supabase DB & Map Sync",
    sublabel: "Real-time Telemetry & Map Overlays",
    icon: Database,
    color: "emerald",
    status: "HTTPS Port 443",
    summary:
      "Synchronizes the latest hazard classifications, site occupancies, and evacuation paths to the live interactive map.",
    details: {
      inputs: ["Latest ML prediction rows", "Relocation plan allocations", "Telemetry sensor metrics"],
      processing:
        "Supabase PostgREST transactions writing to `zones`, `zone_classifications`, `relocation_sites`, and `alert_log`.",
      output: "Live Next.js Map rendering color-coded polygons, shelter pins, and real-time popups.",
      resilience: "Direct HTTPS/443 REST API bypasses blocked PostgreSQL ports (5432/6543).",
    },
  },
  {
    id: "offline_fallback",
    step: "06",
    label: "Zero-Downtime Cache",
    sublabel: "Client-Side Disaster Resilience",
    icon: ServerCrash,
    color: "purple",
    status: "Zero-Downtime Guarantee",
    summary:
      "When cellular networks or remote databases fail during a disaster, the system automatically runs on cached local snapshots.",
    details: {
      inputs: ["Cached GeoJSON boundaries", "Latest verified telemetry snapshot", "Pre-computed relocation sites"],
      processing:
        "Client `data-service.ts` health-check detects network timeout; seamlessly transitions to `central-fallback-store.ts`.",
      output: "Full interactive map navigation, risk inspection, and relocation routes without active server connection.",
      resilience: "Guaranteed offline usability for on-ground first responders in remote disaster zones.",
    },
  },
];

export default function WorkflowDiagram() {
  const [activeNodeId, setActiveNodeId] = useState("ingestion");
  const activeNode = workflowNodes.find((n) => n.id === activeNodeId) || workflowNodes[0];
  const IconComponent = activeNode.icon;

  return (
    <div className="w-full space-y-8">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP CONTROLS & WORKFLOW STATUS HEADER
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
            <Radio size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="text-sm font-bold text-slate-900">
                Rescue Arc Automated Dataflow Pipeline
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Interactive end-to-end architecture • Click any stage to inspect inputs, models & failover
            </p>
          </div>
        </div>

        {/* Quick Stepper Indicator */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {workflowNodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => setActiveNodeId(node.id)}
              className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeNodeId === node.id
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span className="font-mono text-[10px] opacity-80">{node.step}</span>
              <span className="hidden md:inline">{node.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. VISUAL WORKFLOW CANVAS (SCHEMATIC DIAGRAM)
      ───────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-6 sm:p-8 lg:p-10 text-white shadow-xl">
        {/* Subtle Background Grid & Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl"
        />

        {/* DIAGRAM FLOW GRID */}
        <div className="relative z-10 grid gap-4 lg:grid-cols-6 lg:gap-3">
          {/* STAGE 1: INGESTION */}
          <div
            onClick={() => setActiveNodeId("ingestion")}
            className={`group relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all cursor-pointer ${
              activeNodeId === "ingestion"
                ? "border-emerald-400 bg-emerald-950/70 shadow-lg shadow-emerald-500/10 scale-[1.02]"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-emerald-400">STAGE 01</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Globe size={18} />
              </div>
              <h4 className="mt-3 font-bold text-xs text-white">Live Ingestion</h4>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                9+ APIs: Weather, GloFAS, NASA, NDVI, USGS
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-300 font-mono">
              <span>9 Streams</span>
              <ArrowRight size={12} className="opacity-60" />
            </div>
          </div>

          {/* STAGE 2: NORMALIZATION */}
          <div
            onClick={() => setActiveNodeId("normalization")}
            className={`group relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all cursor-pointer ${
              activeNodeId === "normalization"
                ? "border-teal-400 bg-teal-950/70 shadow-lg shadow-teal-500/10 scale-[1.02]"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-teal-400">STAGE 02</span>
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              </div>
              <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Layers size={18} />
              </div>
              <h4 className="mt-3 font-bold text-xs text-white">GIS Normalization</h4>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                BBox clipping, standard units (mm/hr, m³/s)
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-teal-300 font-mono">
              <span>Feature ETL</span>
              <ArrowRight size={12} className="opacity-60" />
            </div>
          </div>

          {/* STAGE 3: ML INFERENCE */}
          <div
            onClick={() => setActiveNodeId("ml_inference")}
            className={`group relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all cursor-pointer ${
              activeNodeId === "ml_inference"
                ? "border-blue-400 bg-blue-950/70 shadow-lg shadow-blue-500/10 scale-[1.02]"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-blue-400">STAGE 03</span>
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              </div>
              <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Cpu size={18} />
              </div>
              <h4 className="mt-3 font-bold text-xs text-white">Dual ML Engine</h4>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                RandomForest & GradientBoosting (0.00 – 1.00)
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-blue-300 font-mono">
              <span>Risk Scoring</span>
              <ArrowRight size={12} className="opacity-60" />
            </div>
          </div>

          {/* STAGE 4: PARALLEL DISPATCH (ALERT + RELOCATION) */}
          <div className="flex flex-col gap-2.5">
            {/* 4A: ALERT TRIGGER */}
            <div
              onClick={() => setActiveNodeId("alert_system")}
              className={`group flex-1 flex flex-col justify-between rounded-xl border p-3 transition-all cursor-pointer ${
                activeNodeId === "alert_system"
                  ? "border-amber-400 bg-amber-950/70 shadow-md shadow-amber-500/10 scale-[1.02]"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold text-amber-400">STAGE 04A</span>
                  <Bell size={13} className="text-amber-400" />
                </div>
                <h5 className="mt-1 font-bold text-[11px] text-white">Alert System</h5>
                <p className="text-[10px] text-slate-400">G➔Y & Y➔R FCM / SMS</p>
              </div>
            </div>

            {/* 4B: RELOCATION */}
            <div
              onClick={() => setActiveNodeId("relocation_engine")}
              className={`group flex-1 flex flex-col justify-between rounded-xl border p-3 transition-all cursor-pointer ${
                activeNodeId === "relocation_engine"
                  ? "border-indigo-400 bg-indigo-950/70 shadow-md shadow-indigo-500/10 scale-[1.02]"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] font-bold text-indigo-400">STAGE 04B</span>
                  <Navigation size={13} className="text-indigo-400" />
                </div>
                <h5 className="mt-1 font-bold text-[11px] text-white">Relocation Engine</h5>
                <p className="text-[10px] text-slate-400">OSRM Safe Road Routing</p>
              </div>
            </div>
          </div>

          {/* STAGE 5: DB & MAP SYNC */}
          <div
            onClick={() => setActiveNodeId("database_sync")}
            className={`group relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all cursor-pointer ${
              activeNodeId === "database_sync"
                ? "border-emerald-400 bg-emerald-950/70 shadow-lg shadow-emerald-500/10 scale-[1.02]"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-emerald-400">STAGE 05</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Database size={18} />
              </div>
              <h4 className="mt-3 font-bold text-xs text-white">DB & Map Sync</h4>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                Supabase writes & dynamic Map polygon overlay
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-emerald-300 font-mono">
              <span>Live PostgREST</span>
              <ArrowRight size={12} className="opacity-60" />
            </div>
          </div>

          {/* STAGE 6: ZERO-DOWNTIME CACHE */}
          <div
            onClick={() => setActiveNodeId("offline_fallback")}
            className={`group relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all cursor-pointer ${
              activeNodeId === "offline_fallback"
                ? "border-purple-400 bg-purple-950/70 shadow-lg shadow-purple-500/10 scale-[1.02]"
                : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold text-purple-400">STAGE 06</span>
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              </div>
              <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <ServerCrash size={18} />
              </div>
              <h4 className="mt-3 font-bold text-xs text-white">Offline Fallback</h4>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                Latest snapshot cache used if DB/backend offline
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-purple-300 font-mono">
              <span>Zero Downtime</span>
              <CheckCircle2 size={12} className="text-purple-400" />
            </div>
          </div>
        </div>

        {/* BOTTOM WORKFLOW SUMMARY BAR */}
        <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Continuous Autonomous Loop: Ingest ➔ Normalize ➔ Predict ➔ Alert ➔ Relocate ➔ Sync</span>
          </div>
          <span className="font-mono text-emerald-400 text-[11px]">
            Active Pipeline Latency: &lt; 850ms per Zone
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. INTERACTIVE NODE INSPECTOR (DEEP DIVE CARD)
      ───────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
              <IconComponent size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-700">
                  STEP {activeNode.step}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  {activeNode.status}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-950">{activeNode.label}</h3>
              <p className="text-xs text-slate-500">{activeNode.sublabel}</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 max-w-md leading-relaxed sm:text-right">
            {activeNode.summary}
          </p>
        </div>

        {/* 4 SPECIFICATION BLOCKS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Inputs */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Activity size={14} className="text-emerald-600" />
              <span>Input Feeds</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-600 leading-snug">
              {activeNode.details.inputs.map((inp, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{inp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Processing Engine */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Cpu size={14} className="text-blue-600" />
              <span>Processing Engine</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeNode.details.processing}
            </p>
          </div>

          {/* Output Artifacts */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <CheckCircle2 size={14} className="text-teal-600" />
              <span>Output Artifacts</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeNode.details.output}
            </p>
          </div>

          {/* Failover & Resilience */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
              <Shield size={14} className="text-purple-600" />
              <span>Resilience & Failover</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {activeNode.details.resilience}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
