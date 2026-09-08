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
    title: "Flood-Prone Red Zones",
    status: "HIGH RISK",
    description:
      "Identify flood-prone habitations using CWC river gauge data, terrain elevation models, and Sentinel-1 SAR inundation mapping for red zone classification.",
    previewTitle: "Flood Red Zone Overlay",
    previewStatus: "Critical Watch",
  },
  {
    id: "wildfire",
    type: "wildfire",
    title: "Seismic & Earthquake Zones",
    status: "MONITORED",
    description:
      "Map seismic vulnerability of settlements using BIS seismic zonation data, fault-line proximity, and soil amplification factors to flag high-risk habitations.",
    previewTitle: "Seismic Risk Heatmap",
    previewStatus: "Zone Assessment",
  },
  {
    id: "landslide",
    type: "landslide",
    title: "Landslide Susceptibility",
    status: "MONITORED",
    description:
      "Assess slope instability, soil saturation, and rainfall thresholds around hill settlements to determine red zone boundaries and relocation priority.",
    previewTitle: "Slope Failure Risk Map",
    previewStatus: "GSI Active",
  },
  {
    id: "cyclone",
    type: "cyclone",
    title: "Carrying Capacity Analysis",
    status: "LIVE TRACKING",
    description:
      "Evaluate terrain load-bearing capacity, population density thresholds, and infrastructure stress indices to determine if habitations exceed safe limits.",
    previewTitle: "Capacity Index Overlay",
    previewStatus: "AI Scoring",
  },
  {
    id: "rainfall",
    type: "rainfall",
    title: "Relocation Priority Index",
    status: "LIVE MONITORING",
    description:
      "Compute multi-hazard relocation urgency scores combining red zone severity, carrying capacity exceedance, and settlement vulnerability for immediate action.",
    previewTitle: "Relocation Priority Map",
    previewStatus: "Decision Ready",
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
            <ShieldCheckIcon size={16} className="text-emerald-700" /> Red Zone Intelligence Engine
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            One Unified Map. <span className="text-emerald-700">All Red Zones & Capacity Scores.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Rescue Arc fuses multi-hazard geospatial data, terrain carrying capacity models, and settlement vulnerability indices into a single red zone intelligence picture.
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
