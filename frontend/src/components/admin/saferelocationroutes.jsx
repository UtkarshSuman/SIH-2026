"use client";

import { ArrowUpRight, Route } from "lucide-react";

const routes = [
  {
    id: 1,
    zone: "Village A",
    relocationSite: "Shelter Alpha",
    distance: "8.4 km",
    travelTime: "18 min",
    status: "Safe",
    reason: "Clear route",
  },
  {
    id: 2,
    zone: "Village B",
    relocationSite: "Shelter Beta",
    distance: "5.7 km",
    travelTime: "14 min",
    status: "Safe",
    reason: "Clear route",
  },
  {
    id: 3,
    zone: "Village C",
    relocationSite: "Shelter Gamma",
    distance: "11.2 km",
    travelTime: "29 min",
    status: "Caution",
    reason: "Partial road obstruction",
  },
  {
    id: 4,
    zone: "Village D",
    relocationSite: "Shelter Delta",
    distance: "7.8 km",
    travelTime: "22 min",
    status: "Blocked",
    reason: "Flooded road",
  },
];

function getStatusStyle(status) {
  if (status === "Safe") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "Caution") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

export default function SafeRelocationRoutes() {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Safe Relocation Routes
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Available routes from affected areas to relocation sites.
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
          <Route className="h-5 w-5 text-green-600" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3 font-medium">Affected Area</th>

              <th className="px-4 py-3 font-medium">Relocation Site</th>

              <th className="px-4 py-3 font-medium">Distance</th>

              <th className="px-4 py-3 font-medium">Travel Time</th>

              <th className="px-4 py-3 font-medium">Status</th>

              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {routes.map((route) => (
              <tr
                key={route.id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-800">{route.zone}</p>

                  <p className="mt-1 text-xs text-slate-400">{route.reason}</p>
                </td>

                <td className="px-4 py-4 text-sm text-slate-600">
                  {route.relocationSite}
                </td>

                <td className="px-4 py-4 text-sm text-slate-600">
                  {route.distance}
                </td>

                <td className="px-4 py-4 text-sm text-slate-600">
                  {route.travelTime}
                </td>

                <td className="px-4 py-4">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                      route.status,
                    )}`}
                  >
                    {route.status}
                  </span>
                </td>

                <td className="px-4 py-4">
                  <button className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                    View Route
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
