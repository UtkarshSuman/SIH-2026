"use client";

import React from "react";
import Link from "next/link";
import ImpactStat from "./ImpactStat";

function ShieldCheckIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function UsersIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function RadioIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <path d="M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2" />
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
    </svg>
  );
}

function ClockIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function TreeIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 2-8 12h5l-4 6h14l-4-6h5z" />
      <path d="M12 20v2" />
    </svg>
  );
}

const operationalStats = [
  {
    value: "1.2M+",
    label: "Citizens in Warning Radius",
    subtext: "Geo-targeted alerts across 8 coastal & river districts",
    icon: <UsersIcon size={20} />,
  },
  {
    value: "12",
    label: "NDRF Battalions Synced",
    subtext: "Direct telemetry to National Control Room 1078",
    icon: <RadioIcon size={20} />,
  },
  {
    value: "< 3 Min",
    label: "Warning Dispatch Latency",
    subtext: "Automated AI risk detection to SMS dissemination",
    icon: <ClockIcon size={20} />,
  },
  {
    value: "85K+ Ha",
    label: "Forest Canopy Monitored",
    subtext: "Thermal hotspot surveillance in vulnerable ecosystems",
    icon: <TreeIcon size={20} />,
  },
];

const highlights = [
  {
    title: "Western Ghats Flash Flood Readiness",
    tag: "Monsoon Watch",
    description: "Integrated 42 CWC automated water level sensors to generate 6-hour inundation forecasts for river basin communities.",
    stat: "100% telemetry uptime",
  },
  {
    title: "Eastern Coast Cyclone Response Track",
    tag: "Coastal Defense",
    description: "Coupled INSAT-3D Doppler storm radar with dynamic safe evacuation routes for 150+ village disaster committees.",
    stat: "45K citizens alerted",
  },
  {
    title: "Canopy & Forest Fire Thermal Grid",
    tag: "Ecosystem Defense",
    description: "MODIS / VIIRS 375m thermal anomaly pipeline dispatched automated coordinates to local forest beat squads within 4 minutes.",
    stat: "62 hotspots isolated",
  },
];

export default function ImpactSection() {
  return (
    <section
      id="impact"
      className="relative py-24 scroll-mt-16 bg-[#f0fdf4] text-slate-800 border-b border-emerald-200/80"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 relative z-10">
        
        {/* HEADER */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 shadow-xs mb-4">
            <ShieldCheckIcon size={16} className="text-emerald-700" /> Proven Operational Impact
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Measurable Safety & <span className="text-emerald-700">Rapid Response</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Rescue Arc translates geospatial AI and multi-sensor telemetry into real-world lives saved and protected ecosystems across India.
          </p>
        </div>

        {/* METRICS GRID */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {operationalStats.map((item) => (
            <ImpactStat
              key={item.label}
              value={item.value}
              label={item.label}
              subtext={item.subtext}
              icon={item.icon}
            />
          ))}
        </div>

        {/* FIELD DEPLOYMENT HIGHLIGHTS */}
        <div className="mt-16">
          <h3 className="text-2xl font-extrabold text-slate-900 mb-6 text-center">
            Recent Telemetry & Deployment Highlights
          </h3>

          <div className="grid gap-6 md:grid-cols-3">
            {highlights.map((h) => (
              <div
                key={h.title}
                className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 uppercase tracking-wider mb-3">
                    {h.tag}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mb-2">{h.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{h.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span>Verified Result:</span>
                  <span className="text-slate-900">{h.stat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM CALLOUT */}
        <div className="mt-16 rounded-3xl border border-emerald-300 bg-white p-8 lg:p-10 text-center shadow-md max-w-4xl mx-auto">
          <h3 className="text-2xl font-extrabold text-slate-900">
            Join India&apos;s Next-Generation Disaster Intelligence Network
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Enable AI-powered hazard detection, automated NDRF alert dispatches, and citizen evacuation routing for your district.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-7 py-3 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
            >
              Get Started with Rescue Arc
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
