"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", `#${id}`);
    }
  };

  return (
    <footer className="border-t border-emerald-200/80 bg-slate-900 text-slate-300 px-5 sm:px-8 lg:px-12 py-16 font-sans">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          
          {/* BRAND COLUMN */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-950 p-1">
                <Image
                  src="/logo.jpeg"
                  alt="Rescue Arc Logo"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-white">
                  Rescue <span className="text-emerald-400">Arc</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-emerald-400/80 font-bold">
                  NDRF & Forest Response Hub
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Monorepo geospatial disaster intelligence and early warning coordination platform built for Smart India Hackathon.
            </p>

            <div className="pt-2 text-xs text-amber-400 font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span>National Disaster Helpline: 1078</span>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="#home"
                  onClick={(e) => handleScroll(e, "home")}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Home Overview
                </a>
              </li>
              <li>
                <a
                  href="#authorities"
                  onClick={(e) => handleScroll(e, "authorities")}
                  className="hover:text-emerald-400 transition-colors"
                >
                  NDRF Authorities
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => handleScroll(e, "features")}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Hazard Intelligence Grid
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => handleScroll(e, "how-it-works")}
                  className="hover:text-emerald-400 transition-colors"
                >
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* AGENCY & COMMUNITY */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
              Organization
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="#about"
                  onClick={(e) => handleScroll(e, "about")}
                  className="hover:text-emerald-400 transition-colors"
                >
                  About Platform
                </a>
              </li>
              <li>
                <a
                  href="#impact"
                  onClick={(e) => handleScroll(e, "impact")}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Operational Impact
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={(e) => handleScroll(e, "contact")}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Command Hotline
                </a>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-emerald-400 transition-colors text-emerald-400 font-semibold"
                >
                  Responder Dashboard &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* AUTH & ACTIONS */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-4">
              Access
            </h4>
            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full text-center rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white transition-all"
              >
                Official Login
              </Link>
              <Link
                href="/register"
                className="block w-full text-center rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
              >
                Register Agency
              </Link>
            </div>
          </div>

        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Rescue Arc &bull; Smart India Hackathon. All rights reserved.</p>
          <div className="flex gap-6">
            <span>NDRF Telemetry Gateway</span>
            <span>CWC Streamflow Sync</span>
            <span>MODIS Hotspot Grid</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
