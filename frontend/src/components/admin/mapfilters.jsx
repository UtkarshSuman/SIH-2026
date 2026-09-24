"use client";

import { Filter, RotateCcw } from "lucide-react";

const hazardTypes = [
  "All",
  "Landslide",
  "Flood",
  "Earthquake",
  "Cyclone",
  "Drought",
  "Forest Fire",
];

const riskLevels = ["All", "High", "Moderate", "Low"];

const states = [
  "All",
  "Uttarakhand",
  "Odisha",
  "Assam",
  "Kerala",
  "Gujarat",
  "Bihar",
  "Jammu and Kashmir",
];

export default function Mapfilters({ filters, setFilters }) {
  function updateFilter(name, value) {
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetFilters() {
    setFilters({
      hazardType: "All",
      riskLevel: "All",
      state: "All",
      district: "All",
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
        <Filter size={20} className="text-slate-700" />

        <h3 className="font-bold text-[#0b1838]">Map Filters</h3>
      </div>

      {/* Hazard Type */}
      <div className="mt-5">
        <p className="mb-3 text-sm font-semibold text-[#0b1838]">Hazard Type</p>

        <div className="space-y-2">
          {hazardTypes.map((hazard) => (
            <label
              key={hazard}
              className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
            >
              <input
                type="radio"
                name="hazardType"
                checked={filters.hazardType === hazard}
                onChange={() => updateFilter("hazardType", hazard)}
                className="accent-emerald-600"
              />

              {hazard}
            </label>
          ))}
        </div>
      </div>

      {/* Risk Level */}
      <div className="mt-6">
        <p className="mb-3 text-sm font-semibold text-[#0b1838]">Risk Zone</p>

        <div className="space-y-2">
          {riskLevels.map((risk) => (
            <label
              key={risk}
              className="flex cursor-pointer items-center gap-2 text-sm text-slate-600"
            >
              <input
                type="radio"
                name="riskLevel"
                checked={filters.riskLevel === risk}
                onChange={() => updateFilter("riskLevel", risk)}
                className="accent-emerald-600"
              />

              {risk === "High" && (
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              )}

              {risk === "Moderate" && (
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              )}

              {risk === "Low" && (
                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              )}

              {risk === "All" && "All Risk Zones"}

              {risk !== "All" && `${risk} Risk Zone`}
            </label>
          ))}
        </div>
      </div>

      {/* State */}
      <div className="mt-6">
        <label className="mb-2 block text-sm font-semibold text-[#0b1838]">
          State
        </label>

        <select
          value={filters.state}
          onChange={(event) => updateFilter("state", event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-emerald-500"
        >
          {states.map((state) => (
            <option key={state}>{state}</option>
          ))}
        </select>
      </div>

      {/* District */}
      <div className="mt-5">
        <label className="mb-2 block text-sm font-semibold text-[#0b1838]">
          District
        </label>

        <select
          value={filters.district}
          onChange={(event) => updateFilter("district", event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-emerald-500"
        >
          <option>All</option>
          <option>Chamoli</option>
          <option>Puri</option>
          <option>Dhemaji</option>
          <option>Wayanad</option>
          <option>Kutch</option>
          <option>Srinagar</option>
          <option>Nalanda</option>
          <option>Kamrup Metropolitan</option>
        </select>
      </div>

      {/* Reset */}
      <button
        onClick={resetFilters}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        <RotateCcw size={16} />
        Reset Filters
      </button>
    </div>
  );
}
