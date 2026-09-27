"use client";

import { ArrowUpRight, Route, ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getSafeRoutes, updateRouteStatus } from "@/services/admin/dashboardservice";

function getStatusStyle(status) {
  if (status === "Safe" || status === "CLEAR") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  if (status === "Caution" || status === "CAUTION") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  return "border-red-200 bg-red-50 text-red-800";
}

export default function SafeRelocationRoutes({ onNotify }) {
  const [routes, setRoutes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFeedback, setStatusFeedback] = useState(null); // { type, message }

  const loadRoutes = async () => {
    try {
      setIsLoading(true);
      const data = await getSafeRoutes();
      if (data && Array.isArray(data.routes)) {
        setRoutes(data.routes);
      }
    } catch (err) {
      console.warn("Failed loading dynamic routes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const handleStatusChange = async (route, newStatus) => {
    try {
      setUpdatingId(route.id);
      setStatusFeedback({
        type: "loading",
        message: `Applying changes to database: Updating corridor status for ${route.zoneName || route.zone} to ${newStatus}...`,
      });
      onNotify?.({
        type: "loading",
        text: `Applying changes to database: Updating corridor status to ${newStatus}...`,
      });

      const res = await updateRouteStatus(route.id, route.siteId, newStatus);

      setRoutes((prev) =>
        prev.map((r) =>
          r.id === route.id
            ? {
                ...r,
                status: newStatus,
                routeStatus: newStatus === "Safe" ? "CLEAR" : newStatus === "Caution" ? "CAUTION" : "BLOCKED",
              }
            : r
        )
      );

      const successMsg = `✓ Successfully applied changes to database: ${route.zoneName || route.zone} ➔ ${route.siteName || route.relocationSite} corridor marked as ${newStatus}.`;
      setStatusFeedback({
        type: "success",
        message: successMsg,
      });
      onNotify?.({
        type: "success",
        text: successMsg,
      });
    } catch (err) {
      console.error("Route update failed:", err);
      const errMsg = `❌ Error updating database route: ${err.message}`;
      setStatusFeedback({
        type: "error",
        message: errMsg,
      });
      onNotify?.({
        type: "error",
        text: errMsg,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Safe Evacuation Corridors & Road Connectivity
            </h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
              Live Database
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Real-time status of evacuation corridors connecting red zones to verified safe shelters. Admin changes update PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadRoutes}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            {isLoading ? "Refreshing..." : "↻ Refresh Routes"}
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Route className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* In-Place Status Feedback */}
      {statusFeedback && (
        <div
          className={`mb-4 flex items-center justify-between rounded-xl px-4 py-2.5 text-xs font-medium border ${
            statusFeedback.type === "loading"
              ? "bg-blue-50 border-blue-200 text-blue-900"
              : statusFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusFeedback.type === "loading" && <Loader2 size={14} className="animate-spin text-blue-600" />}
            {statusFeedback.type === "success" && <CheckCircle2 size={14} className="text-emerald-600" />}
            {statusFeedback.type === "error" && <AlertTriangle size={14} className="text-red-600" />}
            <span>{statusFeedback.message}</span>
          </div>
          <button onClick={() => setStatusFeedback(null)} className="text-xs font-bold opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-semibold">Origin Hazard Zone</th>
              <th className="px-4 py-3 font-semibold">Designated Relocation Shelter</th>
              <th className="px-4 py-3 font-semibold">Distance</th>
              <th className="px-4 py-3 font-semibold">Est. Convoy Transit</th>
              <th className="px-4 py-3 font-semibold">Corridor Status</th>
              <th className="px-4 py-3 font-semibold">Admin DB Override</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {routes.map((route) => {
              const isUpdating = updatingId === route.id;

              return (
                <tr key={route.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-4 py-3.5">
                    <p className="font-bold text-slate-900">{route.zoneName || route.zone}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{route.reason}</p>
                  </td>

                  <td className="px-4 py-3.5 text-slate-700 font-medium">
                    {route.siteName || route.relocationSite}
                  </td>

                  <td className="px-4 py-3.5 text-slate-600 font-mono">
                    {route.distance}
                  </td>

                  <td className="px-4 py-3.5 text-slate-600 font-mono">
                    {route.travelTime}
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getStatusStyle(
                        route.status
                      )}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          route.status === "Safe" || route.status === "CLEAR"
                            ? "bg-emerald-600"
                            : route.status === "Caution" || route.status === "CAUTION"
                            ? "bg-amber-600"
                            : "bg-red-600"
                        }`}
                      />
                      {route.status}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <select
                        disabled={isUpdating}
                        value={route.status}
                        onChange={(e) => handleStatusChange(route, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
                      >
                        <option value="Safe">Safe (Clear)</option>
                        <option value="Caution">Caution (Warning)</option>
                        <option value="Blocked">Blocked (Hazard)</option>
                      </select>
                      {isUpdating && <Loader2 size={14} className="animate-spin text-blue-600" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
