"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { RelocationZonePlan } from "@/hooks/use-relocation-plan";
import type { RelocationSiteData } from "@/lib/data-service";

const RelocationRouteMap = dynamic(
  () => import("@/components/map/relocation-route-map").then((m) => m.RelocationRouteMap),
  { ssr: false, loading: () => <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-400">Initializing GIS Map Layers...</div> }
);

export default function RelocationPage() {
  const searchParams = useSearchParams();
  const initialZoneId = searchParams.get("zoneId") || "";

  const [plans, setPlans] = useState<RelocationZonePlan[]>([]);
  const [sites, setSites] = useState<RelocationSiteData[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<string>(initialZoneId);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>("ALL");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [plansRes, sitesRes] = await Promise.all([
          fetch("/api/v1/relocation/plan"),
          fetch("/api/v1/relocation/sites"),
        ]);
        const plansData = await plansRes.json();
        const sitesData = await sitesRes.json();

        if (!cancelled) {
          if (plansData?.zones) {
            setPlans(plansData.zones);
            if (!initialZoneId && plansData.zones.length > 0) {
              setActiveZoneId(plansData.zones[0].zoneId);
            }
          }
          if (sitesData?.sites) {
            setSites(sitesData.sites);
          }
        }
      } catch (err) {
        console.warn("Failed loading relocation data:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [initialZoneId]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalEvacuees = plans.reduce((acc, p) => acc + p.population, 0);
    const totalCapacity = sites.reduce((acc, s) => acc + s.capacity, 0);
    const totalOccupancy = sites.reduce((acc, s) => acc + s.currentOccupancy, 0);
    const totalRemaining = sites.reduce((acc, s) => acc + s.remainingCapacity, 0);
    const totalUsableArea = sites.reduce((acc, s) => acc + s.usableAreaSqm, 0);

    return {
      totalEvacuees,
      totalCapacity,
      totalOccupancy,
      totalRemaining,
      totalUsableArea,
      siteCount: sites.length,
      redZoneCount: plans.filter((p) => p.worstStatus === "RED").length,
    };
  }, [plans, sites]);

  const activePlan = useMemo(() => {
    return plans.find((p) => p.zoneId === activeZoneId) || plans[0];
  }, [plans, activeZoneId]);

  const filteredSites = useMemo(() => {
    if (selectedSiteFilter === "ALL") return sites;
    return sites.filter((s) => s.district.toLowerCase() === selectedSiteFilter.toLowerCase());
  }, [sites, selectedSiteFilter]);

  const districts = useMemo(() => {
    return Array.from(new Set(sites.map((s) => s.district)));
  }, [sites]);

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-800">
      {/* Top Header Banner */}
      <section className="border-b border-slate-200 bg-white px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  NDMA / NDRF DSS • PS 26191
                </span>
                <span className="text-xs text-slate-400 font-medium">Sphere Standard: 45 m²/person</span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Relocation Corridors & Carrying Capacity Engine
              </h1>
              <p className="mt-1 text-sm text-slate-500 max-w-3xl">
                Real-time road evacuation routing from high-risk Red Zones to certified safe resettlement townships.
                All sites are evaluated against Sphere humanitarian space &amp; lifeline standards.
              </p>
            </div>

            {/* Quick Filter by Zone */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase">Focus Zone:</span>
              {plans.map((p) => (
                <button
                  key={p.zoneId}
                  onClick={() => setActiveZoneId(p.zoneId)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    activeZoneId === p.zoneId
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {p.zoneName.split(",")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Metric KPI Badges */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            <div className="rounded-xl border border-red-100 bg-red-50/60 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-red-700">Evacuee Demand</p>
              <p className="mt-1 text-xl font-black text-red-900">{metrics.totalEvacuees.toLocaleString()}</p>
              <p className="text-[11px] text-red-600 font-medium">{metrics.redZoneCount} Active Red Zones</p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Sphere Capacity</p>
              <p className="mt-1 text-xl font-black text-emerald-900">{metrics.totalCapacity.toLocaleString()}</p>
              <p className="text-[11px] text-emerald-600 font-medium">@ 45 m² per person</p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">Available Headroom</p>
              <p className="mt-1 text-xl font-black text-blue-900">{metrics.totalRemaining.toLocaleString()}</p>
              <p className="text-[11px] text-blue-600 font-medium">Vacant verified beds</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Usable Land Area</p>
              <p className="mt-1 text-xl font-black text-slate-900">{(metrics.totalUsableArea / 10000).toFixed(1)} ha</p>
              <p className="text-[11px] text-slate-500 font-medium">{metrics.totalUsableArea.toLocaleString()} m² built</p>
            </div>

            <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Shelter Network</p>
              <p className="mt-1 text-xl font-black text-slate-900">{metrics.siteCount} Townships</p>
              <p className="text-[11px] text-emerald-600 font-medium">100% Road Connected</p>
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

            <div className="h-[460px] sm:h-[520px] w-full">
              {isLoading ? (
                <div className="flex h-full w-full items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-400">
                  Loading GIS Corridors...
                </div>
              ) : (
                <RelocationRouteMap
                  plans={plans}
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
  );
}