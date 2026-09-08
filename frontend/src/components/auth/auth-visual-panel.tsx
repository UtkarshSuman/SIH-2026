"use client";

import React from "react";
import Image from "next/image";

function ShieldCheckIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function RadioIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <path d="M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2" />
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
    </svg>
  );
}

function BellIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

export function AuthVisualPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 p-8 sm:p-10 text-white">
      {/* Background satellite / terrain overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity pointer-events-none"
        style={{
          backgroundImage: "url('/background-image.png')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/60 pointer-events-none" />

      {/* Atmospheric blur glow */}
      <div className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />

      {/* TOP BADGE */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          NDRF & State Disaster Gateway
        </div>
      </div>

      {/* CENTER INTEL CARD */}
      <div className="relative z-10 my-auto py-6 space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug text-white">
            Unified Geospatial <br />
            <span className="text-emerald-400">Disaster Command</span>
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
            Access real-time telemetry, automated flood and wildfire vectors, and official battalion dispatch alerts.
          </p>
        </div>

        {/* FEATURE HIGHLIGHTS */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-3 backdrop-blur-md">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheckIcon size={16} />
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">NDRF Command Sync</div>
              <div className="text-[10px] text-slate-400">12 Battalions active via automated telemetry</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-3 backdrop-blur-md">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <RadioIcon size={16} />
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">Multi-Sensor AI Vectors</div>
              <div className="text-[10px] text-slate-400">MODIS thermal + CWC river flood gauges</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-3 backdrop-blur-md">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <BellIcon size={16} />
            </div>
            <div className="text-xs">
              <div className="font-bold text-white">Early Citizen Warning</div>
              <div className="text-[10px] text-slate-400">Geo-targeted safe route SMS & evacuations</div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM FOOTER CALLOUT */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5 text-amber-400 font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
          Helpline: 1078
        </span>
        <span className="font-mono text-emerald-300/80">Smart India Hackathon</span>
      </div>
    </div>
  );
}