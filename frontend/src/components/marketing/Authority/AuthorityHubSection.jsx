"use client";

import React, { useState } from "react";

/* =========================================================
   AUTHORITY ICONS & BADGES (NDRF, FOREST, RESCUE)
========================================================= */

function ShieldCheckIcon({ size = 22 }) {
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
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function PhoneCallIcon({ size = 20 }) {
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
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function RadioTowerIcon({ size = 22 }) {
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
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2" />
      <path d="M12 14v8" />
    </svg>
  );
}

function TruckHelicopterIcon({ size = 22 }) {
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
      <path d="M10 2h4" />
      <path d="m12 2 4 4" />
      <path d="M4 11h16" />
      <path d="M5 11l2 8h10l2-8" />
      <circle cx="9" cy="19" r="2" />
      <circle cx="15" cy="19" r="2" />
    </svg>
  );
}

function TreePineIcon({ size = 22 }) {
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
      <path d="m12 2-8 12h5l-4 6h14l-4-6h5z" />
      <path d="M12 20v2" />
    </svg>
  );
}

const authorityPartners = [
  {
    name: "NDRF Command Cell",
    badge: "National Response",
    role: "Rapid Deployment & Field Forces",
    details: "Direct telemetry connection to NDRF 24x7 Control Rooms for instant force deployment.",
    bgCard: "bg-white border-slate-200",
    badgeTag: "bg-blue-100 text-blue-900 border-blue-200",
    icon: <ShieldCheckIcon className="text-blue-800" size={24} />,
  },
  {
    name: "State SDMA Network",
    badge: "State Operations",
    role: "District Collectorate Alert Dissemination",
    details: "Real-time sync with State Disaster Management Authorities for localized emergency alerts.",
    bgCard: "bg-white border-emerald-200",
    badgeTag: "bg-emerald-100 text-emerald-900 border-emerald-200",
    icon: <RadioTowerIcon className="text-emerald-700" size={24} />,
  },
  {
    name: "Forest Protection Dept",
    badge: "Ecological Monitoring",
    role: "Canopy & Wildfire Surveillance",
    details: "MODIS/VIIRS thermal hotspot telemetry for forest beat officers and tribal community protection.",
    bgCard: "bg-white border-amber-200",
    badgeTag: "bg-amber-100 text-amber-900 border-amber-200",
    icon: <TreePineIcon className="text-amber-800" size={24} />,
  },
  {
    name: "Central Water Commission",
    badge: "Hydrological Data",
    role: "Inundation & Flood Gauges",
    details: "Automated streamflow monitoring and dam discharge tracking across national river basins.",
    bgCard: "bg-white border-teal-200",
    badgeTag: "bg-teal-100 text-teal-900 border-teal-200",
    icon: <TruckHelicopterIcon className="text-teal-800" size={24} />,
  },
];

const liveBattalions = [
  { battalion: "4th NDRF Battalion", location: "Arakkonam / Coastal South", status: "STANDBY READY", statusColor: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  { battalion: "10th NDRF Battalion", location: "Vijayawada / Eastern Basin", status: "ACTIVE DISPATCH", statusColor: "bg-amber-100 text-amber-900 border-amber-300" },
  { battalion: "1st NDRF Battalion", location: "Guwahati / Brahmaputra Zone", status: "MONITORING", statusColor: "bg-blue-100 text-blue-900 border-blue-300" },
  { battalion: "State Forest Taskforce", location: "Western Ghats Division", status: "CANOPY PATROL", statusColor: "bg-emerald-100 text-emerald-900 border-emerald-300" },
];

export default function AuthorityHubSection() {
  const [selectedPartner, setSelectedPartner] = useState(0);

  return (
    <section id="authorities" className="relative py-24 scroll-mt-16 bg-[#f0fdf4] text-slate-800 border-b border-emerald-200/80">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 relative z-10">
        
        {/* EMERGENCY HELPLINE BANNER */}
        <div className="mb-14 rounded-2xl border border-amber-300 bg-white p-5 sm:p-7 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 border border-amber-300">
              <PhoneCallIcon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-900">National Emergency Operations Hotline</span>
              </div>
              <p className="mt-1 text-lg sm:text-xl font-extrabold text-slate-900">
                NDRF Helpline: <span className="text-amber-800">1078</span> &bull; Emergency Response: <span className="text-emerald-800">112</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700">
              Command Center Sync Active
            </div>
            <a
              href="tel:1078"
              className="rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-sm flex items-center gap-2"
            >
              <PhoneCallIcon size={16} /> Call Hotline 1078
            </a>
          </div>
        </div>

        {/* SECTION HEADER */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 shadow-xs mb-4">
            <ShieldCheckIcon size={16} className="text-emerald-700" /> Government & Response Agency Integration
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Official Coordination with <span className="text-emerald-700">NDRF & State Authorities</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Rescue Arc provides a unified, secure data pipeline connecting state disaster cells, forest conservation taskforces, and NDRF command centers.
          </p>
        </div>

        {/* CARDS GRID */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {authorityPartners.map((item, idx) => {
            const isSelected = selectedPartner === idx;
            return (
              <div
                key={item.name}
                onClick={() => setSelectedPartner(idx)}
                className={`cursor-pointer group relative rounded-2xl border p-6 transition-all duration-300 ${item.bgCard} ${
                  isSelected ? "ring-2 ring-emerald-600 shadow-lg -translate-y-1" : "hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">{item.icon}</div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${item.badgeTag}`}>
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">{item.name}</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">{item.role}</p>
                <p className="mt-3 text-xs leading-relaxed text-slate-600">{item.details}</p>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] font-bold text-emerald-800">
                  <span>View Status</span>
                  <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* LIVE NDRF BATTALION TRACKER */}
        <div className="mt-12 rounded-3xl border border-emerald-200 bg-white p-6 lg:p-8 shadow-lg">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-emerald-100">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-widest">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                Live Response Battalion Status
              </div>
              <h3 className="mt-1 text-xl font-bold text-slate-900">NDRF & State Disaster Taskforce Units</h3>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
                12 Battalions Synced
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold">
                GPS Telemetry Active
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {liveBattalions.map((b) => (
              <div key={b.battalion} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 hover:bg-white transition-all">
                <div className="text-sm font-bold text-slate-900">{b.battalion}</div>
                <div className="mt-1 text-xs text-slate-600">{b.location}</div>
                <div className="mt-3">
                  <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-md border ${b.statusColor}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
