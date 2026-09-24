"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface HistoryPoint {
  period: string;
  floodScore: number;
  landslideScore: number;
  erosionScore: number;
  cloudburstScore: number;
  worstScore: number;
  zoneColor: string;
  rainfallMm: number;
  riverLevelM: number;
  soilSaturationPct: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedZoneIdParam = searchParams.get("zoneId") || "Z-UTTARAKHAND-JOSHIMATH-01";

  const [currentZoneId, setCurrentZoneId] = useState(selectedZoneIdParam);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeHazardView, setActiveHazardView] = useState<"ALL" | "FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST">("ALL");

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetch(`/api/analytics?zoneId=${encodeURIComponent(currentZoneId)}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) {
          setData(json);
        }
      })
      .catch((err) => console.warn("Failed to load analytics:", err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentZoneId]);

  const zone = data?.zone;
  const history: HistoryPoint[] = data?.history || [];
  const overview = data?.overview;
  const availableZones = data?.availableZones || [];

  // Calculate changes over the period
  const trendAnalysis = useMemo(() => {
    if (history.length < 2) return { changeWorst: 0, changeRain: 0, trendDirection: "STABLE" };
    const first = history[0];
    const last = history[history.length - 1];
    const changeWorst = Number((last.worstScore - first.worstScore).toFixed(3));
    const changeRain = Number((last.rainfallMm - first.rainfallMm).toFixed(1));
    const trendDirection = changeWorst > 0.05 ? "ESCALATING" : changeWorst < -0.05 ? "SUBSIDING" : "STABLE";
    return { changeWorst, changeRain, trendDirection };
  }, [history]);

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-800">
      {/* Top Banner */}
      <section className="border-b border-slate-200 bg-white px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-bold text-blue-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                  NDRF Deep Hazard Telemetry
                </span>
                <span className="text-xs text-slate-400 font-medium">Predictive ML Time-Series</span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Advanced Hazard Analytics &amp; Change Detection
              </h1>
              <p className="mt-1 text-sm text-slate-500 max-w-3xl">
                Historical time-series analysis evaluating how multi-hazard severity changed over time.
                Correlates rainfall telemetry, river discharge, and soil saturation with ML classification shifts.
              </p>
            </div>

            {/* Location Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Monitored Location:
              </label>
              <select
                value={currentZoneId}
                onChange={(e) => {
                  setCurrentZoneId(e.target.value);
                  router.push(`/analytics?zoneId=${encodeURIComponent(e.target.value)}`);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {availableZones.map((z: any) => (
                  <option key={z.zoneId} value={z.zoneId}>
                    {z.name} [{z.color} ZONE]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Metrics */}
          {zone && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current Status</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      zone.zoneColor === "RED"
                        ? "bg-red-500 animate-ping"
                        : zone.zoneColor === "YELLOW"
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                    }`}
                  />
                  <p className="text-lg font-black text-slate-900">{zone.zoneColor} ZONE</p>
                </div>
                <p className="text-[11px] font-medium text-slate-500">Peak: {zone.worstHazard}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Hazard Trend</p>
                <p
                  className={`mt-1 text-lg font-black ${
                    trendAnalysis.trendDirection === "ESCALATING"
                      ? "text-red-600"
                      : trendAnalysis.trendDirection === "SUBSIDING"
                      ? "text-emerald-600"
                      : "text-slate-900"
                  }`}
                >
                  {trendAnalysis.trendDirection}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {trendAnalysis.changeWorst > 0 ? `+${trendAnalysis.changeWorst}` : trendAnalysis.changeWorst} over 14 days
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cumulative Rain</p>
                <p className="mt-1 text-lg font-black text-slate-900">{zone.metrics.rainfall_72h_mm} mm</p>
                <p className="text-[11px] text-slate-500 font-medium">72-Hour Precipitation</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Soil Saturation</p>
                <p className="mt-1 text-lg font-black text-slate-900">{zone.metrics.soil_saturation_pct}%</p>
                <p className="text-[11px] text-slate-500 font-medium">NASA POWER Hydrology</p>
              </div>

              <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Relocation Urgency</p>
                <p className="mt-1 text-lg font-black text-red-600">{zone.priority}</p>
                <p className="text-[11px] text-slate-500 font-medium">Score: {zone.priorityScore.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Analytics Content */}
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-slate-400">
            Synthesizing time-series telemetry and calculating change vectors...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Chart 1: Multi-Hazard Trajectory Area Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    14-Day Multi-Hazard Risk Trajectory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tracks how the 4 hazard scores changed over time for <strong>{zone?.name}</strong>.
                  </p>
                </div>

                {/* Filter Hazard Series */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium">Filter Series:</span>
                  {(["ALL", "FLOOD", "LANDSLIDE", "EROSION", "CLOUDBURST"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setActiveHazardView(mode)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        activeHazardView === mode
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual SVG Multi-Line / Bar Graph */}
              <div className="mt-6">
                {/* Critical Threshold Line Labels */}
                <div className="relative mb-2 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span className="text-red-600">Red Zone Critical Threshold (0.70)</span>
                  <span className="text-amber-600">Yellow Zone Warning (0.40)</span>
                  <span className="text-emerald-600">Green Safe Baseline (&lt;0.40)</span>
                </div>

                {/* Trajectory Column Cards */}
                <div className="grid grid-cols-7 gap-2 sm:grid-cols-14">
                  {history.map((pt, idx) => {
                    const isLast = idx === history.length - 1;
                    const val =
                      activeHazardView === "ALL"
                        ? pt.worstScore
                        : activeHazardView === "FLOOD"
                        ? pt.floodScore
                        : activeHazardView === "LANDSLIDE"
                        ? pt.landslideScore
                        : activeHazardView === "EROSION"
                        ? pt.erosionScore
                        : pt.cloudburstScore;

                    const heightPct = Math.round(val * 100);
                    const color =
                      val >= 0.7
                        ? "bg-red-500 text-red-700"
                        : val >= 0.4
                        ? "bg-amber-400 text-amber-700"
                        : "bg-emerald-500 text-emerald-700";

                    return (
                      <div
                        key={pt.period}
                        className={`group relative flex flex-col items-center justify-end rounded-xl border p-2 transition-all hover:bg-slate-50 ${
                          isLast ? "border-slate-900 bg-slate-50/80" : "border-slate-100 bg-white"
                        }`}
                      >
                        {/* Tooltip on hover */}
                        <div className="pointer-events-none absolute -top-12 z-20 hidden w-32 rounded-lg bg-slate-900 p-2 text-center text-[10px] text-white shadow-lg group-hover:block">
                          <p className="font-bold">{pt.period}</p>
                          <p>Score: {val.toFixed(3)}</p>
                          <p>Rain: {pt.rainfallMm} mm</p>
                        </div>

                        {/* Visual Bar */}
                        <div className="relative flex h-36 w-full items-end justify-center rounded-lg bg-slate-100/80 p-1">
                          {/* 0.70 threshold mark */}
                          <div
                            className="absolute left-0 right-0 border-b border-dashed border-red-300 pointer-events-none"
                            style={{ bottom: "70%" }}
                          />
                          {/* 0.40 threshold mark */}
                          <div
                            className="absolute left-0 right-0 border-b border-dashed border-amber-300 pointer-events-none"
                            style={{ bottom: "40%" }}
                          />

                          <div
                            className={`w-full rounded-md transition-all duration-500 ${color.split(" ")[0]}`}
                            style={{ height: `${Math.max(8, heightPct)}%` }}
                          />
                        </div>

                        {/* Label */}
                        <p className="mt-2 text-center text-[10px] font-bold text-slate-700">
                          {val.toFixed(2)}
                        </p>
                        <p className="truncate text-center text-[9px] text-slate-400">
                          {pt.period.replace("Day ", "D")}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Grid Row: Correlation Analysis & Multi-Hazard Radar */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Correlation: Rainfall vs River Discharge vs Landslide Risk */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">
                  Meteorological Correlation Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  How daily precipitation and river level directly drive hazard classification escalation.
                </p>

                <div className="mt-5 space-y-3">
                  {history.slice(-5).map((pt) => (
                    <div
                      key={pt.period}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{pt.period}</span>
                        <div className="mt-0.5 text-[11px] text-slate-500">
                          Rainfall: <strong className="text-slate-700">{pt.rainfallMm} mm</strong> | River:{" "}
                          <strong className="text-slate-700">{pt.riverLevelM} m</strong> | Saturation:{" "}
                          <strong className="text-slate-700">{pt.soilSaturationPct}%</strong>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            pt.zoneColor === "RED"
                              ? "bg-red-100 text-red-700"
                              : pt.zoneColor === "YELLOW"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {pt.worstScore.toFixed(3)} [{pt.zoneColor}]
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Hazard Spider / Radar Comparison */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-bold text-slate-900">
                  Multi-Hazard Severity Comparison
                </h3>
                <p className="text-xs text-slate-500">
                  Current score compared against historical baseline and emergency threshold.
                </p>

                <div className="mt-5 space-y-4">
                  {(data?.hazardRadar || []).map((h: any) => {
                    const isExceeded = h.current >= h.threshold;
                    return (
                      <div key={h.hazard}>
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-800">{h.hazard} Risk</span>
                          <span className={isExceeded ? "font-bold text-red-600" : "font-medium text-slate-600"}>
                            Current: {(h.current * 100).toFixed(1)}% | Baseline: {(h.baseline * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* Dual Progress Meter */}
                        <div className="relative mt-1.5 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                          {/* Baseline indicator */}
                          <div
                            className="absolute bottom-0 top-0 bg-slate-300"
                            style={{ width: `${h.baseline * 100}%` }}
                          />
                          {/* Current fill */}
                          <div
                            className={`absolute bottom-0 top-0 rounded-full transition-all duration-500 ${
                              isExceeded ? "bg-red-500" : "bg-blue-600"
                            }`}
                            style={{ width: `${h.current * 100}%` }}
                          />
                          {/* Red Zone Threshold line at 70% */}
                          <div className="absolute bottom-0 top-0 w-0.5 bg-red-700" style={{ left: "70%" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                  <span>Dashed Line = Critical Red Zone Threshold (0.70)</span>
                  <span className="font-semibold text-slate-600">Model: Ensemble Random Forest</span>
                </div>
              </div>
            </div>

            {/* AI Natural Language NDRF Tactical Briefing */}
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-white to-emerald-50/60 p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                  ℹ
                </span>
                <h3 className="text-base font-black text-slate-900">
                  NDRF Automated Tactical Intelligence Briefing
                </h3>
              </div>

              <div className="mt-3 text-xs leading-6 text-slate-600 space-y-2">
                <p>
                  <strong>Location Assessment ({zone?.name}):</strong> The machine learning model has classified this zone as{" "}
                  <strong className={zone?.zoneColor === "RED" ? "text-red-600" : "text-amber-600"}>
                    {zone?.zoneColor} ZONE
                  </strong>{" "}
                  with an overall hazard severity index of <strong>{(zone?.worstScore * 100).toFixed(1)}%</strong> driven primarily by{" "}
                  <strong>{zone?.worstHazard}</strong>.
                </p>

                <p>
                  <strong>Environmental Drivers:</strong> In the past 72 hours, cumulative precipitation reached{" "}
                  <strong>{zone?.metrics.rainfall_72h_mm} mm</strong> alongside a soil saturation reading of{" "}
                  <strong>{zone?.metrics.soil_saturation_pct}%</strong>. This combination breaches the terrain stability threshold
                  on slopes classified as <em>{zone?.slopeClass}</em>.
                </p>

                <p>
                  <strong>Tactical Directive:</strong> Immediate evacuation protocol is assigned at priority level{" "}
                  <strong>{zone?.priority}</strong>. Authorities should dispatch road transit convoys along designated safe corridors
                  toward verified candidate townships with adequate Sphere carrying-capacity headroom.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/relocation?zoneId=${encodeURIComponent(zone?.zoneId)}`)}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                >
                  View Road Evacuation Routes →
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Export NDRF Situation Report (PDF)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
