"use client";

import React, { useState } from "react";
import FeatureCard from "./FeatureCard";
import HazardPreview from "./HazardPreview";

function ShieldCheckIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

const hazards = [
  {
    id: "flood",
    type: "flood",
    title: "Floods & River Inundation",
    status: "HIGH RISK",
    description:
      "Detect flood-prone basins using CWC river telemetry, terrain elevation, and Sentinel-1 SAR imagery.",
    previewTitle: "Flood Inundation Vector",
    previewStatus: "Critical Watch",
  },
  {
    id: "wildfire",
    type: "wildfire",
    title: "Forest Fires & Canopy Heat",
    status: "MONITORED",
    description:
      "MODIS and VIIRS 375m thermal hotspot detection protects wildlife habitats and tribal forest fringe settlements.",
    previewTitle: "Canopy Thermal Anomaly",
    previewStatus: "Active Patrol",
  },
  {
    id: "landslide",
    type: "landslide",
    title: "Landslide Vulnerability",
    status: "MONITORED",
    description:
      "Monitor mountain slope displacement, soil saturation, and heavy precipitation thresholds.",
    previewTitle: "Slope Shear Vector",
    previewStatus: "Sensor Active",
  },
  {
    id: "cyclone",
    type: "cyclone",
    title: "Cyclones & Coastal Surges",
    status: "LIVE TRACKING",
    description:
      "Track cyclonic eye coordinates, storm surge height, and wind landfall vectors with Doppler radars.",
    previewTitle: "Storm Surge Contour",
    previewStatus: "Radar Sync",
  },
  {
    id: "rainfall",
    type: "rainfall",
    title: "Extreme Precipitation",
    status: "LIVE MONITORING",
    description:
      "Identify intense cloudburst pockets and calculate rapid downstream runoff accumulation.",
    previewTitle: "Precipitation Spike",
    previewStatus: "Catchment Alert",
  },
];

export default function FeaturesSection() {
  const [activeHazard, setActiveHazard] = useState("flood");

  const selected = hazards.find((h) => h.id === activeHazard) || hazards[0];

  return (
    <section
      id="features"
      className="relative py-24 scroll-mt-16 bg-white text-slate-800 border-b border-emerald-200/80"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 relative z-10">
        
        {/* HEADER */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 shadow-xs mb-4">
            <ShieldCheckIcon size={16} className="text-emerald-700" /> Multi-Hazard Intelligence Grid
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            One Unified Map. <span className="text-emerald-700">All Critical Hazards.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Rescue Arc fuses disparate satellite observations, river gauges, and forest canopy sensors into a single actionable operational picture.
          </p>
        </div>

        {/* GRID: CARDS ON LEFT, PREVIEW ON RIGHT */}
        <div className="mt-14 grid gap-8 lg:grid-cols-12 items-center">
          {/* CARDS */}
          <div className="lg:col-span-5 space-y-3">
            {hazards.map((item) => (
              <FeatureCard
                key={item.id}
                type={item.type}
                title={item.title}
                status={item.status}
                description={item.description}
                active={activeHazard === item.id}
                onClick={() => setActiveHazard(item.id)}
              />
            ))}
          </div>

          {/* HAZARD PREVIEW */}
          <div className="lg:col-span-7">
            <HazardPreview
              title={selected.previewTitle}
              status={selected.previewStatus}
              hazard={selected.id}
            />
          </div>
        </div>

      </div>
    </section>
  );
}
