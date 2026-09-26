"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RelocationSiteRecord } from "@/lib/database-store";

export default function AdminRelocationSitesPage() {
  const [sites, setSites] = useState<RelocationSiteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSite, setEditingSite] = useState<RelocationSiteRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form state
  const [capacityInput, setCapacityInput] = useState<number>(0);
  const [usableAreaInput, setUsableAreaInput] = useState<number>(0);
  const [currentOccupancyInput, setCurrentOccupancyInput] = useState<number>(0);
  const [statusInput, setStatusInput] = useState<RelocationSiteRecord["status"]>("ACTIVE");
  const [waterSourceInput, setWaterSourceInput] = useState<string>("");
  const [roadRatingInput, setRoadRatingInput] = useState<number>(4);

  // ML Simulation State
  const [simZoneId, setSimZoneId] = useState("Z-UTTARAKHAND-JOSHIMATH-01");
  const [simRainfall, setSimRainfall] = useState(120);
  const [simLandslideScore, setSimLandslideScore] = useState(0.92);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchSites = async () => {
    try {
      const res = await fetch("/api/admin/relocation-sites");
      const data = await res.json();
      if (data.sites) setSites(data.sites);
    } catch (err) {
      console.warn("Failed fetching sites:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleEditClick = (site: RelocationSiteRecord) => {
    setEditingSite(site);
    setCapacityInput(site.capacity);
    setUsableAreaInput(site.usableAreaSqm);
    setCurrentOccupancyInput(site.currentOccupancy);
    setStatusInput(site.status);
    setWaterSourceInput(site.waterSourceType || "");
    setRoadRatingInput(site.roadConnectivityRating || 4);
    setMessage(null);
  };

  const handleUsableAreaChange = (val: number) => {
    setUsableAreaInput(val);
    // Auto-calculate capacity using Sphere standard (45 m²/person)
    setCapacityInput(Math.floor(val / 45));
  };

  const handleSaveSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/relocation-sites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: editingSite.id,
          capacity: capacityInput,
          usableAreaSqm: usableAreaInput,
          currentOccupancy: currentOccupancyInput,
          status: statusInput,
          waterSourceType: waterSourceInput,
          roadConnectivityRating: roadRatingInput,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          text: `Success: Updated ${editingSite.name} carrying capacity to ${capacityInput.toLocaleString()} beds (Sphere: 45 m²/person). Persisted in database.`,
          type: "success",
        });
        setEditingSite(null);
        await fetchSites();
      } else {
        setMessage({ text: data.error || "Failed to update site", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerMLSimulation = async () => {
    setIsSimulating(true);
    setMessage(null);

    try {
      const res = await fetch("/api/ml/update-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: simZoneId,
          hazardScores: {
            FLOOD: 0.45,
            LANDSLIDE: simLandslideScore,
            EROSION: 0.0,
            CLOUDBURST: 0.81,
          },
          metrics: {
            rainfall_72h_mm: simRainfall,
            soil_saturation_pct: 91.5,
            river_discharge_m3s: 28.4,
          },
          source: "admin_simulation",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          text: `ML Prediction Ingested: Recorded high-risk scores for ${simZoneId}. Zone color updated and new data point added to Analytics time-series!`,
          type: "success",
        });
      } else {
        setMessage({ text: data.error || "Simulation failed", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: "error" });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-800">
      {/* Banner */}
      <section className="border-b border-slate-200 bg-white px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-0.5 text-xs font-bold text-purple-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse" />
                  NDMA Authority Control Panel
                </span>
                <span className="text-xs text-slate-400 font-medium">Database Management</span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Relocation Sites Carrying Capacity Administration
              </h1>
              <p className="mt-1 text-sm text-slate-500 max-w-3xl">
                Directly manage candidate resettlement townships, update Sphere shelter capacities (45 m²/person standard),
                and ingest new ML risk predictions. All updates persist immediately to the database and reflect live on the public Relocation and Zone Map pages.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/relocation"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
              >
                View Public Relocation Page →
              </Link>
              <Link
                href="/analytics"
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors hover:bg-slate-800"
              >
                View Analytics Trends →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
        {/* Status Notification */}
        {message && (
          <div
            className={`mb-6 rounded-xl border p-4 text-xs font-semibold ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.8fr_1fr]">
          {/* Left Column: Relocation Sites Management Table */}
          <div className="flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Registered Candidate Relocation Sites in Database
              </h2>
              <span className="text-xs font-medium text-slate-500">
                {sites.length} Townships Configured
              </span>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white text-xs text-slate-400">
                Reading sites from database store...
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Site Name &amp; Code</th>
                      <th className="px-4 py-3.5">District</th>
                      <th className="px-4 py-3.5">Sphere Capacity</th>
                      <th className="px-4 py-3.5">Occupancy</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {sites.map((site) => {
                      const occupancy = site.occupancyPct || Math.round((site.currentOccupancy / site.capacity) * 100);
                      return (
                        <tr key={site.id} className="transition-colors hover:bg-slate-50/80">
                          <td className="px-4 py-3.5">
                            <strong className="block text-slate-900">{site.name}</strong>
                            <span className="font-mono text-[10px] text-slate-400">{site.siteCode}</span>
                          </td>
                          <td className="px-4 py-3.5 font-medium">{site.district}, {site.state}</td>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-slate-900">{site.capacity.toLocaleString()}</span>
                            <span className="block text-[10px] text-slate-400">{site.usableAreaSqm.toLocaleString()} m² area</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-900">{site.currentOccupancy.toLocaleString()}</span>
                            <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                              <span className="text-slate-500">{occupancy}%</span>
                              <span className="font-bold text-emerald-600">({site.remainingCapacity.toLocaleString()} left)</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              {site.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleEditClick(site)}
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
                            >
                              Edit Capacity
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Edit Modal / Form Drawer */}
            {editingSite && (
              <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/40 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Editing Carrying Capacity: {editingSite.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingSite(null)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    ✕ Cancel
                  </button>
                </div>

                <form onSubmit={handleSaveSite} className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Usable Land Area (m²)
                    </label>
                    <input
                      type="number"
                      value={usableAreaInput}
                      onChange={(e) => handleUsableAreaChange(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                      required
                    />
                    <span className="mt-1 block text-[10px] text-slate-500">
                      Auto-computes Sphere capacity at 45 m² per person
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Sphere Carrying Capacity (Persons)
                    </label>
                    <input
                      type="number"
                      value={capacityInput}
                      onChange={(e) => setCapacityInput(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Current Occupancy (Persons)
                    </label>
                    <input
                      type="number"
                      value={currentOccupancyInput}
                      onChange={(e) => setCurrentOccupancyInput(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Township Operational Status
                    </label>
                    <select
                      value={statusInput}
                      onChange={(e) => setStatusInput(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PLANNED">PLANNED</option>
                      <option value="FULL">FULL</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Water Source Infrastructure
                    </label>
                    <input
                      type="text"
                      value={waterSourceInput}
                      onChange={(e) => setWaterSourceInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingSite(null)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="rounded-xl bg-emerald-700 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-800 disabled:opacity-50"
                    >
                      {isSaving ? "Saving to Database..." : "Commit Capacity to Database ✓"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Live ML Prediction Simulator */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  ⚡
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  ML Prediction Ingestion &amp; Change Simulator
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Test the pipeline by simulating incoming ML risk scores. This persists directly to the database,
                appends to the Analytics time-series, and auto-updates the live Zone Map!
              </p>

              <div className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700">Target Habitation Zone:</label>
                  <select
                    value={simZoneId}
                    onChange={(e) => setSimZoneId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium text-slate-800"
                  >
                    <option value="Z-UTTARAKHAND-JOSHIMATH-01">Joshimath, Uttarakhand</option>
                    <option value="Z-KERALA-WAYANAD-01">Wayanad, Kerala</option>
                    <option value="Z-BIHAR-PATNA-01">Patna, Bihar</option>
                    <option value="Z-ASSAM-GUWAHATI-01">Guwahati, Assam</option>
                    <option value="Z-ODISHA-PURI-01">Puri, Odisha</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Simulated Rainfall 72h:</span>
                    <span className="text-blue-600 font-bold">{simRainfall} mm</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="350"
                    value={simRainfall}
                    onChange={(e) => setSimRainfall(Number(e.target.value))}
                    className="mt-1 w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-semibold text-slate-700">
                    <span>Simulated Landslide Hazard Score:</span>
                    <span className="text-red-600 font-bold">{simLandslideScore.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.02"
                    value={simLandslideScore}
                    onChange={(e) => setSimLandslideScore(Number(e.target.value))}
                    className="mt-1 w-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTriggerMLSimulation}
                  disabled={isSimulating}
                  className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSimulating ? "Ingesting to Database..." : "Publish ML Scores to Database →"}
                </button>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-600">
              <h4 className="font-bold text-slate-800">Dynamic Synchronization Flow</h4>
              <ul className="mt-2 space-y-1.5 list-disc list-inside">
                <li>Zone Map reads <code>/api/zones</code> from database store</li>
                <li>Relocation Page reads <code>/api/v1/relocation/sites</code></li>
                <li>Analytics Page reads <code>/api/analytics</code> history log</li>
                <li>Auto-refreshes every 5 seconds on new database version</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
