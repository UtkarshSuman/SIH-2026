"use client";

import React from "react";

export default function ProcessStep({
  number,
  label,
  title,
  description,
  tagColor,
  icon,
}) {
  return (
    <div className="relative rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-400 hover:shadow-md hover:-translate-y-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900 font-extrabold text-lg border border-emerald-300">
            {number}
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${tagColor}`}>
            {label}
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-800">
        <span>Active Workflow Step</span>
        <span>&bull;</span>
      </div>
    </div>
  );
}
