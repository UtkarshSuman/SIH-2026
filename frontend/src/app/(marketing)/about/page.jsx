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

const principles = [
  {
    number: "01",
    title: "Preparedness First",
    description:
      "The best response starts before a disaster happens. Rescue Arc focuses on turning early risk signals into active preparedness.",
  },
  {
    number: "02",
    title: "Clarity Over Complexity",
    description:
      "Disaster data can be overwhelming. We present satellite, river gauge, and thermal sensor signals clearly for responders and citizens.",
  },
  {
    number: "03",
    title: "Technology With Purpose",
    description:
      "Geospatial AI and real-time telemetry serve one core mission: keeping communities safe and preserving natural forest ecosystems.",
  },
  {
    number: "04",
    title: "Authority & Field Coordination",
    description:
      "True resilience happens when NDRF battalions, SDMA cells, forest protection units, and citizens operate on a single shared dashboard.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[#fbfdfb] min-h-screen text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      <Navbar />

      <main className="flex-1 w-full pt-28 pb-20">
        
        {/* HERO */}
        <section className="relative px-5 sm:px-8 lg:px-12 py-12 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 shadow-xs mb-4">
            <ShieldCheckIcon size={16} className="text-emerald-700" /> About Rescue Arc
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Building Safer Communities & <span className="text-emerald-700">Resilient Tomorrow</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Rescue Arc is a monorepo geospatial disaster intelligence platform built for Smart India Hackathon, connecting satellite observations with NDRF and state emergency responders.
          </p>
        </section>

        {/* CORE PRINCIPLES GRID */}
        <section className="px-5 sm:px-8 lg:px-12 py-10 max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">
            Our Core Principles
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((item) => (
              <div
                key={item.number}
                className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-400 hover:shadow-md"
              >
                <div className="text-2xl font-extrabold text-emerald-800 mb-3">{item.number}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* MISSION STATEMENT BOX */}
          <div className="mt-16 rounded-3xl border border-emerald-300 bg-gradient-to-r from-[#f0fdf4] via-[#e6f4ea] to-[#f4fbf7] p-8 lg:p-12 text-center shadow-md">
            <h3 className="text-2xl font-extrabold text-slate-900">
              Integrated with National & State Response Forces
            </h3>
            <p className="mt-3 text-sm text-slate-700 max-w-xl mx-auto leading-relaxed">
              From MODIS canopy thermal sensors to Central Water Commission gauges, Rescue Arc bridges tech innovation with official responder workflows.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-7 py-3 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
