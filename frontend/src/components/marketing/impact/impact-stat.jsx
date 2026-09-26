"use client";

import React from "react";

export default function ImpactStat({ value, label, subtext, icon, highlight }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-400 hover:shadow-md hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {value}
        </span>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
            {icon}
          </div>
        )}
      </div>

      <div className="text-xs font-bold text-emerald-900 mb-1">{label}</div>
      {subtext && <div className="text-[11px] text-slate-500 leading-relaxed">{subtext}</div>}
    </div>
  );
}
