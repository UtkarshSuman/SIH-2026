import Link from "next/link";

export default function RiskInfo({ location }) {
  if (!location) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[2px] text-emerald-700">
          Risk Information
        </p>

        <h2 className="mt-3 text-2xl font-bold text-slate-950">
          Select a location
        </h2>

        <p className="mt-3 leading-7 text-slate-600">
          Search for a location or select a marker on the map to view its
          available hazard information.
        </p>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-[2px] text-emerald-700">
        Risk Information
      </p>

      <h2 className="mt-3 text-2xl font-bold text-slate-950">
        {location.name}
      </h2>

      <div className="mt-6 rounded-xl bg-red-50 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-red-600">
          Risk Level
        </p>

        <p className="mt-1 text-2xl font-bold text-red-700">
          {location.risk}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Primary Hazard
          </p>

          <p className="mt-1 font-semibold text-slate-800">
            Landslide / Geological Hazard
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Affected Population
          </p>

          <p className="mt-1 font-semibold text-slate-800">
            Data available in detailed report
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Last Updated
          </p>

          <p className="mt-1 font-semibold text-slate-800">
            Demo data
          </p>
        </div>
      </div>

      <Link
        href={`/login?redirect=/redzone`}
        className="mt-7 flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
      >
        View Detailed Report
        <span className="ml-2">→</span>
      </Link>
    </aside>
  );
}