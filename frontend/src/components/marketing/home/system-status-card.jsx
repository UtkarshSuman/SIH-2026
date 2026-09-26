const systems = [
  {
    name: "Hazard Data Feeds",
    status: "Active",
    icon: "▣",
  },
  {
    name: "Satellite Processing",
    status: "Live",
    icon: "◈",
  },
  {
    name: "Authority Sync",
    status: "Connected",
    icon: "♧",
  },
  {
    name: "Risk Analysis Engine",
    status: "Running",
    icon: "〽",
  },
];

export default function SystemStatusCard() {
  return (
    <div className="rounded-[24px] border border-emerald-100 bg-white p-7 shadow-[0_20px_60px_rgba(0,100,70,0.08)] sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />

          <h2 className="text-lg font-bold text-slate-900">
            Live System Status
          </h2>
        </div>

        <span className="text-sm font-semibold text-emerald-700">
          All Systems Operational
        </span>
      </div>

      {/* System List */}
      <div>
        {systems.map((system) => (
          <div
            key={system.name}
            className="flex items-center justify-between border-b border-slate-100 py-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-700">
                {system.icon}
              </div>

              <span className="font-medium text-slate-800">{system.name}</span>
            </div>

            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
              {system.status}
            </span>
          </div>
        ))}
      </div>

      {/* Risk Monitoring */}
      <div className="mt-6 rounded-2xl bg-emerald-50 p-5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-800">Risk monitoring</span>

          <span className="font-bold text-emerald-700">Operational</span>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-emerald-100">
          <div className="h-full w-[95%] rounded-full bg-emerald-600" />
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Multi-hazard data processing and settlement risk assessment.
        </p>
      </div>
    </div>
  );
}