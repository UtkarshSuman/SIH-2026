"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-emerald-200/80 bg-slate-900 px-5 py-16 font-sans text-slate-300 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">

        {/* MAIN FOOTER */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">

          {/* BRAND */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3">

              <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-emerald-500/30 bg-emerald-950 p-1">
                <Image
                  src="/logo.jpeg"
                  alt="Rescue Arc Logo"
                  fill
                  className="rounded-lg object-cover"
                />
              </div>

              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-white">
                  Rescue <span className="text-emerald-400">Arc</span>
                </span>

                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/80">
                  Hazard Red Zone Hub
                </span>
              </div>

            </div>

            <p className="max-w-sm text-xs leading-relaxed text-slate-400">
              Geospatial hazard intelligence platform for intelligent red
              zone identification, carrying capacity assessment, and
              vulnerable habitation relocation.
            </p>

            <a
              href="tel:1078"
              className="inline-flex items-center gap-2 pt-2 text-xs font-bold text-amber-400 transition-colors hover:text-amber-300"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              <span>National Disaster Helpline: 1078</span>
            </a>
          </div>

          {/* PLATFORM */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white">
              Platform
            </h4>

            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-emerald-400"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/redzone"
                  className="transition-colors hover:text-emerald-400"
                >
                  Live Hazard Map
                </Link>
              </li>

              <li>
                <Link
                  href="/relocation"
                  className="transition-colors hover:text-emerald-400"
                >
                  Habitation Relocation
                </Link>
              </li>

              <li>
                <Link
                  href="/alerts"
                  className="transition-colors hover:text-emerald-400"
                >
                  Early Warning Alerts
                </Link>
              </li>

              <li>
                <Link
                  href="/analytics"
                  className="transition-colors hover:text-emerald-400"
                >
                  Risk & Capacity Analytics
                </Link>
              </li>

              <li>
                <Link
                  href="/features"
                  className="transition-colors hover:text-emerald-400"
                >
                  Features Overview
                </Link>
              </li>
            </ul>
          </div>

          {/* ORGANIZATION */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white">
              Organization
            </h4>

            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-emerald-400"
                >
                  About Rescue Arc
                </Link>
              </li>

              <li>
                <Link
                  href="/how-it-works"
                  className="transition-colors hover:text-emerald-400"
                >
                  How It Works
                </Link>
              </li>

              <li>
                <Link
                  href="/impact"
                  className="transition-colors hover:text-emerald-400"
                >
                  Operational Impact
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-emerald-400"
                >
                  Contact & Support
                </Link>
              </li>

              <li>
                <Link
                  href="/dashboard"
                  className="font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
                >
                  Responder Dashboard →
                </Link>
              </li>
            </ul>
          </div>

          {/* ACCESS */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-white">
              Access
            </h4>

            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-center text-xs font-semibold text-white transition-all hover:bg-slate-700 hover:border-slate-600"
              >
                Official Login
              </Link>

              <Link
                href="/register"
                className="block w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-center text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
              >
                Register Agency
              </Link>

              <Link
                href="/admin"
                className="block w-full rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-2.5 text-center text-xs font-bold text-amber-400 transition-all hover:bg-amber-900/40 hover:border-amber-400/50"
              >
                ⚡ Command Admin
              </Link>
            </div>
          </div>

        </div>

        {/* BOTTOM */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 text-[11px] text-slate-500 sm:flex-row">

          <p>
            © {new Date().getFullYear()} Rescue Arc • SIH Problem 26191 •
            Smart India Hackathon. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/redzone"
              className="transition-colors hover:text-emerald-400"
            >
              Red Zone Classification
            </Link>
            <Link
              href="/analytics"
              className="transition-colors hover:text-emerald-400"
            >
              Carrying Capacity
            </Link>
            <Link
              href="/relocation"
              className="transition-colors hover:text-emerald-400"
            >
              Relocation Priority
            </Link>
            <Link
              href="/alerts"
              className="transition-colors hover:text-emerald-400"
            >
              Early Warning Alerts
            </Link>
          </div>

        </div>

      </div>
    </footer>
  );
}