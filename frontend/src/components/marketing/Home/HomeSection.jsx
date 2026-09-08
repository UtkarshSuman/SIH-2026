"use client";

import React from "react";
import Link from "next/link";

/* =========================================================
   ICONS
========================================================= */

function ArrowIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function MapIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
      <path d="M9 3v15" />
      <path d="M15 6v15" />
    </svg>
  );
}

function UsersIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PinIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ClockIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function LeafIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 4C12 4 6 8 6 14c0 3 2 5 5 5 6 0 9-6 9-15Z" />
      <path d="M4 20c3-5 7-8 12-10" />
    </svg>
  );
}

function ShieldBadgeIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function AlertIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M10.3 3.5 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function FloodIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 8c2.2 0 2.2 1.5 4.5 1.5S9.8 8 12 8s2.2 1.5 4.5 1.5S18.8 8 21 8" />
      <path d="M3 13c2.2 0 2.2 1.5 4.5 1.5S9.8 13 12 13s2.2 1.5 4.5 1.5S18.8 13 21 13" />
    </svg>
  );
}

function MountainIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m3 20 7-12 4 6 2-3 5 9H3Z" />
    </svg>
  );
}

function WindIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 8h10a3 3 0 1 0-3-3" />
      <path d="M3 12h15a3 3 0 1 1-3 3" />
    </svg>
  );
}

function FireIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5Z" />
    </svg>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ icon, value, label }) {
  return (
    <div
      className="
        flex items-center gap-4
        rounded-2xl
        border border-emerald-100
        bg-white
        p-5
        shadow-sm shadow-emerald-900/5
        transition duration-300
        hover:-translate-y-1
        hover:border-emerald-300
        hover:shadow-md
      "
    >
      <div
        className="
          flex h-12 w-12 shrink-0
          items-center justify-center
          rounded-xl
          bg-emerald-50
          text-emerald-700
          border border-emerald-200
        "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-2xl font-extrabold tracking-tight text-slate-900">
          {value}
        </div>

        <div className="mt-0.5 truncate text-xs font-semibold text-slate-600">
          {label}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HOME SECTION
========================================================= */

export default function HomeSection() {
  return (
    <section
      id="home"
      className="
        relative
        bg-gradient-to-b from-[#f4fbf7] via-white to-[#f0fdf4]
        font-sans
        text-slate-800
        pt-28
        pb-20
        border-b border-emerald-100
      "
    >
      {/* NATURAL LEAF & LANDSCAPE PATTERN BACKGROUND */}
      <div
        aria-hidden="true"
        className="
          absolute inset-0
          bg-cover
          bg-center
          bg-no-repeat
          opacity-[0.04]
          pointer-events-none
        "
        style={{
          backgroundImage: "url('/background-image.png')",
        }}
      />

      {/* SOFT SAGE & EMERALD BLUR ORBS */}
      <div aria-hidden="true" className="pointer-events-none absolute left-0 top-12 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-teal-100/50 blur-3xl" />

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 relative z-10">
        
        {/* HERO GRID */}
        <div className="grid gap-12 lg:grid-cols-12 items-center py-6">
          
          {/* LEFT HERO TEXT */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* NATURAL OFFICIAL BADGE */}
            <div
              className="
                inline-flex
                items-center
                gap-2.5
                rounded-full
                border border-emerald-200
                bg-emerald-50/90
                px-4
                py-2
                text-xs
                font-bold
                text-emerald-900
                shadow-xs
              "
            >
              <ShieldBadgeIcon size={16} className="text-emerald-700" />
              <span>AUTOMATING THE HAZARD PREVENTION SYSTEM</span>
            </div>

            {/* TITLE */}
            <h1
              className="
                text-4xl
                sm:text-6xl
                lg:text-6xl
                font-extrabold
                leading-[1.08]
                tracking-tight
                text-slate-900
              "
            >
              Identifying Hazard Red Zones &{" "}
              <span className="text-emerald-700  decoration-emerald-300 decoration-wavy decoration-2">
                Relocating Vulnerable Habitations
              </span>
            </h1>

            {/* DESCRIPTION */}
            <p
              className="
                max-w-2xl
                text-base
                sm:text-lg
                leading-relaxed
                text-slate-600
              "
            >
              Rescue Arc uses AI-driven geospatial intelligence and multi-hazard risk modeling to intelligently identify <strong className="text-emerald-900 font-semibold">hazard-based red zones</strong>, assess <strong className="text-emerald-900 font-semibold">terrain carrying capacity</strong>, and prioritize immediate relocation needs for vulnerable settlements across India.
            </p>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/dashboard"
                className="
                  inline-flex
                  h-13
                  items-center
                  justify-center
                  gap-2.5
                  rounded-xl
                  bg-emerald-700
                  hover:bg-emerald-800
                  px-7
                  text-sm
                  font-bold
                  text-white
                  shadow-md shadow-emerald-900/10
                  transition-all
                  hover:-translate-y-0.5
                "
              >
                Assess Your Relocations
                <ArrowIcon />
              </Link>

              <a
                href="/dashboard"
                className="
                  inline-flex
                  h-13
                  items-center
                  justify-center
                  gap-2.5
                  rounded-xl
                  border border-emerald-300
                  bg-white
                  hover:bg-emerald-50
                  px-7
                  text-sm
                  font-semibold
                  text-emerald-900
                  shadow-xs
                  transition-all
                  hover:-translate-y-0.5
                "
              >
                <MapIcon />
                View Red Zone Map
              </a>
            </div>

            {/* TRUST LINE */}
            <div className="flex items-center gap-3 pt-3 text-xs font-semibold text-slate-600">
              <UsersIcon size={18} className="text-emerald-700" />
              <span>Mapping 5,000+ vulnerable habitations across multi-hazard red zones</span>
            </div>
          </div>

          {/* RIGHT LIVE MONITOR CARD */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* NATURAL MONITOR CARD */}
            <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-xl shadow-emerald-900/5">
              <div className="flex items-center justify-between pb-4 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <AlertIcon size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                      Live Red Zone Feed
                    </div>
                    <div className="text-sm font-bold text-slate-900">Settlement Risk Status</div>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                  NDMA Synced
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs font-medium text-slate-800">
                  <span className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <FireIcon size={18} /> Seismic & Earthquake Zones
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                    IMD Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-800">
                  <span className="flex items-center gap-2 text-slate-800 font-semibold">
                    <FloodIcon size={18} /> Flood Inundation & Red Zones
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-200">
                    CWC Live
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-800">
                  <span className="flex items-center gap-2 text-slate-800 font-semibold">
                    <MountainIcon size={18} /> Landslide Susceptibility
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200">
                    GSI Active
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-800">
                  <span className="flex items-center gap-2 text-slate-800 font-semibold">
                    <WindIcon size={18} /> Carrying Capacity Index
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300">
                    AI Active
                  </span>
                </div>
              </div>

              {/* NATURAL ADVISORY BANNER */}
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 flex items-start gap-3">
                <AlertIcon size={18} className="text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-amber-950">Relocation Priority Alert &bull; Red Zone R-4</div>
                  <div className="text-amber-900/80 mt-0.5">48 vulnerable habitations flagged for immediate relocation assessment.</div>
                </div>
              </div>
            </div>

            {/* QUICK STAT STRIP */}
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-xs flex items-center justify-between text-slate-700 shadow-xs">
              <span className="flex items-center gap-2 font-medium">
                <ClockIcon size={16} className="text-emerald-700" />
                Risk Assessment Cycle: <strong className="text-slate-900">Every 6 hours</strong>
              </span>
              <span className="text-emerald-800 font-bold">100% Operational</span>
            </div>

          </div>
        </div>

        {/* BOTTOM STATS GRID */}
        <div className="mt-14 pt-8 border-t border-emerald-200/60">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<UsersIcon />}
              value="5,000+"
              label="Vulnerable Habitations Mapped"
            />
            <StatCard
              icon={<PinIcon />}
              value="850+"
              label="Hazard-Based Red Zones Identified"
            />
            <StatCard
              icon={<ClockIcon />}
              value="24/7"
              label="Carrying Capacity Monitoring"
            />
            <StatCard
              icon={<LeafIcon />}
              value="1,200+"
              label="Settlements Prioritized for Relocation"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
