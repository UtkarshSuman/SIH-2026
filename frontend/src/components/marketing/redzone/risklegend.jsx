export default function RiskLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] rounded-xl border border-white/10 bg-slate-950/85 p-4 text-white shadow-xl backdrop-blur">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-300">
        Risk Level
      </p>

      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span>High Risk</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          <span>Moderate Risk</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <span>Low Risk</span>
        </div>
      </div>
    </div>
  );
}