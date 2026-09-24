"use client";

import dynamic from "next/dynamic";

const Hazardmapview = dynamic(() => import("./hazardmapview"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[680px] items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
      <p className="text-sm text-slate-500">Loading hazard map...</p>
    </div>
  ),
});

export default function Hazardmap({
  locations = [],
  zones = [],
  selectedLocation,
  onLocationSelect,
  loading = false,
}) {
  return (
    <div>
      {/* Map Header */}
      <div className="mb-3 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0b1838]">
            Hazard & Risk Zone Map
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Interactive map showing high, moderate and low risk zones across
            India.
          </p>
        </div>

        {/* Search */}
        <div className="flex w-full sm:w-[280px]">
          <input
            type="text"
            placeholder="Search district, city or village..."
            className="w-full rounded-l-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />

          <button className="rounded-r-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800">
            Search
          </button>
        </div>
      </div>

      {/* Map */}
      {loading ? (
        <div className="flex h-[680px] items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
          <p className="text-sm text-slate-500">Loading hazard data...</p>
        </div>
      ) : (
        <Hazardmapview
          locations={locations}
          zones={zones}
          selectedLocation={selectedLocation}
          onLocationSelect={onLocationSelect}
        />
      )}
    </div>
  );
}
