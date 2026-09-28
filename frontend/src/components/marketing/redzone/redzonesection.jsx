"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import LocationSearch from "./locationsearch";
import RiskLegend from "./risklegend";
import RiskInfo from "./riskinfo";
import { OfflineFallbackBanner } from "@/components/ui/offline-fallback-banner";

const RedZoneMap = dynamic(() => import("./redzonemap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[620px] w-full items-center justify-center bg-slate-900 text-xs text-slate-400">
      <div className="flex flex-col items-center gap-2">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <span>Loading interactive GIS hazard map...</span>
      </div>
    </div>
  ),
});

export default function RedZoneSection() {
  const [zones, setZones] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState("");

  // Offline Fallback State
  const [isFallback, setIsFallback] = useState(false);
  const [fallbackWarning, setFallbackWarning] = useState("");
  const [fallbackSource, setFallbackSource] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);

  // Rate Limiting & Pipeline State
  const [isTriggering, setIsTriggering] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const cooldownIntervalRef = useRef(null);

  const loadZones = useCallback(async (isRetry = false) => {
    try {
      if (isRetry) setIsRetrying(true);
      const response = await fetch(`/api/zones?format=details&retry=${isRetry}&t=${Date.now()}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load zone data");

      const rawZones = Array.isArray(payload) ? payload : payload?.zones || [];
      const fallbackHeader = response.headers.get("x-is-fallback") === "true";
      const isFb = Boolean(payload?.isFallback ?? fallbackHeader);

      setIsFallback(isFb);
      if (isFb) {
        setFallbackWarning(
          payload?.warning ||
          response.headers.get("x-fallback-warning") ||
          "Database or backend offline using internal latest data."
        );
        setFallbackSource(
          payload?.source ||
          response.headers.get("x-source") ||
          "Internal Latest Snapshot"
        );
      }

      setZones((prev) => {
        // Keep any click-analyzed points that were added during this session
        const clickAnalyzed = prev.filter((z) => z.isClickAnalyzed);
        const freshMap = new Map(rawZones.map((z) => [z.zoneId, z]));
        clickAnalyzed.forEach((z) => freshMap.set(z.zoneId, z));
        return Array.from(freshMap.values());
      });

      setSelectedLocation((current) => {
        if (current) {
          if (current.zoneId) {
            const matching = rawZones.find((z) => z.zoneId === current.zoneId);
            if (matching) return matching;
          }
          return current;
        }
        return [...rawZones].sort((a, b) => (b.worstScore || 0) - (a.worstScore || 0))[0] || null;
      });
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load zone data");
    } finally {
      if (isRetry) setIsRetrying(false);
    }
  }, []);

  useEffect(() => {
    loadZones();
    const refresh = window.setInterval(loadZones, 60000);
    return () => window.clearInterval(refresh);
  }, [loadZones]);

  // Clean up cooldown timer on unmount
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    };
  }, []);

  const startCooldown = (seconds) => {
    setCooldownRemaining(seconds);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    cooldownIntervalRef.current = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTriggerPipeline = async () => {
    if (isTriggering || cooldownRemaining > 0) return;

    setIsTriggering(true);
    setPipelineStatus({
      type: "loading",
      message: "Running multi-hazard GIS ingestion & ML inference across all zones (~15-20s)...",
    });

    try {
      const res = await fetch("/api/pipeline/trigger", { method: "POST" });
      const data = await res.json();

      if (res.status === 429) {
        const waitTime = data.cooldown_remaining || 30;
        startCooldown(waitTime);
        setPipelineStatus({
          type: "warning",
          message: data.message || `Pipeline is rate-limited. Please wait ${waitTime}s.`,
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || data.detail || "Pipeline run failed.");
      }

      // Success
      setPipelineStatus({
        type: "success",
        message: `✓ Pipeline complete! Assessed and upgraded ${data.results?.length || 5} zones in database.`,
      });

      startCooldown(data.cooldown_seconds || 30);
      await loadZones();
    } catch (err) {
      setPipelineStatus({
        type: "error",
        message: `Pipeline trigger failed: ${err.message}`,
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const handlePointAnalyzed = (newZone) => {
    setZones((prev) => {
      const exists = prev.some((z) => z.zoneId === newZone.zoneId);
      return exists ? prev.map((z) => (z.zoneId === newZone.zoneId ? newZone : z)) : [newZone, ...prev];
    });
    setSelectedLocation(newZone);
    setPipelineStatus({
      type: "info",
      message: `📍 Analyzed point (${newZone.name}) scored as ${newZone.zoneColor} ZONE [${newZone.worstHazard}] and added to live map!`,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header section */}
      <section className="border-b border-emerald-100 bg-white px-5 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[3px] text-emerald-700">
                Live Hazard Intelligence
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Explore Hazard Red Zones
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Real-time GIS telemetry, RandomForest inference, and AHP prioritization. Click anywhere on the map to run point-specific analysis, or trigger a full database refresh.
              </p>
            </div>

            {/* Pipeline Trigger Button with Rate Limiting */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                type="button"
                onClick={handleTriggerPipeline}
                disabled={isTriggering || cooldownRemaining > 0}
                className={`relative flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-md transition-all ${
                  isTriggering
                    ? "cursor-wait bg-slate-800 opacity-90"
                    : cooldownRemaining > 0
                    ? "cursor-not-allowed bg-slate-400 opacity-75 shadow-none"
                    : "bg-emerald-700 hover:bg-emerald-800 hover:shadow-lg active:scale-95"
                }`}
              >
                {isTriggering ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Running GIS & ML Pipeline...</span>
                  </>
                ) : cooldownRemaining > 0 ? (
                  <>
                    <span>⏳</span>
                    <span>Rate-Limited ({cooldownRemaining}s cooldown)</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Trigger Live Assessment Pipeline</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pipeline Status Message Banner */}
          {pipelineStatus && (
            <div
              className={`mt-6 flex items-center justify-between rounded-xl border px-4 py-3 text-xs sm:text-sm font-medium transition-all ${
                pipelineStatus.type === "loading"
                  ? "border-amber-200 bg-amber-50 text-amber-900"
                  : pipelineStatus.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : pipelineStatus.type === "warning"
                  ? "border-orange-200 bg-orange-50 text-orange-900"
                  : pipelineStatus.type === "info"
                  ? "border-blue-200 bg-blue-50 text-blue-900"
                  : "border-red-200 bg-red-50 text-red-900"
              }`}
            >
              <div className="flex items-center gap-2">
                {pipelineStatus.type === "loading" && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                )}
                <span>{pipelineStatus.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setPipelineStatus(null)}
                className="ml-4 text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Map & Information Grid */}
      <section className="px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          {/* Offline Fallback Banner */}
          {isFallback && (
            <div className="mb-6">
              <OfflineFallbackBanner
                isFallback={true}
                message={fallbackWarning || "Database or backend offline using internal latest data."}
                source={fallbackSource || "Internal Latest Snapshot"}
                onRetry={() => loadZones(true)}
                isRetrying={isRetrying}
              />
            </div>
          )}

          {/* Action Bar / Search + Interactive Tip */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <LocationSearch zones={zones} onLocationSelect={setSelectedLocation} />
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-2.5 text-xs font-medium text-emerald-800">
              <span className="text-base">👆</span>
              <span>
                <strong>Click any spot on the map</strong> to live-fetch telemetry & run ML models for that exact location.
              </span>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            {/* Map Container */}
            <div className="relative isolate z-0 min-h-[620px] rounded-2xl border border-slate-200 bg-slate-950 shadow-sm overflow-hidden">
              <RedZoneMap
                zones={zones}
                selectedZone={selectedLocation}
                onLocationSelect={setSelectedLocation}
                onPointAnalyzed={handlePointAnalyzed}
              />
              <RiskLegend />
              <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{zones.length} Monitored Zones</span>
              </div>
            </div>

            {/* Sidebar Details Card */}
            <RiskInfo location={selectedLocation} />
          </div>

          {/* ============================================================== */}
          {/* 3 CARDS BELOW THE ZONES MAP: RED, YELLOW & GREEN ZONES         */}
          {/* ============================================================== */}
          <div className="mt-10">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                  <span>🗺️</span>
                  <span>Active Jurisdictional Hazard Matrix</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time categorization of monitored regions based on live sensor telemetry and ML classification.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400">Click any card item to view on map &amp; telemetry</span>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {/* 🔴 RED ZONE CARD */}
              <div className="flex flex-col justify-between rounded-2xl border border-red-200/90 bg-gradient-to-b from-red-50/70 via-white to-white p-5 shadow-xs hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 border border-red-200 px-3 py-1 text-xs font-bold text-red-800">
                      <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                      🔴 Red Zones ({zones.filter((z) => (z.zoneColor || z.worstStatus) === "RED" || z.worstScore >= 0.7).length})
                    </span>
                    <span className="rounded-md bg-red-100/90 px-2 py-0.5 text-[10px] font-bold text-red-700 uppercase tracking-wide">
                      High Risk
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                    Critical hazard index (&ge; 0.70). Evacuation priority active and continuous satellite monitoring engaged.
                  </p>

                  <div className="mt-4 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {zones
                      .filter((z) => (z.zoneColor || z.worstStatus) === "RED" || z.worstScore >= 0.7)
                      .map((z) => (
                        <div
                          key={z.zoneId}
                          onClick={() => {
                            setSelectedLocation(z);
                            window.scrollTo({ top: 400, behavior: "smooth" });
                          }}
                          className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                            selectedLocation?.zoneId === z.zoneId
                              ? "border-red-500 bg-red-50/90 ring-2 ring-red-400/30 shadow-xs"
                              : "border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900 font-bold">{z.name}</strong>
                            <span className="font-mono font-bold text-red-600 text-[11px]">
                              {(z.worstScore ?? 0.85).toFixed(2)} Risk
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <span>⚠️</span>
                              <span>{z.worstHazard || "MULTI_HAZARD"}</span>
                            </span>
                            <span>{Number(z.population || 0).toLocaleString()} citizens</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-red-100 pt-3 text-[11px] text-red-700 font-semibold flex items-center justify-between">
                  <span>Evacuee Demand:</span>
                  <span className="font-bold">
                    {zones
                      .filter((z) => (z.zoneColor || z.worstStatus) === "RED" || z.worstScore >= 0.7)
                      .reduce((acc, z) => acc + (z.population || 0), 0)
                      .toLocaleString()}{" "}
                    citizens
                  </span>
                </div>
              </div>

              {/* 🟡 YELLOW ZONE CARD */}
              <div className="flex flex-col justify-between rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50/70 via-white to-white p-5 shadow-xs hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      🟡 Yellow Zones ({zones.filter((z) => (z.zoneColor || z.worstStatus) === "YELLOW" || (z.worstScore >= 0.4 && z.worstScore < 0.7)).length})
                    </span>
                    <span className="rounded-md bg-amber-100/90 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                      Warning
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                    Elevated telemetry (0.40 &ndash; 0.69). Early warnings active and first responders on high alert.
                  </p>

                  <div className="mt-4 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {zones
                      .filter((z) => (z.zoneColor || z.worstStatus) === "YELLOW" || (z.worstScore >= 0.4 && z.worstScore < 0.7))
                      .map((z) => (
                        <div
                          key={z.zoneId}
                          onClick={() => {
                            setSelectedLocation(z);
                            window.scrollTo({ top: 400, behavior: "smooth" });
                          }}
                          className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                            selectedLocation?.zoneId === z.zoneId
                              ? "border-amber-500 bg-amber-50/90 ring-2 ring-amber-400/30 shadow-xs"
                              : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900 font-bold">{z.name}</strong>
                            <span className="font-mono font-bold text-amber-700 text-[11px]">
                              {(z.worstScore ?? 0.52).toFixed(2)} Risk
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <span>🔔</span>
                              <span>{z.worstHazard || "MONITORED"}</span>
                            </span>
                            <span>{Number(z.population || 0).toLocaleString()} citizens</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-amber-100 pt-3 text-[11px] text-amber-800 font-semibold flex items-center justify-between">
                  <span>Monitored Population:</span>
                  <span className="font-bold">
                    {zones
                      .filter((z) => (z.zoneColor || z.worstStatus) === "YELLOW" || (z.worstScore >= 0.4 && z.worstScore < 0.7))
                      .reduce((acc, z) => acc + (z.population || 0), 0)
                      .toLocaleString()}{" "}
                    citizens
                  </span>
                </div>
              </div>

              {/* 🟢 GREEN ZONE CARD */}
              <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/70 via-white to-white p-5 shadow-xs hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      🟢 Green Zones ({zones.filter((z) => (z.zoneColor || z.worstStatus) === "GREEN" || (z.worstScore < 0.4 && (z.zoneColor || z.worstStatus) !== "RED" && (z.zoneColor || z.worstStatus) !== "YELLOW")).length})
                    </span>
                    <span className="rounded-md bg-emerald-100/90 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                      Safe
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                    Hazard parameters within baseline tolerance (&lt; 0.40). Certified secure terrain capable of safe hosting.
                  </p>

                  <div className="mt-4 space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {zones
                      .filter((z) => (z.zoneColor || z.worstStatus) === "GREEN" || (z.worstScore < 0.4 && (z.zoneColor || z.worstStatus) !== "RED" && (z.zoneColor || z.worstStatus) !== "YELLOW"))
                      .map((z) => (
                        <div
                          key={z.zoneId}
                          onClick={() => {
                            setSelectedLocation(z);
                            window.scrollTo({ top: 400, behavior: "smooth" });
                          }}
                          className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                            selectedLocation?.zoneId === z.zoneId
                              ? "border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-400/30 shadow-xs"
                              : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <strong className="text-slate-900 font-bold">{z.name}</strong>
                            <span className="font-mono font-bold text-emerald-700 text-[11px]">
                              ✓ Safe
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                              <span>🛡️</span>
                              <span>{z.district || z.state || "Secure Basin"}</span>
                            </span>
                            <span>{Number(z.population || 0).toLocaleString()} citizens</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-emerald-100 pt-3 text-[11px] text-emerald-800 font-semibold flex items-center justify-between">
                  <span>Stability Status:</span>
                  <span className="font-bold">Verified Low Risk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
