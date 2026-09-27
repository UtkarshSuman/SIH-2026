"use client";

import { useState, useEffect } from "react";
import { X, ShieldAlert, AlertTriangle, CheckCircle2, Loader2, Save } from "lucide-react";
import { updateZoneStatus } from "@/services/admin/dashboardservice";

export default function ZoneManagementModal({
  zones = [],
  initialZone = null,
  isOpen = false,
  onClose,
  onZoneUpdated,
  onNotify,
}) {
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [zoneColor, setZoneColor] = useState("RED");
  const [isRedZone, setIsRedZone] = useState(true);
  const [worstHazard, setWorstHazard] = useState("LANDSLIDE");
  const [population, setPopulation] = useState(0);
  const [priority, setPriority] = useState("IMMEDIATE");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (initialZone) {
      setSelectedZoneId(initialZone.zoneId || initialZone.id);
    } else if (zones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(zones[0].zoneId || zones[0].id);
    }
  }, [initialZone, zones]);

  useEffect(() => {
    const current = zones.find((z) => (z.zoneId || z.id) === selectedZoneId);
    if (current) {
      setZoneColor(current.zoneColor || (current.riskLevel === "High" ? "RED" : current.riskLevel === "Moderate" ? "YELLOW" : "GREEN"));
      setIsRedZone(current.isRedZone ?? (current.zoneColor === "RED" || current.riskLevel === "High"));
      setWorstHazard(current.worstHazard || (current.hazardType ? current.hazardType.toUpperCase() : "LANDSLIDE"));
      setPopulation(current.population ?? current.affectedPeople ?? 0);
      setPriority(current.priority || "IMMEDIATE");
      setFeedback(null);
    }
  }, [selectedZoneId, zones]);

  if (!isOpen) return null;

  const currentZone = zones.find((z) => (z.zoneId || z.id) === selectedZoneId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedZoneId) return;

    try {
      setIsSaving(true);
      setFeedback(null);

      const zoneName = currentZone?.name || selectedZoneId;

      onNotify?.({
        type: "loading",
        text: `Applying changes to database: Updating hazard alert level and population for ${zoneName}...`,
      });

      const updates = {
        zoneColor,
        isRedZone,
        worstHazard,
        population: Number(population),
        priority,
      };

      const result = await updateZoneStatus(selectedZoneId, updates);

      setFeedback({
        type: "success",
        message: `✓ Successfully saved to database: ${zoneName} is now set to ${zoneColor} tier with ${Number(population).toLocaleString()} affected people.`,
      });

      onNotify?.({
        type: "success",
        text: `✓ Emergency status & metrics for ${zoneName} successfully updated in PostgreSQL database!`,
      });

      onZoneUpdated?.(result.zone || { zoneId: selectedZoneId, ...updates });
    } catch (err) {
      const errMsg = err.message || "Failed to update zone in database";
      setFeedback({
        type: "error",
        message: `❌ ${errMsg}`,
      });
      onNotify?.({
        type: "error",
        text: `❌ Error updating zone: ${errMsg}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-400" />
            <div>
              <h3 className="font-bold text-white">Zone Hazard & Emergency Control</h3>
              <p className="text-xs text-slate-300">Live PostgreSQL Database Override</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Status Feedback */}
          {feedback && (
            <div
              className={`flex items-start gap-2.5 rounded-lg p-3 text-xs font-medium ${
                feedback.type === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Zone Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Select Hazard Zone
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
            >
              {zones.map((z) => (
                <option key={z.zoneId || z.id} value={z.zoneId || z.id}>
                  {z.name} ({z.district}, {z.state})
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level / Zone Color */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setZoneColor("RED");
                setIsRedZone(true);
              }}
              className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-xs font-bold transition ${
                zoneColor === "RED"
                  ? "border-red-500 bg-red-50 text-red-700 shadow-sm ring-2 ring-red-400"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 mb-1" />
              RED (Critical)
            </button>

            <button
              type="button"
              onClick={() => {
                setZoneColor("YELLOW");
                setIsRedZone(false);
              }}
              className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-xs font-bold transition ${
                zoneColor === "YELLOW"
                  ? "border-amber-500 bg-amber-50 text-amber-700 shadow-sm ring-2 ring-amber-400"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400 mb-1" />
              YELLOW (Alert)
            </button>

            <button
              type="button"
              onClick={() => {
                setZoneColor("GREEN");
                setIsRedZone(false);
              }}
              className={`flex flex-col items-center justify-center rounded-lg border p-2.5 text-xs font-bold transition ${
                zoneColor === "GREEN"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm ring-2 ring-emerald-400"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-green-500 mb-1" />
              GREEN (Normal)
            </button>
          </div>

          {/* Primary Hazard Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Primary Hazard Type
            </label>
            <select
              value={worstHazard}
              onChange={(e) => setWorstHazard(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="LANDSLIDE">Landslide Hazard</option>
              <option value="FLOOD">Flash Flood Hazard</option>
              <option value="EROSION">Bank Erosion Hazard</option>
              <option value="CLOUDBURST">Cloudburst Hazard</option>
            </select>
          </div>

          {/* Affected Population */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Affected Population Requiring Evacuation
            </label>
            <input
              type="number"
              min="0"
              value={population}
              onChange={(e) => setPopulation(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Priority Level */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Evacuation Priority Level
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500"
            >
              <option value="IMMEDIATE">IMMEDIATE (Evacuation in progress)</option>
              <option value="SHORT_TERM">SHORT_TERM (Within 24 hours)</option>
              <option value="MEDIUM_TERM">MEDIUM_TERM (Precautionary)</option>
              <option value="NONE">NONE (Stable)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying to Database...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Apply Changes to Database
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
