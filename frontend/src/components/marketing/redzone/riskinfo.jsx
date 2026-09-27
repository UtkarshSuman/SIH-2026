export default function RiskInfo({ location }) {
  if (!location) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[2px] text-emerald-700">Risk Information</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-950">Select a zone</h2>
        <p className="mt-3 leading-7 text-slate-600">
          Click any circular zone or click anywhere on the map to trigger live GIS fetching & machine learning evaluation.
        </p>
      </aside>
    );
  }

  const badge =
    location.zoneColor === "RED"
      ? "bg-red-50 text-red-700 border-red-200"
      : location.zoneColor === "YELLOW"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[2px] text-emerald-700">
            {location.isClickAnalyzed ? "Live Point Telemetry" : "Database Assessment"}
          </p>
          {location.isClickAnalyzed && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
              Interactive Click
            </span>
          )}
        </div>

        <h2 className="mt-2 text-xl font-bold text-slate-950 leading-snug">{location.name}</h2>

        <div className={`mt-4 rounded-xl border p-4 ${badge}`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Operational Tier</p>
              <p className="mt-0.5 text-2xl font-extrabold">{location.zoneColor} ZONE</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">Composite Risk</p>
              <p className="mt-0.5 text-2xl font-extrabold">{((location.worstScore ?? 0) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3.5 text-sm">
          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Primary Hazard</span>
            <span className="font-bold text-slate-800">{location.worstHazard || "MULTI-HAZARD"}</span>
          </div>

          {location.priority && (
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Action Priority</span>
              <span className="font-bold text-slate-800">
                {location.priority} {location.priorityScore != null ? `(${Number(location.priorityScore).toFixed(2)})` : ""}
              </span>
            </div>
          )}

          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Estimated Population</span>
            <span className="font-semibold text-slate-800">
              {location.population ? Number(location.population).toLocaleString() : "N/A"}
            </span>
          </div>

          <div className="flex justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Center Coordinates</span>
            <span className="font-mono text-xs text-slate-700">
              {Number(location.lat).toFixed(4)}°N, {Number(location.lng).toFixed(4)}°E
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Timestamp</span>
            <p className="mt-0.5 text-xs text-slate-600 font-medium">
              {location.lastAssessedAt ? new Date(location.lastAssessedAt).toLocaleString() : "Live Telemetry"}
            </p>
          </div>
        </div>

        {location.hazardScores && Object.keys(location.hazardScores).length > 0 && (
          <div className="mt-5 rounded-xl bg-slate-50 p-3.5 border border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Model Risk Breakdown
            </p>
            <div className="space-y-1.5 text-xs">
              {Object.entries(location.hazardScores).map(([hazard, score]) => (
                <div key={hazard}>
                  <div className="flex justify-between text-slate-600 text-[11px] mb-0.5">
                    <span className="capitalize">{hazard.toLowerCase()}</span>
                    <span className="font-semibold font-mono">{(Number(score) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        score > 0.6 ? "bg-red-500" : score > 0.35 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, score * 100))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
