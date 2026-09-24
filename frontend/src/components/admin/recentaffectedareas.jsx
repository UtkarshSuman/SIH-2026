"use client";

import { FileText, ArrowRight } from "lucide-react";

export default function Recentaffectedareas({
  locations = [],
  onSelectLocation,
}) {
  const recentLocations = locations.slice(0, 5);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <FileText size={21} className="text-slate-700" />

          <h3 className="font-bold text-[#0b1838]">Recent Affected Areas</h3>
        </div>

        <button className="flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800">
          View All
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Content */}
      {recentLocations.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500">
          No affected areas found.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {recentLocations.map((location, index) => {
            const riskClass =
              location.riskLevel === "High"
                ? "bg-red-100 text-red-600"
                : location.riskLevel === "Moderate"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700";

            return (
              <div
                key={location.id}
                className="flex items-center gap-3 p-3 transition hover:bg-slate-50"
              >
                {/* Number */}
                <span className="w-4 text-xs font-medium text-slate-400">
                  {index + 1}
                </span>

                {/* Location */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {location.name}
                  </p>

                  <p className="truncate text-xs text-slate-500">
                    {location.state}
                  </p>
                </div>

                {/* Risk */}
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${riskClass}`}
                >
                  {location.riskLevel}
                </span>

                {/* View */}
                <button
                  onClick={() => onSelectLocation?.(location)}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
                >
                  View
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
