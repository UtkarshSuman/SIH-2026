"use client";

import { useState } from "react";
import LocationSearch from "./locationsearch";
import RedZoneMap from "./redzonemap";
import RiskLegend from "./risklegend";
import RiskInfo from "./riskinfo";

export default function RedZoneSection() {
  const [selectedLocation, setSelectedLocation] = useState(null);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="border-b border-emerald-100 bg-white px-5 py-14 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[3px] text-emerald-700">
            Live Hazard Intelligence
          </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Explore Hazard Red Zones
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600">
            Search a location to explore its current hazard risk, affected
            areas, and population vulnerability using geospatial hazard
            intelligence.
          </p>
        </div>
      </section>

      {/* Map Section */}
      <section className="px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <LocationSearch onLocationSelect={setSelectedLocation} />

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
              <RedZoneMap
                selectedLocation={selectedLocation}
                onLocationSelect={setSelectedLocation}
              />

              <RiskLegend />

              <div className="absolute left-4 top-4 z-[1000] flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-semibold text-white backdrop-blur">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Live Map
              </div>
            </div>

            <RiskInfo location={selectedLocation} />
          </div>
        </div>
      </section>
    </main>
  );
}