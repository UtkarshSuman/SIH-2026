"use client";

import React from "react";
import Link from "next/link";
import ProcessStep from "./ProcessStep";

function ShieldCheckIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function PhoneCallIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

const workflowSteps = [
  {
    number: "01",
    label: "COLLECT",
    title: "Geospatial & Telemetry Gathering",
    description:
      "Rescue Arc continuously captures MODIS thermal hotspots, CWC river telemetry, and IMD Doppler weather streams into one unified pipeline.",
    tagColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  {
    number: "02",
    label: "ANALYZE",
    title: "AI Risk Vector Modeling",
    description:
      "Predictive machine learning calculates flood inundation timelines, slope slip risks, and wildfire propagation speeds before impact.",
    tagColor: "bg-teal-100 text-teal-900 border-teal-300",
  },
  {
    number: "03",
    label: "DISPATCH",
    title: "Automated Authority Alerting",
    description:
      "Instant telemetry dispatches go directly to NDRF 24x7 Control Rooms, State SDMA cells, and local forest protection divisions.",
    tagColor: "bg-amber-100 text-amber-900 border-amber-300",
  },
  {
    number: "04",
    label: "EVACUATE",
    title: "Citizen Safe Route Guidance",
    description:
      "Vulnerable communities receive geo-targeted safe evacuation routes away from hazard zones with offline SMS support.",
    tagColor: "bg-blue-100 text-blue-900 border-blue-300",
  },
  {
    number: "05",
    label: "RESTORE",
    title: "Resource & Relief Allocation",
    description:
      "Inflatable rescue boats, emergency medical shelters, and forest recovery units receive real-time priority distribution maps.",
    tagColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
];

export default function HowItWorkSection() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 scroll-mt-16 bg-[#f0fdf4] text-slate-800 border-b border-emerald-200/80"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 relative z-10">
        
        {/* HEADER */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 shadow-xs mb-4">
            <ShieldCheckIcon size={16} className="text-emerald-700" /> Five-Phase Rapid Protocol
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How <span className="text-emerald-700">Rescue Arc</span> Operates
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            From early satellite observation to NDRF ground force mobilization — a closed-loop disaster intelligence lifecycle.
          </p>
        </div>

        {/* 5 STEPS GRID */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {workflowSteps.map((step) => (
            <ProcessStep
              key={step.number}
              number={step.number}
              label={step.label}
              title={step.title}
              description={step.description}
              tagColor={step.tagColor}
            />
          ))}
        </div>

        {/* CTA BANNER */}
        <div className="mt-16 rounded-3xl border border-emerald-300 bg-white p-8 lg:p-10 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest">
              Ready for Integration
            </span>
            <h3 className="mt-1 text-2xl font-extrabold text-slate-900">
              Onboard Your District or Response Division
            </h3>
            <p className="mt-2 text-xs text-slate-600 max-w-xl">
              Connect your emergency control cell to the national early warning network with verified government access.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="tel:1078"
              className="rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-3 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <PhoneCallIcon size={16} /> NDRF Hotline 1078
            </a>
            <Link
              href="/register"
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-6 py-3 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
            >
              Register Unit
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
