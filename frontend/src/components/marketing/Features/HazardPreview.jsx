"use client";

export default function HazardPreview({
  title = "Flood Risk",
  status = "High Risk Area",
}) {
  return (
    <div className="relative min-h-[500px] overflow-hidden rounded-[28px] border border-white/10 bg-[#0b281a] p-6">
      {/* Map background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-70"
        style={{
          backgroundImage: "url('/background-image.png')",
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#061b10]/55" />

      {/* Content */}
      <div className="relative z-10 flex h-full min-h-[450px] flex-col justify-between">
        {/* Top */}
        <div className="flex items-center justify-between">
          <div className="rounded-full border border-white/10 bg-[#09291a]/80 px-4 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-white/60">
            <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#aaf27d]" />
            Live Hazard Map
          </div>

          <div className="rounded-xl border border-white/10 bg-[#09291a]/80 px-3 py-2 text-[10px] text-white/50">
            LIVE
          </div>
        </div>

        {/* Hazard marker */}
        <div className="relative flex flex-1 items-center justify-center">
          <div className="absolute h-28 w-28 rounded-full bg-[#ff7656]/10" />

          <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-[#ff7656] text-white shadow-[0_0_35px_rgba(255,100,70,.5)]">
            ●
          </div>

          <div className="absolute ml-52 mt-[-100px] rounded-2xl border border-white/10 bg-[#10281b]/90 px-4 py-3 backdrop-blur-xl">
            <div className="text-xs font-bold text-white">{title}</div>

            <div className="mt-1 text-[9px] font-bold text-[#ff9b83]">
              {status}
            </div>
          </div>
        </div>

        {/* Bottom analysis card */}
        <div className="rounded-[20px] border border-white/10 bg-[#092719]/90 p-5 backdrop-blur-xl">
          <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/35">
            AI ANALYSIS
          </div>

          <div className="mt-2 flex items-end justify-between gap-5">
            <div>
              <div className="text-sm font-semibold text-white">
                Risk detected in monitored area
              </div>

              <div className="mt-1 text-[10px] text-white/40">
                Continuous geospatial monitoring active
              </div>
            </div>

            <div className="text-right">
              <div className="text-[9px] font-semibold text-white/30">
                CONFIDENCE
              </div>

              <div className="mt-1 text-xl font-bold text-[#aaf27d]">94%</div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-[9px] font-semibold text-white/40">
              ● REAL-TIME MONITORING
            </span>

            <span className="text-[9px] font-bold text-white/40">
              RISK: <span className="text-[#ff957c]">HIGH</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
