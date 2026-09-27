"use client";

import { useEffect, useState } from "react";
import { Users, MapPin, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle, Loader2, Edit3, X, Save, ChevronDown, ChevronUp } from "lucide-react";

export default function RelocationPopulationPlanning({ onNotify, onPlanUpdated }) {
  const [plans, setPlans] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingZoneId, setEditingZoneId] = useState(null);
  const [editPopulation, setEditPopulation] = useState({});
  const [savingZoneId, setSavingZoneId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { zoneId, type, message }

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/relocation/plan", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.zones) && json.zones.length > 0) {
          setPlans(json.zones);
          return;
        }
      }
    } catch (err) {
      console.warn("Failed loading dynamic relocation plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleStartEdit = (plan) => {
    setEditingZoneId(plan.zoneId);
    setEditPopulation((prev) => ({
      ...prev,
      [plan.zoneId]: plan.population || 0,
    }));
    setFeedback(null);
  };

  const handleCancelEdit = () => {
    setEditingZoneId(null);
    setFeedback(null);
  };

  const handleSaveQuota = async (plan) => {
    const newPop = Number(editPopulation[plan.zoneId]);
    if (isNaN(newPop) || newPop < 0) {
      setFeedback({
        zoneId: plan.zoneId,
        type: "error",
        message: "Please enter a valid positive number for evacuees.",
      });
      return;
    }

    try {
      setSavingZoneId(plan.zoneId);
      setFeedback(null);

      onNotify?.({
        type: "loading",
        text: `Applying changes to database: Updating evacuee quota for ${plan.zoneName}...`,
      });

      const res = await fetch("/api/admin/zones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId: plan.zoneId,
          population: newPop,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update quota in database");
      }

      setFeedback({
        zoneId: plan.zoneId,
        type: "success",
        message: `✓ Saved! Evacuee quota set to ${newPop.toLocaleString()} in database.`,
      });

      onNotify?.({
        type: "success",
        text: `✓ Evacuee population quota for ${plan.zoneName} updated to ${newPop.toLocaleString()} in PostgreSQL database!`,
      });

      // Update local state immediately
      setPlans((prev) =>
        prev.map((p) =>
          p.zoneId === plan.zoneId
            ? {
                ...p,
                population: newPop,
                shortfall: Math.max(0, newPop - (p.totalCapacityUsed || 0)),
                isFullyAccommodated: (p.totalCapacityUsed || 0) >= newPop,
              }
            : p
        )
      );

      setEditingZoneId(null);
      onPlanUpdated?.();
      loadPlans();
    } catch (err) {
      const errMsg = err.message || "Failed to update quota in database";
      setFeedback({
        zoneId: plan.zoneId,
        type: "error",
        message: errMsg,
      });
      onNotify?.({
        type: "error",
        text: `❌ Error saving quota for ${plan.zoneName}: ${errMsg}`,
      });
    } finally {
      setSavingZoneId(null);
    }
  };

  const displayedPlans = showAll ? plans : plans.slice(0, 6);

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-800">
              Relocation Population Planning
            </h2>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Live DB Sync
            </span>
            {plans.length > 0 && (
              <span className="text-xs font-medium text-slate-400">
                ({displayedPlans.length} of {plans.length} shown)
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Real-time population requiring evacuation and assigned emergency relocation site capacities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {plans.length > 6 && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
            >
              <span>{showAll ? "Show 6 Cards" : `Show All (${plans.length})`}</span>
              {showAll ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 shrink-0">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex h-44 items-center justify-center gap-2 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-sm">Loading dynamic relocation plans from database...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
          No relocation plans currently recorded in the database.
        </div>
      ) : (
        <>
          {/* Population Cards (Limited to 6 by default) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {displayedPlans.map((item) => {
            const isEditing = editingZoneId === item.zoneId;
            const isSaving = savingZoneId === item.zoneId;
            const itemFeedback = feedback?.zoneId === item.zoneId ? feedback : null;

            const primaryAllocation = item.allocations?.[0];
            const shelterName = primaryAllocation?.siteName || "Designated Safe Shelter";
            const shelterCapacity = primaryAllocation?.capacity || 5000;
            const allocated = primaryAllocation?.contribution || item.totalCapacityUsed || item.population;
            const remainingCapacity = shelterCapacity - allocated;

            return (
              <div
                key={item.zoneId}
                className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm"
              >
                <div>
                  {/* Zone Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-800">
                          {item.zoneName}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            item.worstStatus === "RED"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {item.worstStatus === "RED" ? "CRITICAL" : "ALERT"}
                        </span>
                      </div>

                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {item.hazardType} &bull; Zone: {item.zoneId}
                      </p>
                    </div>

                    <MapPin className="h-4 w-4 text-slate-400" />
                  </div>

                  {/* Feedback Banner */}
                  {itemFeedback && (
                    <div
                      className={`mb-3 flex items-start gap-2 rounded-lg p-2.5 text-xs font-medium ${
                        itemFeedback.type === "success"
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border border-red-200 bg-red-50 text-red-800"
                      }`}
                    >
                      {itemFeedback.type === "success" ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
                      )}
                      <span>{itemFeedback.message}</span>
                    </div>
                  )}

                  {/* Population Information */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Affected Evacuees</span>

                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={editPopulation[item.zoneId] ?? item.population}
                            onChange={(e) =>
                              setEditPopulation((prev) => ({
                                ...prev,
                                [item.zoneId]: e.target.value,
                              }))
                            }
                            className="w-24 rounded border border-blue-400 px-2 py-1 text-right text-sm font-bold text-slate-800 outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={isSaving}
                          />
                        </div>
                      ) : (
                        <span className="font-bold text-red-600">
                          {item.population.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Assigned Shelter</span>

                      <span className="max-w-[170px] truncate text-right font-medium text-slate-800" title={shelterName}>
                        {shelterName}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Shelter Sphere Capacity</span>

                      <span className="font-medium text-slate-800">
                        {shelterCapacity.toLocaleString()}
                      </span>
                    </div>

                    <div className="my-2 border-t border-slate-100" />

                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        Evacuee Allocation Status
                      </span>

                      <span
                        className={`font-semibold ${
                          item.isFullyAccommodated
                            ? "text-emerald-600"
                            : "text-amber-600"
                        }`}
                      >
                        {item.isFullyAccommodated ? "Fully Accommodated" : `Shortfall: ${item.shortfall?.toLocaleString() || "0"}`}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Remaining Site Headroom</span>

                      <span
                        className={`font-semibold ${
                          remainingCapacity >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {remainingCapacity.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveQuota(item)}
                        disabled={isSaving}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Applying to DB...
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" />
                            Save Quota to DB
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Adjust Quota in DB
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Expand / Collapse Button */}
        {plans.length > 6 && (
          <div className="mt-6 flex flex-col items-center justify-center gap-2 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="group inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-2.5 text-xs font-bold text-slate-800 shadow-xs hover:border-blue-400 hover:bg-blue-50/70 hover:text-blue-700 transition-all cursor-pointer active:scale-95"
            >
              <span>
                {showAll
                  ? "Collapse Cards (Show 6 Only)"
                  : `View All ${plans.length} Relocation Planning Cards (${plans.length - 6} more)`}
              </span>
              {showAll ? (
                <ChevronUp className="h-4 w-4 text-blue-600 transition-transform group-hover:-translate-y-0.5" />
              ) : (
                <ChevronDown className="h-4 w-4 text-blue-600 transition-transform group-hover:translate-y-0.5" />
              )}
            </button>
            <span className="text-[11px] text-slate-400">
              {showAll
                ? `Showing all ${plans.length} disaster-affected relocation plans`
                : `Showing 6 of ${plans.length} dynamic relocation planning zones`}
            </span>
          </div>
        )}
      </>
      )}
    </section>
  );
}
