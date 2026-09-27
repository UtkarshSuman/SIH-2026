"use client";

import { Users, Plus, Minus, X, Save, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export default function Relocationpopulation({
  sites = [],
  onClose,
  onPopulationUpdated,
  onNotify,
}) {
  const [localSites, setLocalSites] = useState(sites);
  const [manualValues, setManualValues] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [statusFeedback, setStatusFeedback] = useState(null); // { type: "loading" | "success" | "error", message: string }

  useEffect(() => {
    if (sites && sites.length > 0) {
      setLocalSites(sites);
    }
  }, [sites]);

  function changePopulation(id, amount) {
    setLocalSites((previous) =>
      previous.map((site) => {
        if (site.id !== id) {
          return site;
        }

        return {
          ...site,
          population: Math.max(0, site.population + amount),
        };
      }),
    );
  }

  function handleManualValue(id, value) {
    setManualValues((previous) => ({
      ...previous,
      [id]: value,
    }));
  }

  function addManualPopulation(id) {
    const value = Number(manualValues[id] || 0);
    if (!Number.isFinite(value) || value <= 0) return;
    changePopulation(id, value);
    setManualValues((previous) => ({ ...previous, [id]: "" }));
  }

  function removeManualPopulation(id) {
    const value = Number(manualValues[id] || 0);
    if (!Number.isFinite(value) || value <= 0) return;
    changePopulation(id, -value);
    setManualValues((previous) => ({ ...previous, [id]: "" }));
  }

  async function savePopulation(site) {
    try {
      setSavingId(site.id);
      setStatusFeedback({
        type: "loading",
        message: `Applying changes to database for ${site.name}...`,
      });
      onNotify?.({
        type: "loading",
        text: `Applying changes to database: Updating ${site.name} carrying capacity...`,
      });

      const response = await fetch(
        `/api/admin/relocation-sites/${site.id}/population`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            population: site.population,
            currentOccupancy: site.population,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update population in database");
      }

      const successMsg = `✓ Successfully applied changes to database: ${site.name} capacity updated to ${site.population.toLocaleString()} occupants.`;
      setStatusFeedback({
        type: "success",
        message: successMsg,
      });

      onPopulationUpdated?.(site);
      onNotify?.({
        type: "success",
        text: successMsg,
      });
    } catch (error) {
      console.error("Population update error:", error);
      const errMsg = `❌ Error updating database: ${error.message || "Failed to update"}`;
      setStatusFeedback({
        type: "error",
        message: errMsg,
      });
      onNotify?.({
        type: "error",
        text: errMsg,
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold">
              <Users size={20} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Relocation Site Population & Capacity
              </h3>
              <p className="text-xs text-slate-500">
                Live database synchronizer — adjustments directly update PostgreSQL records.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Feedback Banner inside modal */}
        {statusFeedback && (
          <div
            className={`px-5 py-3 text-xs sm:text-sm font-medium flex items-center justify-between shrink-0 border-b ${
              statusFeedback.type === "loading"
                ? "bg-blue-50 text-blue-900 border-blue-200"
                : statusFeedback.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-red-50 text-red-900 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {statusFeedback.type === "loading" && (
                <Loader2 size={16} className="animate-spin text-blue-600" />
              )}
              {statusFeedback.type === "success" && (
                <CheckCircle2 size={16} className="text-emerald-600" />
              )}
              {statusFeedback.type === "error" && (
                <AlertTriangle size={16} className="text-red-600" />
              )}
              <span>{statusFeedback.message}</span>
            </div>
            {statusFeedback.type !== "loading" && (
              <button
                onClick={() => setStatusFeedback(null)}
                className="text-xs font-bold opacity-60 hover:opacity-100 ml-3"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Sites List */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {localSites.map((site) => {
            const occupancy =
              site.capacity > 0
                ? Math.round((site.population / site.capacity) * 100)
                : 0;
            const isSavingThis = savingId === site.id;

            return (
              <div
                key={site.id}
                className={`rounded-xl border p-4 transition-all ${
                  isSavingThis
                    ? "border-blue-300 bg-blue-50/40 ring-2 ring-blue-100"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {/* Site Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{site.name}</h4>
                    <p className="text-xs text-slate-500">
                      {site.location || `${site.district}, ${site.state}`}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      site.status === "Full" || occupancy >= 100
                        ? "bg-red-100 text-red-700"
                        : occupancy >= 80
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {site.status || (occupancy >= 100 ? "Full" : "Available")}
                  </span>
                </div>

                {/* Adjust Controls */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-slate-100 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => changePopulation(site.id, -100)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                      title="-100 occupants"
                    >
                      <Minus size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => changePopulation(site.id, -10)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                    >
                      -10
                    </button>

                    <span className="min-w-20 text-center font-mono font-bold text-slate-900 text-sm">
                      {site.population.toLocaleString()}
                    </span>

                    <button
                      type="button"
                      onClick={() => changePopulation(site.id, 10)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                    >
                      +10
                    </button>

                    <button
                      type="button"
                      onClick={() => changePopulation(site.id, 100)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                      title="+100 occupants"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Manual input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="Add / Cut"
                      value={manualValues[site.id] || ""}
                      onChange={(e) => handleManualValue(site.id, e.target.value)}
                      className="w-24 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-emerald-500"
                    />

                    <button
                      type="button"
                      onClick={() => addManualPopulation(site.id)}
                      className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      + Add
                    </button>

                    <button
                      type="button"
                      onClick={() => removeManualPopulation(site.id)}
                      className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
                    >
                      − Sub
                    </button>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-500">Live Carrying Capacity</span>
                    <span className="font-semibold text-slate-800">
                      {site.population.toLocaleString()} / {site.capacity.toLocaleString()} ({occupancy}%)
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        occupancy >= 95
                          ? "bg-red-500"
                          : occupancy >= 75
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(occupancy, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Save to database button */}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Remaining: {Math.max(0, site.capacity - site.population).toLocaleString()} slots
                  </span>

                  <button
                    onClick={() => savePopulation(site)}
                    disabled={isSavingThis}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60 shadow-xs"
                  >
                    {isSavingThis ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Applying changes...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Save to Database</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
