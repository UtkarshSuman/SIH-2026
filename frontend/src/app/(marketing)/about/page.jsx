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
    title: "Red Zone Mapping",
    description:
      "Intelligently classify hazard-based red zones using multi-parameter geospatial analysis — seismic, flood, landslide, and cyclone risk overlays for every habitation.",
  },
  {
    number: "02",
    title: "Carrying Capacity Assessment",
    description:
      "Evaluate terrain load-bearing limits, population density thresholds, and infrastructure stress to determine whether settlements can safely sustain their current population.",
  },
  {
    number: "03",
    title: "Relocation Prioritization",
    description:
      "Combine red zone severity scores with carrying capacity exceedance data to generate relocation urgency rankings for vulnerable habitations across districts.",
  },
  {
    number: "04",
    title: "Authority Decision Support",
    description:
      "Equip NDMA, DDMA, and State Disaster Management Authorities with real-time dashboards for evidence-based relocation decisions and resource allocation.",
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
            Safeguarding Vulnerable Settlements Through <span className="text-emerald-700">Intelligent Hazard Analysis</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Rescue Arc is a geospatial intelligence platform built for SIH Problem 26191 — intelligently identifying hazard-based red zones, assessing carrying capacity, and determining immediate relocation needs for vulnerable habitations across India.
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
              Integrated with NDMA, DDMA & State Disaster Management Authorities
            </h3>
            <p className="mt-3 text-sm text-slate-700 max-w-xl mx-auto leading-relaxed">
              From satellite hazard overlays to carrying capacity AI models, Rescue Arc bridges geospatial innovation with official authority workflows for vulnerable habitation relocation.
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
