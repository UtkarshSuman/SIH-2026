"use client";

import { BarChart3 } from "lucide-react";

export default function Zonecoverage({ stats }) {
  if (!stats) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Loading zone coverage...</p>
      </div>
    );
  }

  const total = stats.totalZones || 0;

  const getPercentage = (value) => {
    if (!total) return 0;

    return Math.round((value / total) * 100);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 size={21} className="text-emerald-700" />

        <h3 className="font-bold text-[#0b1838]">Zone Coverage (India)</h3>
      </div>

      {/* Total */}
      <div className="my-5 text-center">
        <p className="text-3xl font-bold text-[#0b1838]">{total}</p>

        <p className="text-xs text-slate-500">Total Zones</p>
      </div>

      {/* Stats */}
      <div className="space-y-4">
        {/* High */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500" />

              <span className="text-sm text-slate-600">High Risk Zones</span>
            </div>

            <span className="text-sm font-semibold text-slate-700">
              {stats.highRiskZones}
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-red-500"
              style={{
                width: `${getPercentage(stats.highRiskZones)}%`,
              }}
            />
          </div>
        </div>

        {/* Moderate */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-yellow-400" />

              <span className="text-sm text-slate-600">
                Moderate Risk Zones
              </span>
            </div>

            <span className="text-sm font-semibold text-slate-700">
              {stats.moderateRiskZones}
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-yellow-400"
              style={{
                width: `${getPercentage(stats.moderateRiskZones)}%`,
              }}
            />
          </div>
        </div>

        {/* Low */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-500" />

              <span className="text-sm text-slate-600">Low Risk Zones</span>
            </div>

            <span className="text-sm font-semibold text-slate-700">
              {stats.lowRiskZones}
            </span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-500"
              style={{
                width: `${getPercentage(stats.lowRiskZones)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
