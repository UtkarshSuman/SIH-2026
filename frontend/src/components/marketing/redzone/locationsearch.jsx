"use client";

import { useState } from "react";

export default function LocationSearch({ onLocationSelect }) {
  const [search, setSearch] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();

    if (!search.trim()) return;

    onLocationSelect({
      name: search.trim(),
      coordinates: [30.556, 79.564],
      risk: "High Risk",
    });
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search a location..."
        className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />

      <button
        type="submit"
        className="shrink-0 rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Search
      </button>
    </form>
  );
}