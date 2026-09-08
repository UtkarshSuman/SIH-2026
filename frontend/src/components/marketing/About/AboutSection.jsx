"use client";

import React from "react";
import Link from "next/link";

function ShieldCheckIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

const principles = [
  {
    number: "01",
    title: "Preparedness First",
    description:
      "The best disaster response begins before severe impact occurs. Rescue Arc turns early satellite telemetry into active community readiness.",
  },
  {
    number: "02",
    title: "Clarity Over Complexity",
    description:
      "Disaster data can be overwhelming. We streamline MODIS thermal hotspots, CWC river telemetry, and slope displacement sensors into clear actionable alerts.",
  },
  {
    number: "03",
    title: "Ecosystem & Canopy Protection",
    description:
      "Geospatial AI and environmental telemetry serve a dual mission: protecting citizen lives and preserving vulnerable forest habitats.",
  },
  {
    number: "04",
    title: "Authority Field Synchronization",
    description:
      "True resilience happens when NDRF battalions, SDMA emergency control cells, and local forest taskforces operate on a single shared dashboard.",
  },
];

export default function AboutSection() {
  return (
    <section id="about" className="relative py-24 scroll-mt-16 bg-[#f0fdf4] text-slate-800 border-b border-emerald-200/80">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 relative z-10">
        
        {/* HEADER */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 shadow-xs mb-4">
            <ShieldCheckIcon size={16} className="text-emerald-700" /> About Our Platform & Mission
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Building Safer Communities & <span className="text-emerald-700">Resilient Ecosystems</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Rescue Arc is a monorepo geospatial disaster intelligence platform built for Smart India Hackathon, bridging satellite telemetry with NDRF and state emergency responders.
          </p>
        </div>

        {/* CORE PRINCIPLES GRID */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((item) => (
            <div
              key={item.number}
              className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-400 hover:shadow-md hover:-translate-y-1"
            >
              <div className="text-2xl font-extrabold text-emerald-800 mb-3">{item.number}</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        {/* MISSION BANNER */}
        <div className="mt-16 rounded-3xl border border-emerald-300 bg-gradient-to-r from-white via-[#e6f4ea] to-white p-8 lg:p-12 text-center shadow-md">
          <h3 className="text-2xl font-extrabold text-slate-900">
            Integrated with National & State Disaster Response Forces
          </h3>
          <p className="mt-3 text-sm text-slate-700 max-w-xl mx-auto leading-relaxed">
            From MODIS canopy thermal sensors to Central Water Commission gauges, Rescue Arc bridges tech innovation with official responder workflows.
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
