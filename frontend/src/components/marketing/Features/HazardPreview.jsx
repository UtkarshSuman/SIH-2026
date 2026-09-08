"use client";

import React from "react";

export default function HazardPreview({
  title = "Flood Inundation Vector",
  status = "High Risk Area",
  hazard = "flood",
}) {
  const getHazardDetails = () => {
    switch (hazard) {
      case "flood":
        return {
          markerColor: "bg-blue-600 border-blue-200 shadow-blue-500/50",
          pingColor: "bg-blue-400",
          confidence: "94.6%",
          sensorSource: "CWC River Basin Telemetry & Sentinel-1 SAR",
          metricName: "Red Zone Classification",
          metricValue: "Zone R-3 — 120 habitations at risk",
          advisory: "Immediate low-lying settlement evacuation assessment active.",
        };
      case "landslide":
        return {
          markerColor: "bg-amber-600 border-amber-200 shadow-amber-500/50",
          pingColor: "bg-amber-400",
          confidence: "91.2%",
          sensorSource: "GSI Slope Inclinometers & Rainfall Radar",
          metricName: "Slope Failure Risk",
          metricValue: "4.8 mm/hr critical displacement near 32 settlements",
          advisory: "Hill settlement relocation assessment triggered.",
        };
      case "cyclone":
        return {
          markerColor: "bg-indigo-600 border-indigo-200 shadow-indigo-500/50",
          pingColor: "bg-indigo-400",
          confidence: "97.1%",
          sensorSource: "AI Terrain & Population Density Models",
          metricName: "Carrying Capacity",
          metricValue: "Exceeded by 2.3x in 8 settlements",
          advisory: "Capacity breach flagged — relocation planning initiated.",
        };
      case "rainfall":
        return {
          markerColor: "bg-teal-600 border-teal-200 shadow-teal-500/50",
          pingColor: "bg-teal-400",
          confidence: "93.4%",
          sensorSource: "Multi-Hazard Risk Scoring Engine",
          metricName: "Relocation Urgency",
          metricValue: "Priority 1 — 45 settlements flagged",
          advisory: "Immediate relocation recommendation dispatched to DDMA.",
        };
      case "wildfire":
        return {
          markerColor: "bg-rose-600 border-rose-200 shadow-rose-500/50",
          pingColor: "bg-rose-400",
          confidence: "96.8%",
          sensorSource: "BIS Seismic Zonation & Fault-Line Proximity",
          metricName: "Seismic Vulnerability",
          metricValue: "Zone IV — 68 habitations in high-risk belt",
          advisory: "Structural assessment teams dispatched to flagged settlements.",
        };
      default:
        return {
          markerColor: "bg-emerald-600 border-emerald-200 shadow-emerald-500/50",
          pingColor: "bg-emerald-400",
          confidence: "95.0%",
          sensorSource: "Integrated Geospatial Intelligence",
          metricName: "Settlement Risk Score",
          metricValue: "Multi-parameter assessment active",
          advisory: "System syncing with NDMA & DDMA Command Cells.",
        };
    }
  };

  const details = getHazardDetails();

  return (
    <div className="relative min-h-[480px] overflow-hidden rounded-3xl border border-emerald-200 bg-slate-900 p-6 shadow-xl flex flex-col justify-between text-white">
      {/* Background satellite / terrain effect */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
        style={{
          backgroundImage: "url('/background-image.png')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-950/90" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(to right, #10b981 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* TOP BAR */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Live Red Zone Radar
        </div>

        <span className="text-[10px] font-mono text-emerald-300/80 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-lg">
          GPS: 13.0827° N, 80.2707° E
        </span>
      </div>

      {/* CENTER RADAR TARGET MARKER */}
      <div className="relative z-10 my-8 flex items-center justify-center">
        {/* Radar rings */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-48 w-48 rounded-full border border-emerald-500/20 animate-ping opacity-30" />
          <div className="absolute h-36 w-36 rounded-full border border-emerald-500/30" />
          <div className="absolute h-20 w-20 rounded-full border border-emerald-500/40" />

          {/* Focal Node */}
          <div
            className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 text-white shadow-lg transition-all duration-500 ${details.markerColor}`}
          >
            <span className={`absolute h-full w-full rounded-full animate-ping opacity-40 ${details.pingColor}`} />
            <span className="font-extrabold text-sm">LIVE</span>
          </div>
        </div>

        {/* Floating Callout badge */}
        <div className="absolute -right-2 top-2 sm:right-6 sm:top-4 rounded-2xl border border-white/20 bg-slate-900/90 p-4 shadow-xl backdrop-blur-xl max-w-[210px]">
          <div className="text-xs font-extrabold text-white">{title}</div>
          <div className="mt-1 text-[10px] font-bold text-amber-300 uppercase tracking-wide">
            {status}
          </div>
          <div className="mt-2 text-[10px] text-slate-300 leading-snug">
            {details.sensorSource}
          </div>
        </div>
      </div>

      {/* BOTTOM TELEMETRY CARD */}
      <div className="relative z-10 rounded-2xl border border-emerald-500/20 bg-slate-950/85 p-5 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
              {details.metricName}
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              {details.metricValue}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[9px] font-mono uppercase text-slate-400">AI Confidence</div>
              <div className="text-base font-extrabold text-emerald-400">{details.confidence}</div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-300">
          <span className="text-[11px] text-emerald-200">
            &bull; {details.advisory}
          </span>
          <span className="text-[10px] font-bold text-slate-400">Synced to NDMA</span>
        </div>
      </div>
    </div>
  );
}
