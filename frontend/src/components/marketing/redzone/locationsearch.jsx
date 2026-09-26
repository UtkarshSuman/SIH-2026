"use client";

import { useMemo, useState } from "react";

export default function LocationSearch({ zones, onLocationSelect }) {
  const [search, setSearch] = useState("");
  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return zones.filter((zone) => [zone.name, zone.district, zone.state, zone.zoneId].some((value) => value.toLowerCase().includes(query))).slice(0, 6);
  }, [search, zones]);

  return (
    <div className="relative max-w-2xl">
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search a zone, district, or state..."
        className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
      {matches.length > 0 && (
        <div className="absolute z-[1100] mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {matches.map((zone) => (
            <button key={zone.zoneId} type="button" onClick={() => { onLocationSelect(zone); setSearch(zone.name); }} className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm last:border-0 hover:bg-slate-50">
              <span className="font-semibold text-slate-900">{zone.name}</span><span className="ml-2 text-xs text-slate-500">{zone.zoneColor} · {zone.district}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
