"use client";

import React from "react";

function FloodIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8c2.2 0 2.2 1.5 4.5 1.5S9.8 8 12 8s2.2 1.5 4.5 1.5S18.8 8 21 8" />
      <path d="M3 13c2.2 0 2.2 1.5 4.5 1.5S9.8 13 12 13s2.2 1.5 4.5 1.5S18.8 13 21 13" />
      <path d="M3 18c2.2 0 2.2 1.5 4.5 1.5S9.8 18 12 18s2.2 1.5 4.5 1.5S18.8 18 21 18" />
    </svg>
  );
}

function MountainIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 20 7-12 4 6 2-3 5 9H3Z" />
    </svg>
  );
}

function WindIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10a3 3 0 1 0-3-3" />
      <path d="M3 12h15a3 3 0 1 1-3 3" />
      <path d="M3 16h8a2 2 0 1 1-2 2" />
    </svg>
  );
}

function RainIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M8 19v2" />
      <path d="M8 13v2" />
      <path d="M12 21v2" />
      <path d="M12 15v2" />
      <path d="M16 19v2" />
      <path d="M16 13v2" />
    </svg>
  );
}

function FireIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5Z" />
    </svg>
  );
}

export default function FeatureCard({
  type = "flood",
  title,
  status,
  description,
  active,
  onClick,
}) {
  const getIcon = () => {
    switch (type) {
      case "flood":
        return <FloodIcon />;
      case "landslide":
        return <MountainIcon />;
      case "cyclone":
        return <WindIcon />;
      case "rainfall":
        return <RainIcon />;
      case "wildfire":
        return <FireIcon />;
      default:
        return <FloodIcon />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "HIGH RISK":
        return "bg-rose-100 text-rose-900 border-rose-200";
      case "MONITORED":
        return "bg-blue-100 text-blue-900 border-blue-200";
      case "LIVE TRACKING":
        return "bg-amber-100 text-amber-900 border-amber-200";
      default:
        return "bg-emerald-100 text-emerald-900 border-emerald-200";
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl border p-5 transition-all duration-300 ${
        active
          ? "border-emerald-600 bg-emerald-50/90 shadow-md ring-2 ring-emerald-500/20 -translate-y-0.5"
          : "border-emerald-100 bg-white hover:border-emerald-300 hover:bg-slate-50/80 hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
              active
                ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 group-hover:bg-emerald-100"
            }`}
          >
            {getIcon()}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-900">
              {title}
            </h3>
            <span
              className={`inline-block mt-0.5 text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusColor()}`}
            >
              {status}
            </span>
          </div>
        </div>

        <div
          className={`h-2.5 w-2.5 rounded-full transition-transform ${
            active ? "bg-emerald-600 scale-125 ring-4 ring-emerald-100" : "bg-slate-300"
          }`}
        />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-600">
        {description}
      </p>
    </div>
  );
}
