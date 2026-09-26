"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import LocationSearch from "./locationsearch";
import RiskLegend from "./risklegend";
import RiskInfo from "./riskinfo";

const RedZoneMap = dynamic(() => import("./redzonemap"), { ssr: false, loading: () => <div className="flex h-[520px] w-full items-center justify-center bg-slate-900 text-xs text-slate-400">Loading GIS map...</div> });

export default function RedZoneSection() {
  const [zones, setZones] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const loadZones = async () => {
      try {
        const response = await fetch("/api/zones", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load zone data");
        if (!active) return;
        setZones(payload);
        setSelectedLocation((current) => current || [...payload].sort((a, b) => b.worstScore - a.worstScore)[0] || null);
        setError("");
      } catch (loadError) { if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load zone data"); }
    };
    loadZones();
    const refresh = window.setInterval(loadZones, 60000);
    return () => { active = false; window.clearInterval(refresh); };
  }, []);

  return <main className="min-h-screen bg-slate-50"><section className="border-b border-emerald-100 bg-white px-5 py-14 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><p className="text-sm font-bold uppercase tracking-[3px] text-emerald-700">Live Hazard Intelligence</p><h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">Explore Hazard Red Zones</h1><p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">Circular risk areas are rendered from the latest GIS and ML assessment stored in the operational database.</p></div></section><section className="px-5 py-10 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><LocationSearch zones={zones} onLocationSelect={setSelectedLocation} />{error && <p className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]"><div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm"><RedZoneMap zones={zones} selectedZone={selectedLocation} onLocationSelect={setSelectedLocation} /><RiskLegend /><div className="absolute left-4 top-4 z-[1000] rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-semibold text-white backdrop-blur">{zones.length} live zones</div></div><RiskInfo location={selectedLocation} /></div></div></section></main>;
}
