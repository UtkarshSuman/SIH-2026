"use client";

import Link from "next/link";
import {
  Activity,
  Shield,
  AlertTriangle,
  MapPin,
  Database,
  Cpu,
  Bell,
  Navigation,
  Users,
  Radio,
  Globe,
  Layers,
  ArrowRight,
  CheckCircle2,
  CloudRain,
  Satellite,
  Compass,
  ServerCrash,
  Sparkles,
} from "lucide-react";
import WorkflowDiagram from "./workflow-diagram";

// Automated Pipeline Step Sequence
const pipelineSteps = [
  {
    step: "01",
    title: "Live Data Ingestion",
    description:
      "Automated querying across 9+ global APIs (Open-Meteo, NASA POWER, USGS, OSM, Sentinel NDVI, GEE SoilGrids) fetching real-time precipitation, soil wetness, river discharge, wave energy, and terrain elevation.",
    icon: Globe,
    badge: "Multi-Source Telemetry",
  },
  {
    step: "02",
    title: "Data Normalization",
    description:
      "Raw telemetry is converted into normalized geospatial features, physical metrics (mm/hr, m³/s, slope degrees, moisture fractions), and aligned to local district bounding boxes.",
    icon: Layers,
    badge: "ETL & GIS Parsing",
  },
  {
    step: "03",
    title: "Dual ML Model Inference",
    description:
      "Validated RandomForest & GradientBoosting models evaluate multivariate hazard parameters to predict exact hazard scores (0.00 – 1.00) across Flood, Landslide, Erosion, and Cloudburst.",
    icon: Cpu,
    badge: "RandomForest & GradientBoosting",
  },
  {
    step: "04",
    title: "Automated Alert Escalation",
    description:
      "The Alert Bridge monitors state shifts: when a zone transitions GREEN → YELLOW or YELLOW → RED, real-time broadcasts fire instantly via Firebase Cloud Messaging (FCM), SMS, and email.",
    icon: Bell,
    badge: "FCM Push & Fast2SMS",
  },
  {
    step: "05",
    title: "Relocation & Capacity Engine",
    description:
      "For vulnerable habitations in RED and YELLOW zones, the engine computes terrain carrying capacity and pairs populations to the nearest safe relocation shelters via OSRM road routes.",
    icon: Navigation,
    badge: "OSRM Evacuation Routing",
  },
  {
    step: "06",
    title: "Database Sync & Offline Cache",
    description:
      "Synchronizes fresh classifications and site allocations to Supabase. If the backend or DB goes offline, the frontend seamlessly fails over to the latest verified cache for zero downtime.",
    icon: Database,
    badge: "Failover Resilience",
  },
];

// Core 7 Pillars ("What We Have")
const corePillars = [
  {
    number: "01",
    title: "Live Data Ingestion Pipeline",
    description:
      "Continuous live telemetry ingestion from 9 authoritative APIs: Open-Meteo Weather & Flood, NASA POWER Agroclimatology, OpenStreetMap Overpass & Nominatim, OSRM, Google Flood Forecasting, GEE SoilGrids, UN OCHA ReliefWeb, USGS Earthquakes, and Agromonitoring Sentinel NDVI.",
    icon: Activity,
    color: "emerald",
    tags: ["9 Live APIs", "Sub-hourly Telemetry", "Sentinel-2 NDVI", "NASA POWER"],
  },
  {
    number: "02",
    title: "RandomForest & GradientBoosting ML Models",
    description:
      "High-precision machine learning models trained on historical disaster incidents. Models generate objective hazard scores, dynamic risk classification colors (GREEN, YELLOW, RED), and immediate vs. medium-term priority urgency tiers.",
    icon: Cpu,
    color: "blue",
    tags: ["RandomForest", "GradientBoosting", "4 Hazard Types", "0.0-1.0 Scoring"],
  },
  {
    number: "03",
    title: "Automated Multi-Channel Alert System",
    description:
      "Real-time emergency broadcast pipeline. Triggers automated alerts immediately when zones escalate from Green to Yellow or Yellow to Red. Sends Firebase Cloud Messaging (FCM) web/mobile push, Fast2SMS mobile alerts, and Brevo emergency emails.",
    icon: Bell,
    color: "amber",
    tags: ["FCM Web Push", "Fast2SMS Gateway", "Brevo SMTP", "Transition Triggers"],
  },
  {
    number: "04",
    title: "Relocation Engine & Carrying Capacity",
    description:
      "Comprehensive shelter safety assessment that evaluates terrain load-bearing capacity, population density thresholds, and environmental limits. Computes turn-by-turn road evacuation routes between vulnerable cells and secure designated shelters.",
    icon: Navigation,
    color: "indigo",
    tags: ["Carrying Capacity", "OSRM Road Routing", "Shelter Safety Index", "Population Matching"],
  },
  {
    number: "05",
    title: "Interactive Live Zone Map",
    description:
      "Geospatial GIS interface with real OpenStreetMap boundary polygons. Features an interactive 'Click anywhere on map to analyze' tool (/api/analyze-point) that runs instant on-the-fly telemetry fetching and ML classification for any point in India.",
    icon: MapPin,
    color: "rose",
    tags: ["OSM Boundaries", "Click-to-Analyze", "Polygon Overlays", "Live GeoJSON"],
  },
  {
    number: "06",
    title: "Live Telemetry & Analytics Dashboard",
    description:
      "Real-time analytical console displaying live sensor streams: 24h & 72h precipitation accumulation, river discharge (m³/s), root-zone soil saturation (%), slope inclination in degrees, and historical disaster recurrence trends.",
    icon: Radio,
    color: "teal",
    tags: ["Real-time Gauges", "Hazard Breakdown", "Historical Logs", "Sensor Telemetry"],
  },
  {
    number: "07",
    title: "Command Access for Responders & Admins",
    description:
      "Dedicated portal for NDRF, SDMA, and DDMA disaster management officers. Enables dynamic updates to relocation site capacity, live population transfer logs, RAG knowledge document ingestion, and manual emergency alert overrides.",
    icon: Shield,
    color: "purple",
    tags: ["Role-Based Access", "Capacity Updates", "RAG Document Base", "Emergency Override"],
  },
];

// Live APIs Grid
const integratedApis = [
  {
    name: "Open-Meteo Weather API",
    metric: "Rainfall (24h/72h), Rain Rate, Temp, Humidity",
    free: true,
  },
  {
    name: "NASA POWER Agroclimatology",
    metric: "Root-Zone & Surface Soil Wetness Fraction (0-100%)",
    free: true,
  },
  {
    name: "OpenStreetMap (Overpass & Nominatim)",
    metric: "Critical Infrastructure, Coastlines & Official Boundaries",
    free: true,
  },
  {
    name: "OSRM Routing Engine",
    metric: "Real Road Network Navigation & Evacuation Polyline",
    free: true,
  },
  {
    name: "Open-Meteo Flood / GloFAS",
    metric: "Copernicus River Discharge (m³/s) & 24h Trend",
    free: true,
  },
  {
    name: "Open-Meteo Marine API",
    metric: "Wave Height, Wave Period & Coastal Wave Energy Index",
    free: true,
  },
  {
    name: "Open-Meteo & SRTM Elevation",
    metric: "Terrain Elevation (m) & 5-Point Slope Calculation",
    free: true,
  },
  {
    name: "Google Earth Engine (GEE) / SoilGrids",
    metric: "Sand, Silt, Clay % for USDA Soil Texture Class",
    free: true,
  },
  {
    name: "UN OCHA ReliefWeb Disasters API",
    metric: "Verified Regional Disaster Event Logs & Recurrence",
    free: true,
  },
  {
    name: "USGS Earthquake Hazards API",
    metric: "Seismic Tremors, Epicenter Distance & Magnitude",
    free: true,
  },
  {
    name: "Agromonitoring Sentinel NDVI API",
    metric: "Satellite Vegetation Density & Slope Canopy Cover",
    free: true,
  },
  {
    name: "Google Flood Forecasting API",
    metric: "River Gauge Heights & Stage Flood Inundation Levels",
    free: true,
  },
];

export default function AboutSection() {
  return (
    <main className="min-h-screen bg-[#f8faf9] text-slate-800">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO HEADER: PROBLEM STATEMENT & MISSION
      ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-emerald-100 bg-white px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        {/* Soft background ambient blurs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-1/2 h-96 w-96 rounded-full bg-teal-100/50 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl">
          {/* SIH BADGE */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Smart India Hackathon • Problem Statement 26191</span>
          </div>

          {/* MAIN HEADLINE */}
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl max-w-5xl leading-[1.15]">
            Intelligent Identification of Hazard-Based Red Zones, Carrying
            Capacity Assessment, and Immediate Relocation Needs for Vulnerable
            Habitations
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Rescue Arc is a unified, automated geospatial intelligence and early
            warning platform engineered to bridge the critical gap between raw
            environmental hazard telemetry, machine learning risk prediction,
            and rapid on-ground relocation for vulnerable habitations.
          </p>

          {/* QUICK STATS / HIGHLIGHT PILLS */}
          <div className="mt-8 flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-xs">
              <Activity size={15} className="text-emerald-600" />
              <span>9+ Live Sensor Telemetry Streams</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-xs">
              <Cpu size={15} className="text-blue-600" />
              <span>RandomForest & GradientBoosting AI</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-xs">
              <Bell size={15} className="text-amber-600" />
              <span>FCM Push & Fast2SMS Alert Bridge</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-xs">
              <ServerCrash size={15} className="text-purple-600" />
              <span>Offline-Resilient Cache Fallback</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. AUTOMATED CONNECTIVITY PIPELINE (WORKFLOW STEPS)
      ───────────────────────────────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-12 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl">
          {/* SECTION HEADER */}
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[3px] text-emerald-700">
              End-to-End System Architecture
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Automated Connectivity from Sensor to Evacuation
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              Every stage of the disaster lifecycle is seamlessly connected in
              real time: from sensor acquisition and ML risk scoring, to multi-channel
              alerts, carrying capacity evaluation, safe shelter allocation, and
              zero-downtime offline caching.
            </p>
          </div>

          {/* INTERACTIVE WORKFLOW DIAGRAM */}
          <div className="mt-10">
            <WorkflowDiagram />
          </div>

          {/* WORKFLOW PIPELINE CARDS */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pipelineSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-6 sm:p-7 transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:bg-white hover:shadow-lg hover:shadow-emerald-950/5"
                >
                  <div>
                    {/* Top bar with Step & Badge */}
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 font-mono text-xs font-extrabold text-white shadow-xs">
                        {step.step}
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-800">
                        {step.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-emerald-900 transition-colors">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-slate-600">
                      {step.description}
                    </p>
                  </div>

                  {/* Flow Arrow */}
                  <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <span>Automated Integration</span>
                    <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* OFFLINE RESILIENCE CALLOUT BANNER */}
          <div className="mt-10 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">
                    ✓
                  </span>
                  <h4 className="text-base font-bold text-emerald-950">
                    Guaranteed Zero-Downtime Offline Fallback
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-emerald-900/80 max-w-3xl leading-relaxed">
                  During extreme natural disasters, cellular networks and remote database connections often fail.
                  Rescue Arc automatically falls back to client-side indexed telemetry, cached OSM boundaries, and pre-computed shelter safe paths whenever the backend or cloud database is unreachable.
                </p>
              </div>
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm">
                  <Database size={14} />
                  Offline-Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. WHAT WE HAVE: THE 7 CORE CAPABILITIES
      ───────────────────────────────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-12 bg-[#f8faf9]">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[3px] text-emerald-700">
              Core Capabilities
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              What We Have Built
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              A complete, production-grade disaster mitigation ecosystem uniting
              live GIS sensing, machine learning prediction, multi-channel alerts,
              and strategic relocation management.
            </p>
          </div>

          {/* 7 PILLARS GRID */}
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {corePillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.number}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200"
                >
                  <div>
                    {/* Top Row: Icon & Number */}
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                        <Icon size={22} />
                      </div>
                      <span className="font-mono text-2xl font-extrabold text-slate-300">
                        {pillar.number}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-950">
                      {pillar.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600">
                      {pillar.description}
                    </p>
                  </div>

                  {/* Feature Tags */}
                  <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {pillar.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. LIVE DATA SOURCES & INTEGRATIONS MATRIX
      ───────────────────────────────────────────────────────────── */}
      <section className="border-t border-slate-200 bg-white px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[3px] text-emerald-700">
              Data Pipeline Matrix
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              12 Authoritative Live Data Sources
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base">
              The platform queries live APIs across international meteorological,
              hydrological, seismic, and satellite organizations to continuously refresh
              red zone classifications.
            </p>
          </div>

          <div className="mt-10 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {integratedApis.map((api) => (
              <div
                key={api.name}
                className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 transition hover:bg-emerald-50/40 hover:border-emerald-200"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      {api.name}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800">
                      Live Stream
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                    {api.metric}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-emerald-700">
                  <CheckCircle2 size={12} />
                  <span>Real-time Normalized</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. CTA TO EXPLORE MAP & PLATFORM
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-slate-950 px-5 py-16 sm:px-8 sm:py-20 lg:px-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[3px] text-emerald-400">
              Interactive Disaster Response
            </p>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Experience the Live Geospatial Platform
            </h2>
            <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-400">
              Interact with live red zone polygons, click anywhere to run on-demand
              multi-hazard ML inference, review shelter carrying capacity, and test
              real-time alert dispatches.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/redzone"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-950 transition hover:bg-emerald-500 active:scale-[0.99]"
            >
              <span>Explore Live Map</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/analytics"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              <span>Live Analytics</span>
            </Link>

            <Link
              href="/relocation"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              <span>Relocation Plan</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}