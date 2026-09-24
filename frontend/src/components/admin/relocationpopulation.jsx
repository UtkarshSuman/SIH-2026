"use client";

import { Users, Plus, Minus, X, Save, Loader2 } from "lucide-react";

import { useState } from "react";

export default function Relocationpopulation({
  sites = [],
  onClose,
  onPopulationUpdated,
}) {
  const [localSites, setLocalSites] = useState(sites);

  const [manualValues, setManualValues] = useState({});

  const [savingId, setSavingId] = useState(null);

  const [message, setMessage] = useState("");

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

    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    changePopulation(id, value);

    setManualValues((previous) => ({
      ...previous,
      [id]: "",
    }));
  }

  function removeManualPopulation(id) {
    const value = Number(manualValues[id] || 0);

    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    changePopulation(id, -value);

    setManualValues((previous) => ({
      ...previous,
      [id]: "",
    }));
  }

  async function savePopulation(site) {
    try {
      setSavingId(site.id);
      setMessage("");

      const response = await fetch(
        `/api/admin/relocation-sites/${site.id}/population`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            population: site.population,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update population");
      }

      setMessage(`${site.name} population updated successfully.`);

      onPopulationUpdated?.(site);
    } catch (error) {
      console.error("Population update error:", error);

      setMessage("Failed to update population.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Users size={21} className="text-blue-600" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#0b1838]">
                Relocation Site Population
              </h3>

              <p className="text-sm text-slate-500">
                Update population using + / − or manual adjustment.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sites */}

        <div className="max-h-[65vh] space-y-3 overflow-y-auto p-5">
          {localSites.map((site) => {
            const occupancy =
              site.capacity > 0
                ? Math.round((site.population / site.capacity) * 100)
                : 0;

            return (
              <div
                key={site.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                {/* Site Header */}

                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800">
                      {site.name}
                    </h4>

                    <p className="mt-1 text-xs text-slate-500">
                      {site.location}
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    {site.status}
                  </span>
                </div>

                {/* Population */}

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Current Population</p>

                    <p className="mt-1 text-2xl font-bold text-[#0b1838]">
                      {site.population.toLocaleString()}
                    </p>
                  </div>

                  {/* + / - */}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changePopulation(site.id, -1)}
                      disabled={site.population <= 0}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      title="Decrease by 1"
                    >
                      <Minus size={18} />
                    </button>

                    <button
                      onClick={() => changePopulation(site.id, 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 text-white transition hover:bg-emerald-800"
                      title="Increase by 1"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* =================================
                    MANUAL ADJUSTMENT
                ================================== */}

                <div className="mt-4 rounded-lg bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-slate-600">
                    Manual Population Adjustment
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={manualValues[site.id] || ""}
                      onChange={(event) =>
                        handleManualValue(site.id, event.target.value)
                      }
                      placeholder="e.g. 100"
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />

                    <button
                      onClick={() => addManualPopulation(site.id)}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      + Add
                    </button>

                    <button
                      onClick={() => removeManualPopulation(site.id)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      − Remove
                    </button>
                  </div>
                </div>

                {/* Capacity */}

                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-500">Occupancy</span>

                    <span className="font-medium text-slate-700">
                      {site.population.toLocaleString()} /{" "}
                      {site.capacity.toLocaleString()}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        occupancy >= 90
                          ? "bg-red-500"
                          : occupancy >= 70
                            ? "bg-yellow-500"
                            : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(occupancy, 100)}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-right text-xs text-slate-500">
                    {occupancy}% occupied
                  </p>
                </div>

                {/* Save */}

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => savePopulation(site)}
                    disabled={savingId === site.id}
                    className="flex items-center gap-2 rounded-lg bg-[#0b1838] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#14244d] disabled:opacity-60"
                  >
                    {savingId === site.id ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message */}

        {message && (
          <div className="border-t border-slate-200 px-5 py-3">
            <p className="text-sm text-emerald-700">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
