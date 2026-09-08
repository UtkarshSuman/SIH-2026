import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/footer";

function ShieldCheckIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

const steps = [
  {
    number: "01",
    label: "COLLECT",
    title: "Geospatial & Telemetry Gathering",
    description:
      "Rescue Arc brings together MODIS satellite thermal hotspots, CWC river basin telemetry, and mountain slope displacement sensors into one unified view.",
    tagColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  {
    number: "02",
    label: "ANALYZE",
    title: "AI Risk Vector Contours",
    description:
      "Machine learning models evaluate developing environmental threats, calculating flood inundation timelines and wildfire propagation contours.",
    tagColor: "bg-teal-100 text-teal-900 border-teal-300",
  },
  {
    number: "03",
    label: "DISPATCH",
    title: "NDRF & SDMA Alert Trigger",
    description:
      "High-confidence alerts trigger automated dispatches to NDRF 24x7 Control Rooms, State SDMA cells, and village disaster committees.",
    tagColor: "bg-amber-100 text-amber-900 border-amber-300",
  },
  {
    number: "04",
    label: "EVACUATE",
    title: "Citizen Safe Route Navigation",
    description:
      "Affected citizens receive real-time safe route guidance away from hazard contours while NDRF inflatable rescue boats deploy dynamically.",
    tagColor: "bg-blue-100 text-blue-900 border-blue-300",
  },
  {
    number: "05",
    label: "RESTORE",
    title: "Post-Disaster Resource Allocation",
    description:
      "Emergency medical camps, relief shelters, and forest restoration teams receive dynamic priority mapping for rapid recovery.",
    tagColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-[#fbfdfb] min-h-screen text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      <Navbar />

      <main className="flex-1 w-full pt-28 pb-20">
        
        {/* HERO */}
        <section className="relative px-5 sm:px-8 lg:px-12 py-12 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 shadow-xs mb-4">
            <ShieldCheckIcon size={16} className="text-emerald-700" /> Rapid Response Protocol
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            How <span className="text-emerald-700">Rescue Arc</span> Operates
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From early satellite observation to NDRF ground force mobilization — five synchronized steps protecting lives and natural ecosystems.
          </p>
        </section>

        {/* STEPS LIST */}
        <section className="px-5 sm:px-8 lg:px-12 py-10 max-w-5xl mx-auto space-y-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-emerald-200 bg-white p-7 shadow-sm transition-all duration-300 hover:border-emerald-400 hover:shadow-md flex flex-col md:flex-row items-start md:items-center gap-6"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900 font-extrabold text-xl border border-emerald-300">
                {step.number}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${step.tagColor}`}>
                    {step.label}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}

          {/* CTA */}
          <div className="mt-16 rounded-3xl border border-emerald-300 bg-gradient-to-r from-[#f0fdf4] via-[#e6f4ea] to-[#f4fbf7] p-8 text-center shadow-md">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Need Immediate Authority Integration?
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-lg mx-auto">
              Call the NDRF Helpline 1078 or register your local disaster management cell.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="tel:1078"
                className="rounded-xl bg-amber-500 hover:bg-amber-600 px-7 py-3 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
              >
                NDRF Helpline 1078
              </a>
              <Link
                href="/register"
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-7 py-3 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
              >
                Register Official Cell
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
