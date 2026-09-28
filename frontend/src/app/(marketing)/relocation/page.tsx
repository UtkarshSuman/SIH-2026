"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { RelocationZonePlan } from "@/hooks/use-relocation-plan";
import type { RelocationSiteData } from "@/lib/data-service";
import Navbar from "@/components/marketing/navbar";
import { OfflineFallbackBanner } from "@/components/ui/offline-fallback-banner";
import { PipelineTriggerButton } from "@/components/common/pipeline-trigger-button";

const RelocationRouteMap = dynamic(
  () => import("@/components/map/relocation-route-map").then((m) => m.RelocationRouteMap),
  { ssr: false, loading: () => <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-400">Initializing GIS Map Layers...</div> }
);

function RelocationContent() {
  const searchParams = useSearchParams();
  const initialZoneId = searchParams.get("zoneId") || "";

  const [plans, setPlans] = useState<RelocationZonePlan[]>([]);
  const [sites, setSites] = useState<RelocationSiteData[]>([]);
  const [zonesList, setZonesList] = useState<any[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<string>(initialZoneId);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>("ALL");
  const [lastVersion, setLastVersion] = useState(0);
  const [isFallback, setIsFallback] = useState(false);
  const [fallbackWarning, setFallbackWarning] = useState("");
  const [zoneFilterTab, setZoneFilterTab] = useState<"ALL" | "RED" | "YELLOW">("ALL");

  const loadData = async () => {
    try {
      const [plansRes, sitesRes, zonesRes] = await Promise.all([
        fetch("/api/v1/relocation/plan"),
        fetch("/api/v1/relocation/sites"),
        fetch("/api/zones").catch(() => null),
      ]);
      const [plansData, sitesData, zonesData] = await Promise.all([
        plansRes.json().catch(() => null),
        sitesRes.json().catch(() => null),
        zonesRes && zonesRes.ok ? zonesRes.json().catch(() => null) : null,
      ]);

      if (!plansRes.ok || !sitesRes.ok) {
        throw new Error(plansData?.error || sitesData?.error || "Unable to load relocation data from the database");
      }

      if (plansData?.zones) {
        setPlans(plansData.zones);
        setActiveZoneId((prev) => {
          if (prev) return prev;
          if (initialZoneId) return initialZoneId;
          return plansData.zones[0]?.zoneId || "";
        });
      }
      if (sitesData?.sites) {
        setSites(sitesData.sites);
      }
      if (Array.isArray(zonesData)) {
        setZonesList(zonesData);
      }

      const isFb = Boolean(
        plansData?.isFallback ||
        sitesData?.isFallback ||
        plansRes.headers.get("x-is-fallback") === "true" ||
        sitesRes.headers.get("x-is-fallback") === "true"
      );
      setIsFallback(isFb);
      if (isFb) {
        setFallbackWarning(
          plansData?.warning ||
          sitesData?.warning ||
          plansRes.headers.get("x-fallback-warning") ||
          sitesRes.headers.get("x-fallback-warning") ||
          "Database or backend offline using internal latest data."
        );
      }
      setLoadError("");
    } catch (err) {
      console.warn("Failed loading relocation data:", err);
      setLoadError(err instanceof Error ? err.message : "Unable to load relocation data from the database");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialZoneId]);

  // Real-time auto-update: poll /api/version every 4s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/version");
        const ver = await res.json();
        if (ver?.version && ver.version !== lastVersion) {
          setLastVersion(ver.version);
          await loadData();
        }
      } catch {
        // quiet ignore
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [lastVersion]);

  const redAreas = useMemo(() => {
    if (zonesList.length > 0) {
      return zonesList.filter((z) => (z.zoneColor || z.worstStatus) === "RED" || z.worstScore >= 0.7);
    }
    return plans
      .filter((p) => p.worstStatus === "RED")
      .map((p) => ({
        zoneId: p.zoneId,
        name: p.zoneName,
        worstHazard: p.hazardType,
        worstScore: p.priorityScore ?? 0.88,
        population: p.population,
        district: p.zoneName.split(",")[1]?.trim() || "Critical Sector",
      }));
  }, [zonesList, plans]);

  const yellowAreas = useMemo(() => {
    if (zonesList.length > 0) {
      return zonesList.filter(
        (z) => (z.zoneColor || z.worstStatus) === "YELLOW" || (z.worstScore >= 0.4 && z.worstScore < 0.7)
      );
    }
    return plans
      .filter((p) => p.worstStatus === "YELLOW")
      .map((p) => ({
        zoneId: p.zoneId,
        name: p.zoneName,
        worstHazard: p.hazardType,
        worstScore: p.priorityScore ?? 0.52,
        population: p.population,
        district: p.zoneName.split(",")[1]?.trim() || "Warning Sector",
      }));
  }, [zonesList, plans]);

  const greenAreas = useMemo(() => {
    if (zonesList.length > 0) {
      const greens = zonesList.filter(
        (z) =>
          (z.zoneColor || z.worstStatus) === "GREEN" ||
          (z.worstScore < 0.4 && (z.zoneColor || z.worstStatus) !== "RED" && (z.zoneColor || z.worstStatus) !== "YELLOW")
      );
      if (greens.length > 0) return greens;
      return [...zonesList].sort((a, b) => (a.worstScore || 0) - (b.worstScore || 0)).slice(0, 3);
    }
    return [];
  }, [zonesList]);

  // Aggregate Metrics: Evacuee Demand = Red + Yellow populations, Sphere Capacity = Green Zones Capacity
  const metrics = useMemo(() => {
    const redPop = redAreas.reduce((acc: number, z: any) => acc + (z.population || 0), 0);
    const yellowPop = yellowAreas.reduce((acc: number, z: any) => acc + (z.population || 0), 0);
    const totalEvacuees = redPop + yellowPop > 0 ? redPop + yellowPop : plans.reduce((acc, p) => acc + p.population, 0);

    const greenCap = greenAreas.reduce((acc: number, z: any) => acc + (z.capacity || z.population || 0), 0);
    const sitesCap = sites.reduce((acc, s) => acc + s.capacity, 0);
    const totalCapacity = greenCap > 0 ? greenCap : sitesCap;

    const totalOccupancy = sites.reduce((acc, s) => acc + s.currentOccupancy, 0);
    const totalRemaining = Math.max(0, totalCapacity - totalEvacuees);
    const totalUsableArea = sites.reduce((acc, s) => acc + s.usableAreaSqm, 0);

    return {
      redPop,
      yellowPop,
      totalEvacuees,
      totalCapacity,
      totalOccupancy,
      totalRemaining,
      totalUsableArea,
      siteCount: sites.length,
      redZoneCount: redAreas.length,
      yellowZoneCount: yellowAreas.length,
      greenZoneCount: greenAreas.length,
    };
  }, [redAreas, yellowAreas, greenAreas, plans, sites]);

  const activePlan = useMemo(() => {
    return plans.find((p) => p.zoneId === activeZoneId) || plans[0];
  }, [plans, activeZoneId]);

  const filteredPlans = useMemo(() => {
    if (zoneFilterTab === "ALL") return plans;
    return plans.filter((p) => p.worstStatus === zoneFilterTab);
  }, [plans, zoneFilterTab]);

  const filteredSites = useMemo(() => {
    if (selectedSiteFilter === "ALL") return sites;
    return sites.filter((s) => s.district.toLowerCase() === selectedSiteFilter.toLowerCase());
  }, [sites, selectedSiteFilter]);

  const districts = useMemo(() => {
    return Array.from(new Set(sites.map((s) => s.district)));
  }, [sites]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <Navbar />

      <main>
        {/* Top Header Banner */}
        <section className="border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-white px-5 py-8 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            {/* Header Title & Trigger */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {isFallback ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-800 shadow-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Offline Cache Mode
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800 shadow-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Live Relocation Engine
                    </span>
                  )}
                  <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {plans.length || 25} Monitored Corridors
                  </span>
                  <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                    Sphere Standard: 45 m²/person
                  </span>
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                  Strategic Relocation &amp; Capacity Command
                </h1>
                <p className="mt-1.5 text-sm text-slate-600 max-w-3xl leading-relaxed">
                  Real-time algorithmic routing from high-vulnerability disaster zones to certified safe resettlement havens. All routes dynamically compute transit times, road status, and humanitarian capacity thresholds.
                </p>
              </div>

              {/* Action Pipeline Trigger */}
              <div className="shrink-0 flex items-center gap-3">
                <PipelineTriggerButton
                  variant="slate"
                  buttonText="⚡ Run Live Assessment"
                  showStatusBanner={false}
                  onSuccess={async () => { await loadData(); }}
                />
              </div>
            </div>

            {/* Offline Fallback Warning Banner */}
            {isFallback && (
              <div className="mt-4">
                <OfflineFallbackBanner
                  isFallback={true}
                  message={fallbackWarning || "Database or backend offline using internal latest data."}
                  source="Internal Latest Snapshot"
                  onRetry={loadData}
                  isRetrying={isLoading}
                />
              </div>
            )}

            {loadError && (
              <p className="mt-4 text-sm font-medium text-red-700">{loadError}</p>
            )}

            {/* Metric KPI Cards (5 Cards) */}
            <div className="mt-6 grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
              {/* Card 1: Evacuee Demand */}
              <div className="group rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50/80 via-white to-red-50/30 p-4 shadow-xs transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Evacuee Demand</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-100 text-xs">🚨</span>
                </div>
                <p className="mt-2 text-2xl font-black text-red-950">{metrics.totalEvacuees.toLocaleString()}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-red-700 font-medium">
                  <span>{metrics.redZoneCount} Red + {metrics.yellowZoneCount} Yellow</span>
                  <span className="rounded-full bg-red-100 px-1.5 py-0.5 font-bold text-[10px]">Active</span>
                </div>
              </div>

              {/* Card 2: Sphere Capacity */}
              <div className="group rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 p-4 shadow-xs transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Sphere Capacity</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-xs">🛡️</span>
                </div>
                <p className="mt-2 text-2xl font-black text-emerald-950">{metrics.totalCapacity.toLocaleString()}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700 font-medium">
                  <span>Certified Standard</span>
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 font-bold text-[10px]">45 m²/person</span>
                </div>
              </div>

              {/* Card 3: Available Headroom */}
              <div className="group rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/80 via-white to-indigo-50/30 p-4 shadow-xs transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Net Buffer</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-xs">⚖️</span>
                </div>
                <p className="mt-2 text-2xl font-black text-indigo-950">{metrics.totalRemaining.toLocaleString()}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-indigo-700 font-medium">
                  <span>Vacant Headroom</span>
                  <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 font-bold text-[10px]">Surplus Safe</span>
                </div>
              </div>

              {/* Card 4: Usable Land Area */}
              <div className="group rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 p-4 shadow-xs transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Usable Land Area</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs">📐</span>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900">{(metrics.totalUsableArea / 10000).toFixed(1)} <span className="text-base font-bold text-slate-500">ha</span></p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>{metrics.totalUsableArea.toLocaleString()} m² built</span>
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-bold text-[10px]">Lifeline Grids</span>
                </div>
              </div>

              {/* Card 5: Shelter Network */}
              <div className="col-span-2 sm:col-span-1 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50/50 p-4 shadow-xs transition-all hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Safe Townships</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-xs">🏛️</span>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900">{metrics.siteCount} <span className="text-base font-bold text-slate-500">Sites</span></p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-emerald-700 font-medium">
                  <span>100% Road Connected</span>
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 font-bold text-[10px]">Verified</span>
                </div>
              </div>
            </div>

            {/* Redesigned Clean Zone Navigation Bar */}
            <div className="mt-7 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                  <button
                    onClick={() => setZoneFilterTab("ALL")}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                      zoneFilterTab === "ALL"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All Corridors ({plans.length})
                  </button>
                  <button
                    onClick={() => setZoneFilterTab("RED")}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      zoneFilterTab === "RED"
                        ? "bg-red-600 text-white shadow-xs"
                        : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/60"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
                    Immediate Evacuation ({metrics.redZoneCount})
                  </button>
                  <button
                    onClick={() => setZoneFilterTab("YELLOW")}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      zoneFilterTab === "YELLOW"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
                    }`}
                  >
                    Planned Transit ({metrics.yellowZoneCount})
                  </button>
                </div>

                {/* Dropdown Quick Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
                    Jump to Zone:
                  </span>
                  <select
                    value={activeZoneId}
                    onChange={(e) => setActiveZoneId(e.target.value)}
                    className="w-full md:w-72 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    {plans.map((p) => (
                      <option key={p.zoneId} value={p.zoneId}>
                        {p.worstStatus === "RED" ? "🔴" : "🟡"} {p.zoneName} ({p.hazardType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clean Horizontal Scrollable Carousel of Filtered Zone Chips */}
              <div className="mt-3.5 flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                {filteredPlans.map((p) => {
                  const isSelected = p.zoneId === activeZoneId;
                  const isRed = p.worstStatus === "RED";
                  return (
                    <button
                      key={p.zoneId}
                      onClick={() => setActiveZoneId(p.zoneId)}
                      className={`group flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                        isSelected
                          ? isRed
                            ? "border-red-500 bg-red-50 text-red-950 ring-2 ring-red-400/30 shadow-xs"
                            : "border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-400/30 shadow-xs"
                          : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-slate-300 hover:bg-white"
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          isRed ? "bg-red-500" : "bg-amber-500"
                        } ${isSelected ? "animate-pulse" : ""}`}
                      />
                      <span className="font-bold">{p.zoneName.split(",")[0]}</span>
                      <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                        {p.hazardType}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
        {/* Map Section */}
        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          {/* Interactive GIS Evacuation Map */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Evacuation Corridors &amp; Safe Destination Map
              </h2>
              <span className="text-xs text-slate-400">Click any marker to inspect</span>
            </div>

            <div className="relative isolate z-0 h-[460px] sm:h-[520px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              {isLoading ? (
                <div className="flex h-full w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
                  Loading GIS Corridors...
                </div>
              ) : (
                <RelocationRouteMap
                  plans={plans}
                  sites={sites}
                  activeZoneId={activeZoneId}
                  onSelectZone={(id) => setActiveZoneId(id)}
                />
              )}
            </div>
          </div>

          {/* Active Habitation Evacuation Manifest */}
          <div className="flex flex-col">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Target Zone Action Manifest
              </h2>
              <span className="text-xs font-semibold text-red-600">Active Relocation Order</span>
            </div>

            {activePlan ? (
              <div className="flex flex-1 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                      <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                      {activePlan.worstStatus} PRIORITY
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Timeline: <strong className="text-slate-800">{activePlan.timeline}</strong>
                    </span>
                  </div>

                  <h3 className="mt-3 text-xl font-extrabold text-slate-900">
                    {activePlan.zoneName}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    Hazard Trigger: <span className="font-semibold text-slate-700">{activePlan.hazardType}</span> | Priority Score:{" "}
                    <span className="font-bold text-red-600">{(activePlan.priorityScore ?? 0.85).toFixed(3)}</span>
                  </p>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>Affected Habitation Size:</span>
                      <span className="text-slate-900">{activePlan.population.toLocaleString()} citizens</span>
                    </div>
                    <div className="mt-1.5 flex justify-between font-semibold text-slate-700">
                      <span>Sphere Capacity Allocated:</span>
                      <span className="text-emerald-700">{activePlan.totalCapacityUsed.toLocaleString()} accommodated</span>
                    </div>
                    {activePlan.shortfall > 0 ? (
                      <div className="mt-1.5 flex justify-between font-semibold text-red-600">
                        <span>Shortfall:</span>
                        <span>{activePlan.shortfall.toLocaleString()} unassigned</span>
                      </div>
                    ) : (
                      <div className="mt-1.5 text-right font-bold text-emerald-600 text-[11px]">
                        ✓ 100% Fully Accommodated in Verified Shelters
                      </div>
                    )}
                  </div>

                  {/* Multi-Site Allocations & Road Routes */}
                  <div className="mt-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Designated Safe Townships &amp; Road Corridors:
                    </p>

                    <div className="mt-2.5 space-y-3">
                      {activePlan.allocations.map((alloc, idx) => (
                        <div
                          key={alloc.siteId}
                          className="rounded-xl border border-slate-200 bg-white p-3.5 transition-all hover:border-blue-300"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              Corridor {idx + 1}: {alloc.siteName}
                            </span>
                            <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                              {alloc.distanceKm} km
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                            <span>Relocation Contribution:</span>
                            <strong className="text-slate-900">{alloc.contribution.toLocaleString()} citizens</strong>
                          </div>

                          <div className="mt-1 text-[11px] text-slate-500">
                            Transit Line: <span className="font-medium text-slate-700">{alloc.timeline}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => alert(`Official NDRF Evacuation Directive generated for ${activePlan.zoneName}. Dispatching convoy routes.`)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700"
                  >
                    Dispatch Evacuation Directive &amp; Transit Convoy →
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* ============================================================== */}
        {/* 3 CARDS: AREAS IN RED, YELLOW AND GREEN ZONES                  */}
        {/* ============================================================== */}
        <section className="mt-10">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>
              <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                <span>🗺️</span>
                <span>Jurisdictional Hazard &amp; Safety Matrix</span>
              </h2>
              <p className="text-xs text-slate-500">
                Live multi-hazard categorization of habitations across Red, Yellow, and Green zones.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Click any card item to focus map</span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {/* 🔴 RED ZONE CARD */}
            <div className="flex flex-col justify-between rounded-2xl border border-red-200/90 bg-gradient-to-b from-red-50/70 via-white to-white p-5 shadow-xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 border border-red-200 px-3 py-1 text-xs font-bold text-red-800">
                    <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                    🔴 Red Zones ({redAreas.length})
                  </span>
                  <span className="rounded-md bg-red-100/90 px-2 py-0.5 text-[10px] font-bold text-red-700 uppercase tracking-wide">
                    Evacuate
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                  Critical risk threshold (Score &ge; 0.70). Immediate evacuation directives and safe corridors dispatched.
                </p>

                <div className="mt-4 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {redAreas.map((area: any) => (
                    <div
                      key={area.zoneId}
                      onClick={() => {
                        setActiveZoneId(area.zoneId);
                        window.scrollTo({ top: 380, behavior: "smooth" });
                      }}
                      className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                        activeZoneId === area.zoneId
                          ? "border-red-500 bg-red-50/90 ring-2 ring-red-400/30 shadow-xs"
                          : "border-slate-200 bg-white hover:border-red-300 hover:bg-red-50/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold">{area.name}</strong>
                        <span className="font-mono font-bold text-red-600 text-[11px]">
                          {(area.worstScore ?? 0.85).toFixed(2)} Risk
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <span>⚠️</span>
                          <span>{area.worstHazard || "MULTI_HAZARD"}</span>
                        </span>
                        <span>{Number(area.population || 0).toLocaleString()} citizens</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 border-t border-red-100 pt-3 text-[11px] text-red-700 font-semibold flex items-center justify-between">
                <span>Total Evacuees:</span>
                <span className="font-bold">{redAreas.reduce((acc: number, z: any) => acc + (z.population || 0), 0).toLocaleString()} citizens</span>
              </div>
            </div>

            {/* 🟡 YELLOW ZONE CARD */}
            <div className="flex flex-col justify-between rounded-2xl border border-amber-200/90 bg-gradient-to-b from-amber-50/70 via-white to-white p-5 shadow-xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    🟡 Yellow Zones ({yellowAreas.length})
                  </span>
                  <span className="rounded-md bg-amber-100/90 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                    Warning
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                  Elevated hazard telemetry (Score 0.40 &ndash; 0.69). Early warning monitoring &amp; standby shelters ready.
                </p>

                <div className="mt-4 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {yellowAreas.map((area: any) => (
                    <div
                      key={area.zoneId}
                      onClick={() => {
                        setActiveZoneId(area.zoneId);
                        window.scrollTo({ top: 380, behavior: "smooth" });
                      }}
                      className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                        activeZoneId === area.zoneId
                          ? "border-amber-500 bg-amber-50/90 ring-2 ring-amber-400/30 shadow-xs"
                          : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold">{area.name}</strong>
                        <span className="font-mono font-bold text-amber-700 text-[11px]">
                          {(area.worstScore ?? 0.52).toFixed(2)} Risk
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <span>🔔</span>
                          <span>{area.worstHazard || "MONITORED"}</span>
                        </span>
                        <span>{Number(area.population || 0).toLocaleString()} citizens</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 border-t border-amber-100 pt-3 text-[11px] text-amber-800 font-semibold flex items-center justify-between">
                <span>Monitored Population:</span>
                <span className="font-bold">{yellowAreas.reduce((acc: number, z: any) => acc + (z.population || 0), 0).toLocaleString()} citizens</span>
              </div>
            </div>

            {/* 🟢 GREEN ZONE CARD */}
            <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/70 via-white to-white p-5 shadow-xs hover:shadow-md transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    🟢 Green Zones ({greenAreas.length})
                  </span>
                  <span className="rounded-md bg-emerald-100/90 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">
                    Safe
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                  Parameters within safe tolerance. Certified low-vulnerability terrain hosting relief shelters.
                </p>

                <div className="mt-4 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {greenAreas.map((area: any) => (
                    <div
                      key={area.zoneId || area.id}
                      className="rounded-xl border border-slate-200 bg-white p-3 text-xs hover:border-emerald-300 hover:bg-emerald-50/20 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 font-bold">{area.name}</strong>
                        <span className="font-mono font-bold text-emerald-700 text-[11px]">
                          ✓ Safe
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <span>🛡️</span>
                          <span>{area.district || area.state || "Secure Area"}</span>
                        </span>
                        <span>{Number(area.population || area.capacity || 0).toLocaleString()} capacity/pop</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 border-t border-emerald-100 pt-3 text-[11px] text-emerald-800 font-semibold flex items-center justify-between">
                <span>Relocation Status:</span>
                <span className="font-bold">Active Receiving Facilities</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Candidate Relocation Sites & Carrying Capacity Cards */}
        <section className="mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Sphere Project Minimum Standards
              </p>
              <h2 className="text-2xl font-black text-slate-900">
                Relocation Township Carrying Capacities
              </h2>
              <p className="text-xs text-slate-500">
                Calculated strictly using humanitarian standard: <strong>45 m² usable shelter area per person</strong>.
              </p>
            </div>

            {/* District Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Filter District:</span>
              <button
                onClick={() => setSelectedSiteFilter("ALL")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                  selectedSiteFilter === "ALL"
                    ? "bg-emerald-700 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                All Districts
              </button>
              {districts.map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedSiteFilter(d)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                    selectedSiteFilter === d
                      ? "bg-emerald-700 text-white"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSites.map((site) => {
              const occupancy = site.occupancyPct || Math.round((site.currentOccupancy / site.capacity) * 100);
              const isHigh = occupancy >= 85;
              const isModerate = occupancy >= 60 && occupancy < 85;

              return (
                <div
                  key={site.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                >
                  <div>
                    {/* Header with Site Code and Status */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-slate-400">{site.siteCode}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {site.status}
                      </span>
                    </div>

                    <h3 className="mt-2 text-lg font-bold text-slate-900">{site.name}</h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {site.district}, {site.state} • Coordinates: {site.lat.toFixed(4)}°N, {site.lng.toFixed(4)}°E
                    </p>

                    {/* Carrying Capacity Gauge */}
                    <div className="mt-5 rounded-xl bg-slate-50 p-4">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Sphere Capacity
                          </p>
                          <p className="text-2xl font-black text-slate-900">
                            {site.capacity.toLocaleString()}
                            <span className="ml-1 text-xs font-medium text-slate-500">persons</span>
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Available Headroom
                          </p>
                          <p className="text-lg font-extrabold text-emerald-700">
                            {site.remainingCapacity.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                          <span>Current Occupancy: {site.currentOccupancy.toLocaleString()}</span>
                          <span>{occupancy}% Filled</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isHigh ? "bg-red-500" : isModerate ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, occupancy)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Area & Standard Breakdown */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-slate-100 p-2.5">
                        <p className="text-[10px] uppercase font-semibold text-slate-400">Total Land Area</p>
                        <p className="mt-0.5 font-bold text-slate-800">{site.totalAreaSqm.toLocaleString()} m²</p>
                      </div>
                      <div className="rounded-lg border border-slate-100 p-2.5">
                        <p className="text-[10px] uppercase font-semibold text-slate-400">Usable Shelter Area</p>
                        <p className="mt-0.5 font-bold text-slate-800">{site.usableAreaSqm.toLocaleString()} m²</p>
                      </div>
                    </div>

                    {/* Lifeline Infrastructure Amenities */}
                    <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 font-bold">💧 Water:</span>
                        <span className="truncate">{site.waterSourceType}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-bold">🛣 Access:</span>
                        <span>Rating {site.roadConnectivityRating}/5 (All-Weather Double Lane)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600 font-bold">🏥 Medical:</span>
                        <span>Emergency Trauma Center within {site.hospitalDistanceKm} km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-600 font-bold">⚡ Power:</span>
                        <span>{site.powerGridStatus ? "33kV Dedicated Substation + Solar Backup" : "Local Diesel Generator"}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      // Filter plans that connect to this site
                      const matchedPlan = plans.find((p) => p.allocations.some((a) => a.siteId === site.id));
                      if (matchedPlan) setActiveZoneId(matchedPlan.zoneId);
                      window.scrollTo({ top: 180, behavior: "smooth" });
                    }}
                    className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    View Inflow Corridors on Map ↑
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      </main>
    </div>
  );
}

export default function RelocationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fbfdfb] flex items-center justify-center text-slate-500 font-sans">
          Loading Evacuation Corridors & Capacity...
        </div>
      }
    >
      <RelocationContent />
    </Suspense>
  );
}
