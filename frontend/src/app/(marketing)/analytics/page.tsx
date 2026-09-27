"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  CloudRain,
  Compass,
  Download,
  Gauge,
  Home,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Users,
  Waves,
  Wind,
} from "lucide-react";
import { OfflineFallbackBanner } from "@/components/ui/offline-fallback-banner";
import Navbar from "@/components/marketing/navbar";

interface HistoryPoint {
  id: string;
  period: string;
  recordedAt: string;
  floodScore: number;
  landslideScore: number;
  erosionScore: number;
  cloudburstScore: number;
  worstScore: number;
  zoneColor: string;
  rainfallMm: number;
  riverLevelM: number;
  soilSaturationPct: number;
  temperatureC?: number | null;
  dischargeCumecs?: number | null;
  humidityPct?: number | null;
  windSpeedKmh?: number | null;
}

interface CorrelationData {
  factor: string;
  label: string;
  r: number;
  strength: "VERY STRONG" | "STRONG" | "MODERATE" | "WEAK" | "INVERSE";
  impactDirection: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  description: string;
}

interface HazardRadarData {
  hazard: string;
  hazardKey: "FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST";
  current: number;
  baseline: number;
  threshold: number;
  warningThreshold: number;
  deltaPct: number;
  isBreached: boolean;
  status: "CRITICAL" | "WARNING" | "NORMAL";
}

interface ShelterAllocationData {
  siteId: string;
  siteCode: string;
  name: string;
  district: string;
  distanceKm: number;
  capacity: number;
  currentOccupancy: number;
  remainingCapacity: number;
  status: string;
  transitTimeEstimateMinutes: number;
}

function AnalyticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentZoneId, setCurrentZoneId] = useState(
    searchParams.get("zoneId") || "Z-UTTARAKHAND-JOSHIMATH-01"
  );
  const [timeRange, setTimeRange] = useState<"7d" | "14d" | "30d" | "all">("14d");
  const [activeHazardView, setActiveHazardView] = useState<
    "ALL" | "FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST"
  >("ALL");

  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<{ message: string; details?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastVersion, setLastVersion] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAnalytics = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(
        `/api/analytics?zoneId=${encodeURIComponent(currentZoneId)}&timeRange=${timeRange}`
      );
      const json = await res.json();
      if (!res.ok || json.error) {
        setError({
          message: json.message || "PostgreSQL database connection failed.",
          details: json.details || String(json.error || "Connection error"),
        });
        setData(null);
      } else {
        setData(json);
        setError(null);
      }
    } catch (err: any) {
      console.warn("[Analytics] Fetch error:", err);
      setError({
        message: "Network or database offline. Unable to query PostgreSQL database.",
        details: err?.message || String(err),
      });
      setData(null);
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    loadAnalytics();
  }, [currentZoneId, timeRange]);

  // Real-time Database Version Polling
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/version");
        const ver = await res.json();
        if (ver?.version && ver.version !== lastVersion) {
          setLastVersion(ver.version);
          await loadAnalytics();
        }
      } catch {
        // quiet ignore
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [lastVersion, currentZoneId, timeRange]);

  const zone = data?.zone;
  const history: HistoryPoint[] = data?.history || [];
  const availableZones = data?.availableZones || [];
  const statistics = data?.statistics;
  const correlations: Record<string, CorrelationData> = data?.correlations || {};
  const hazardRadar: HazardRadarData[] = data?.hazardRadar || [];
  const environmental = data?.environmentalDrivers;
  const evacuationStress = data?.evacuationStress;
  const tacticalBriefing = data?.tacticalBriefing;
  const overview = data?.overview;

  // Selected hazard series value helper
  const getHazardScore = (pt: HistoryPoint) => {
    if (activeHazardView === "FLOOD") return pt.floodScore;
    if (activeHazardView === "LANDSLIDE") return pt.landslideScore;
    if (activeHazardView === "EROSION") return pt.erosionScore;
    if (activeHazardView === "CLOUDBURST") return pt.cloudburstScore;
    return pt.worstScore;
  };

  const critThreshold = zone?.criticalThreshold ?? 0.70;
  const warnThreshold = zone?.warningThreshold ?? 0.40;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
      <Navbar />
      <main>
      {/* Top Banner & Control Toolbar */}
      <section className="border-b border-slate-200 bg-white px-5 py-7 sm:px-8 lg:px-12 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {data?.isFallback ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3 py-0.5 text-xs font-bold text-amber-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Offline Cache Mode
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Live Database Telemetry
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-400">
                  Model: {zone?.modelName || "Multi-Hazard Ensemble RF-v4.2"} ({zone?.modelVersion || "v4.2.1-prod"})
                </span>
                <span className="text-xs font-medium text-slate-400">
                  • {zone?.sensorNodeCount ?? 16} Active Sensor Nodes
                </span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl flex items-center gap-3">
                <span>Multi-Hazard Risk Analytics &amp; Change Detection</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500 max-w-3xl">
                Continuous mathematical analysis evaluating composite multi-hazard exposure across habitations.
                Correlates rainfall telemetry, river discharge, and hydrological saturation loaded dynamically from the database.
              </p>
            </div>

            {/* Controls: Location Selector, Time Range & Actions */}
            <div className="flex flex-wrap items-end gap-3">
              {/* Monitored Location Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Monitored Habitation:
                </label>
                <select
                  value={currentZoneId}
                  onChange={(e) => {
                    setCurrentZoneId(e.target.value);
                    router.push(`/analytics?zoneId=${encodeURIComponent(e.target.value)}`);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                >
                  {availableZones.map((z: any) => (
                    <option key={z.zoneId} value={z.zoneId}>
                      {z.name} ({z.color} ZONE • {z.state})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Range Filter */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Telemetry Window:
                </label>
                <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5">
                  {(["7d", "14d", "30d", "all"] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                        timeRange === range
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      {range === "7d" ? "7D" : range === "14d" ? "14D" : range === "30d" ? "30D" : "ALL"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Refresh & PDF Action */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadAnalytics(true)}
                  disabled={isRefreshing}
                  title="Reload Live Telemetry from Database"
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-all"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>Export SitRep</span>
                </button>
              </div>
            </div>
          </div>

          {/* Offline Fallback Banner */}
          {data?.isFallback && (
            <div className="mt-4">
              <OfflineFallbackBanner
                isFallback={true}
                message={data.warning || "Database or backend offline using internal latest data."}
                source="Internal Latest Snapshot"
                onRetry={() => loadAnalytics(true)}
                isRetrying={isRefreshing}
              />
            </div>
          )}

          {/* Quick Executive KPI Metrics Strip */}
          {zone && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {/* 1. Current Risk Status */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:shadow-md transition-all">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Current Tier</span>
                  <span className="text-[10px] text-slate-400 font-normal">{zone.district}</span>
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      zone.zoneColor === "RED"
                        ? "bg-red-500 animate-ping"
                        : zone.zoneColor === "YELLOW"
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                    }`}
                  />
                  <p className="text-lg font-black text-slate-900">{zone.zoneColor} ZONE</p>
                </div>
                <p className="text-[11px] font-medium text-slate-500 truncate">
                  Index: {(zone.worstScore * 100).toFixed(1)}% • {zone.worstHazard}
                </p>
              </div>

              {/* 2. Hazard Trend & Velocity */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:shadow-md transition-all">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Risk Velocity</span>
                  {statistics?.riskDirection === "ESCALATING" ? (
                    <TrendingUp className="h-3.5 w-3.5 text-red-500" />
                  ) : statistics?.riskDirection === "SUBSIDING" ? (
                    <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </p>
                <p
                  className={`mt-1 text-lg font-black ${
                    statistics?.riskDirection === "ESCALATING"
                      ? "text-red-600"
                      : statistics?.riskDirection === "SUBSIDING"
                      ? "text-emerald-600"
                      : "text-slate-900"
                  }`}
                >
                  {statistics?.riskDirection || "STABLE"}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {statistics?.riskVelocityPerDay !== undefined
                    ? `${statistics.riskVelocityPerDay > 0 ? "+" : ""}${(
                        statistics.riskVelocityPerDay * 100
                      ).toFixed(2)}%/day`
                    : "0.0%/day"}
                </p>
              </div>

              {/* 3. Cumulative Precipitation */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:shadow-md transition-all">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Cumulative Rain</span>
                  <CloudRain className="h-3.5 w-3.5 text-blue-500" />
                </p>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {environmental?.cumulative72hRainMm ?? 0} mm
                </p>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  72-Hour Sum (Peak: {environmental?.peakRainfallMm ?? 0}mm)
                </p>
              </div>

              {/* 4. Soil Hydrology Saturation */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:shadow-md transition-all">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Soil Saturation</span>
                  <Waves className="h-3.5 w-3.5 text-cyan-600" />
                </p>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {environmental?.latestSoilSaturationPct ?? 0}%
                </p>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  River Stage: {environmental?.latestRiverLevelM ?? 0} m
                </p>
              </div>

              {/* 5. Evacuation Carrying Capacity Stress */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:shadow-md transition-all">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Shelter Headroom</span>
                  <Home className="h-3.5 w-3.5 text-purple-600" />
                </p>
                <p className="mt-1 text-lg font-black text-slate-900">
                  {evacuationStress?.availableCapacityHeadroom?.toLocaleString("en-IN") || 0}
                </p>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Stress: {evacuationStress?.stressRatioPct ?? 0}% • {zone.population?.toLocaleString("en-IN")} at risk
                </p>
              </div>

              {/* 6. Protocol & Model Confidence */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm hover:shadow-md transition-all">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Model Confidence</span>
                  <Gauge className="h-3.5 w-3.5 text-emerald-600" />
                </p>
                <p className="mt-1 text-lg font-black text-emerald-600">
                  {((zone.confidenceScore || 0.92) * 100).toFixed(1)}%
                </p>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Urgency: {zone.priority}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Dynamic Analytics Body */}
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
        {error ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-white p-8 sm:p-10 shadow-lg text-center my-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 border border-red-200 text-red-600 mb-5">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <span className="inline-block rounded-full bg-red-100 text-red-800 px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-3">
              Strict Database Mode • Static Mocks Disabled
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              PostgreSQL Database Offline or Unreachable
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
              {error.message}
            </p>
            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4 text-left text-xs text-slate-600 font-mono overflow-x-auto">
              <p className="font-bold text-slate-700 font-sans mb-1 text-[11px] uppercase tracking-wider">Diagnostic Log:</p>
              <p className="text-red-700 break-all">{error.details || "Connection refused to database host."}</p>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => loadAnalytics(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>Retry Database Connection</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
              >
                Back to Home
              </button>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex h-72 flex-col items-center justify-center gap-3 text-slate-500">
            <RefreshCw className="h-7 w-7 animate-spin text-blue-600" />
            <p className="text-sm font-semibold">Synthesizing mathematical telemetry &amp; calculating Pearson correlations from database...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* SECTION 1: Dynamic Multi-Hazard Risk Trajectory Chart */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">
                      Multi-Hazard Risk Trajectory ({history.length} Data Points)
                    </h2>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                      Window: {data?.timeRange}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Live chronological time-series from database evaluating multi-hazard scores and environmental spikes for <strong>{zone?.name}</strong>.
                  </p>
                </div>

                {/* Filter Hazard Series */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-semibold mr-1">Filter Series:</span>
                  {(["ALL", "FLOOD", "LANDSLIDE", "EROSION", "CLOUDBURST"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setActiveHazardView(mode)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                        activeHazardView === mode
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Threshold Labels */}
              <div className="mt-5 flex flex-wrap items-center justify-between text-[11px] font-semibold border-b border-slate-100 pb-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-red-600">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Critical Red Threshold ({(critThreshold * 100).toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <span className="h-2 w-2 rounded-full bg-amber-400" />
                    Warning Yellow Threshold ({(warnThreshold * 100).toFixed(0)}%)
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Safe Green Baseline (&lt;{(warnThreshold * 100).toFixed(0)}%)
                  </span>
                </div>

                <div className="flex items-center gap-3 text-slate-500 font-medium">
                  <span>Mean: {(statistics?.meanScore * 100).toFixed(1)}%</span>
                  <span>Peak: {(statistics?.peakScore * 100).toFixed(1)}%</span>
                  <span>Volatility (&sigma;): {statistics?.volatilityIndex}</span>
                  {statistics?.anomaliesCount > 0 && (
                    <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      {statistics.anomaliesCount} Anomaly Spike{statistics.anomaliesCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Interactive Trajectory Visualization (Dynamic columns from DB) */}
              <div className="mt-6 overflow-x-auto pb-2">
                <div
                  className="grid gap-2 min-w-[700px]"
                  style={{
                    gridTemplateColumns: `repeat(${Math.max(7, history.length)}, minmax(0, 1fr))`,
                  }}
                >
                  {history.map((pt, idx) => {
                    const isLast = idx === history.length - 1;
                    const val = getHazardScore(pt);
                    const heightPct = Math.min(100, Math.round(val * 100));

                    const isCritical = val >= critThreshold;
                    const isWarning = val >= warnThreshold && !isCritical;
                    const barColor = isCritical
                      ? "bg-red-500"
                      : isWarning
                      ? "bg-amber-400"
                      : "bg-emerald-500";

                    const isOutlier =
                      statistics?.anomalyDates &&
                      statistics.anomalyDates.includes(pt.period);

                    return (
                      <div
                        key={pt.id || `${pt.period}-${idx}`}
                        className={`group relative flex flex-col items-center justify-end rounded-xl border p-2 transition-all hover:bg-slate-50 hover:border-slate-400 ${
                          isLast ? "border-slate-900 bg-slate-50/80 shadow-sm" : "border-slate-200 bg-white"
                        }`}
                      >
                        {/* Hover Tooltip with Deep DB Telemetry */}
                        <div className="pointer-events-none absolute -top-24 z-30 hidden w-44 rounded-xl bg-slate-950 p-2.5 text-left text-[11px] text-white shadow-xl group-hover:block transition-all">
                          <p className="font-bold text-slate-100 flex items-center justify-between border-b border-slate-800 pb-1">
                            <span>{pt.period}</span>
                            <span
                              className={`rounded px-1 text-[9px] font-black ${
                                isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            >
                              {pt.zoneColor}
                            </span>
                          </p>
                          <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-300">
                            <p>Hazard Score: <strong className="text-white">{(val * 100).toFixed(1)}%</strong></p>
                            <p>Precipitation: <strong className="text-cyan-300">{pt.rainfallMm} mm</strong></p>
                            <p>River Stage: <strong className="text-blue-300">{pt.riverLevelM} m</strong></p>
                            <p>Soil Moisture: <strong className="text-emerald-300">{pt.soilSaturationPct}%</strong></p>
                            {pt.temperatureC && <p>Temperature: {pt.temperatureC}°C</p>}
                          </div>
                        </div>

                        {/* Outlier Badge */}
                        {isOutlier && (
                          <span
                            title="Statistical telemetry surge detected"
                            className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-rose-600 animate-ping"
                          />
                        )}

                        {/* Visual Bar with Threshold Markers */}
                        <div className="relative flex h-40 w-full items-end justify-center rounded-lg bg-slate-100/90 p-1">
                          {/* Critical threshold guide line */}
                          <div
                            className="absolute left-0 right-0 border-b border-dashed border-red-400 pointer-events-none opacity-80"
                            style={{ bottom: `${critThreshold * 100}%` }}
                          />
                          {/* Warning threshold guide line */}
                          <div
                            className="absolute left-0 right-0 border-b border-dashed border-amber-400 pointer-events-none opacity-80"
                            style={{ bottom: `${warnThreshold * 100}%` }}
                          />

                          <div
                            className={`w-full rounded-md transition-all duration-500 ${barColor}`}
                            style={{ height: `${Math.max(8, heightPct)}%` }}
                          />
                        </div>

                        {/* Labels */}
                        <p className="mt-2 text-center text-[10px] font-black text-slate-800">
                          {(val * 100).toFixed(0)}%
                        </p>
                        <p className="truncate text-center text-[9px] font-medium text-slate-400 max-w-full">
                          {pt.period.replace("Day ", "D")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* SECTION 2: Grid Row - Meteorological Correlation Matrix & Multi-Hazard Baselines */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Card A: Pearson Meteorological Correlation Matrix */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Meteorological Pearson Correlation Matrix
                    </h3>
                    <p className="text-xs text-slate-500">
                      Quantifies mathematical linear correlation (r) between environmental telemetry and risk shifts.
                    </p>
                  </div>
                  <span className="rounded-lg bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-bold text-blue-700">
                    Live Math Engine
                  </span>
                </div>

                {/* Correlation Metrics */}
                <div className="mt-5 space-y-3.5">
                  {Object.entries(correlations).map(([key, item]) => {
                    const absR = Math.abs(item.r);
                    const barWidth = Math.round(absR * 100);
                    const color =
                      absR >= 0.7
                        ? "bg-red-500 text-red-700"
                        : absR >= 0.4
                        ? "bg-amber-500 text-amber-700"
                        : "bg-blue-500 text-blue-700";

                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">{item.label}</span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs font-black ${
                              absR >= 0.6 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            r = {item.r > 0 ? `+${item.r}` : item.r} [{item.strength}]
                          </span>
                        </div>

                        {/* Visual Bar */}
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${color.split(" ")[0]}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>

                        <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                  <span>Pearson formula: r = &Sigma;(dx*dy) / &radic;(&Sigma;dx&sup2; * &Sigma;dy&sup2;)</span>
                  <span className="font-semibold text-slate-600">Sample Size: {history.length} readings</span>
                </div>
              </div>

              {/* Card B: Multi-Hazard Severity vs Dynamic DB Baseline */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Multi-Hazard Severity vs Historical Baseline
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live score vs historical mean baseline computed from database telemetry.
                    </p>
                  </div>
                  <span className="rounded-lg bg-purple-50 border border-purple-200 px-2 py-1 text-[11px] font-bold text-purple-700">
                    Dynamic Baselines
                  </span>
                </div>

                <div className="mt-5 space-y-4">
                  {hazardRadar.map((h) => (
                    <div key={h.hazard} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{h.hazard} Risk</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-500">
                            Baseline: {(h.baseline * 100).toFixed(1)}%
                          </span>
                          <span
                            className={`font-black rounded px-1.5 py-0.5 text-[10px] ${
                              h.status === "CRITICAL"
                                ? "bg-red-100 text-red-700"
                                : h.status === "WARNING"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            Current: {(h.current * 100).toFixed(1)}% ({h.deltaPct > 0 ? `+${h.deltaPct}%` : `${h.deltaPct}%`})
                          </span>
                        </div>
                      </div>

                      {/* Dual Progress Meter */}
                      <div className="relative mt-2 h-3.5 w-full overflow-hidden rounded-full bg-slate-200">
                        {/* Historical Baseline marker */}
                        <div
                          className="absolute bottom-0 top-0 bg-slate-400"
                          style={{ width: `${Math.min(100, h.baseline * 100)}%` }}
                        />
                        {/* Current fill */}
                        <div
                          className={`absolute bottom-0 top-0 rounded-full transition-all duration-700 ${
                            h.status === "CRITICAL"
                              ? "bg-red-500"
                              : h.status === "WARNING"
                              ? "bg-amber-500"
                              : "bg-blue-600"
                          }`}
                          style={{ width: `${Math.min(100, h.current * 100)}%` }}
                        />
                        {/* Critical Red Threshold Line */}
                        <div
                          className="absolute bottom-0 top-0 w-0.5 bg-red-700 z-10"
                          style={{ left: `${critThreshold * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                  <span className="text-red-600 font-semibold">
                    Vertical Red Line = Critical Threshold ({(critThreshold * 100).toFixed(0)}%)
                  </span>
                  <span className="font-semibold text-slate-600">
                    Escalation Probability: {statistics?.escalationProbabilityPct ?? 50}%
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 3: Evacuation Headroom & Sphere Carrying Capacity Analysis */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Home className="h-4 w-4 text-blue-600" />
                    <span>Sphere Standards Carrying Capacity &amp; Relocation Headroom</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live database query matching candidate relocation shelters evaluated against 45m²/person Sphere emergency settlement minimums.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      evacuationStress?.accommodationStatus === "FULLY_ACCOMMODATED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : evacuationStress?.accommodationStatus === "NEAR_CAPACITY"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}
                  >
                    {evacuationStress?.accommodationStatus === "FULLY_ACCOMMODATED"
                      ? "100% Sphere Headroom Accommodated"
                      : evacuationStress?.accommodationStatus === "NEAR_CAPACITY"
                      ? "Approaching Carrying Capacity"
                      : `Deficit: ${evacuationStress?.shortfallCount?.toLocaleString("en-IN")} Persons`}
                  </span>
                </div>
              </div>

              {/* Matched Shelters Table */}
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase text-slate-500">
                      <th className="py-2.5 px-3">Shelter Township</th>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">Transit Distance</th>
                      <th className="py-2.5 px-3">Est. Transit Time</th>
                      <th className="py-2.5 px-3">Sphere Capacity</th>
                      <th className="py-2.5 px-3">Current Occupancy</th>
                      <th className="py-2.5 px-3">Remaining Headroom</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(evacuationStress?.nearestShelters || []).map((shelter: ShelterAllocationData) => {
                      const occPct = shelter.capacity > 0 ? Math.round((shelter.currentOccupancy / shelter.capacity) * 100) : 0;
                      return (
                        <tr key={shelter.siteId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            {shelter.name}
                          </td>
                          <td className="py-3 px-3 text-slate-500">{shelter.district}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800">{shelter.distanceKm} km</td>
                          <td className="py-3 px-3 text-slate-600">{shelter.transitTimeEstimateMinutes} min convoy</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{shelter.capacity.toLocaleString("en-IN")}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span>{shelter.currentOccupancy.toLocaleString("en-IN")}</span>
                              <span className="text-[10px] text-slate-400">({occPct}%)</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-600">
                            {shelter.remainingCapacity.toLocaleString("en-IN")}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                shelter.status === "ACTIVE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : shelter.status === "FULL"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {shelter.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 4: Automated NDRF Tactical Intelligence Briefing */}
            <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/60 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white shadow-sm">
                    <ShieldAlert className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    Automated NDRF Tactical Intelligence Situation Report
                  </h3>
                </div>

                <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-xs">
                  Updated: {new Date().toLocaleTimeString()}
                </span>
              </div>

              {tacticalBriefing && (
                <div className="mt-4 space-y-3 text-xs leading-relaxed text-slate-700">
                  <div className="rounded-xl bg-white/80 p-3.5 border border-slate-100">
                    <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      Location &amp; Threat Classification:
                    </p>
                    <p>{tacticalBriefing.classificationText}</p>
                  </div>

                  <div className="rounded-xl bg-white/80 p-3.5 border border-slate-100">
                    <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-cyan-500" />
                      Compound Environmental Drivers:
                    </p>
                    <p>{tacticalBriefing.environmentalDriverText}</p>
                  </div>

                  <div className="rounded-xl bg-white/80 p-3.5 border border-slate-100">
                    <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Topographic &amp; Population Vulnerability:
                    </p>
                    <p>{tacticalBriefing.topographicVulnerabilityText}</p>
                  </div>

                  <div className="rounded-xl bg-slate-900 p-4 text-white">
                    <p className="font-black text-amber-400 mb-1 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      Operational Commander Directive:
                    </p>
                    <p className="text-slate-200 leading-normal mb-3">
                      {tacticalBriefing.evacuationDirectiveText}
                    </p>

                    {tacticalBriefing.recommendedActions?.length > 0 && (
                      <div className="border-t border-slate-800 pt-2.5 space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Immediate Actions Required:</p>
                        {tacticalBriefing.recommendedActions.map((act: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push(`/relocation?zoneId=${encodeURIComponent(zone?.zoneId)}`)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-blue-700 shadow-sm flex items-center gap-1.5"
                >
                  <span>Launch Road Evacuation Route Navigator</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  Print Full NDRF Situation Report (PDF)
                </button>
              </div>
            </section>

            {/* SECTION 5: Macro Multi-Zone Comparative Overview */}
            {overview && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-indigo-600" />
                      <span>National Multi-Zone Comparative Exposure</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Aggregated risk comparison across all monitored habitations in the database.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    National Risk Index: {overview.nationalRiskIndex}
                  </span>
                </div>

                {/* Macro summary cards */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Total Monitored Pop</p>
                    <p className="text-base font-black text-slate-900 mt-0.5">
                      {overview.totalMonitoredPopulation?.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                    <p className="text-[10px] font-bold uppercase text-red-600">Red Zone Critical Pop</p>
                    <p className="text-base font-black text-red-700 mt-0.5">
                      {overview.totalRedZonePopulation?.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Zone Distribution</p>
                    <p className="text-base font-black text-slate-900 mt-0.5">
                      <span className="text-red-600">{overview.redZoneCount}R</span> •{" "}
                      <span className="text-amber-500">{overview.yellowZoneCount}Y</span> •{" "}
                      <span className="text-emerald-600">{overview.greenZoneCount}G</span>
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Sphere Shelters Headroom</p>
                    <p className="text-base font-black text-slate-900 mt-0.5">
                      {overview.totalAvailableShelterCapacity?.toLocaleString("en-IN")} / {overview.totalShelterCapacity?.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* All zones comparative list */}
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {availableZones.map((z: any) => (
                    <div
                      key={z.zoneId}
                      onClick={() => {
                        setCurrentZoneId(z.zoneId);
                        router.push(`/analytics?zoneId=${encodeURIComponent(z.zoneId)}`);
                      }}
                      className={`cursor-pointer rounded-xl border p-3 transition-all hover:border-blue-500 hover:shadow-sm ${
                        z.zoneId === currentZoneId
                          ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 truncate max-w-[70%]">{z.name}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-black ${
                            z.color === "RED"
                              ? "bg-red-100 text-red-700"
                              : z.color === "YELLOW"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {z.color}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{z.state}</span>
                        <span className="font-semibold text-slate-700">Pop: {z.population?.toLocaleString("en-IN")}</span>
                        <span className="font-bold text-slate-900">{(z.worstScore * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center gap-3 text-slate-500 font-sans">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold">Loading Multi-Hazard Analytics Engine...</p>
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
