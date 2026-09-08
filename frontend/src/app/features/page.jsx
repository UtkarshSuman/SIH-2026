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

const features = [
  {
    number: "01",
    title: "Flood Red Zone Delineation",
    description:
      "Identify flood-prone habitations using CWC river gauge data, terrain elevation models, and Sentinel-1 SAR inundation mapping for red zone classification.",
    status: "CWC SYNCED",
    tagColor: "bg-amber-100 text-amber-900 border-amber-300",
  },
  {
    number: "02",
    title: "Seismic & Earthquake Zonation",
    description:
      "Map seismic vulnerability of settlements using BIS seismic zonation data, fault-line proximity, and soil amplification factors.",
    status: "GSI ACTIVE",
    tagColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  {
    number: "03",
    title: "Landslide Susceptibility Index",
    description:
      "Assess slope instability, soil saturation, and rainfall thresholds around hill settlements to determine red zone boundaries.",
    status: "GSI MAPPED",
    tagColor: "bg-blue-100 text-blue-900 border-blue-300",
  },
  {
    number: "04",
    title: "Carrying Capacity AI Engine",
    description:
      "Evaluate terrain load-bearing capacity, population density thresholds, and infrastructure stress to flag over-capacity settlements.",
    status: "AI ACTIVE",
    tagColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  {
    number: "05",
    title: "Relocation Priority Scoring",
    description:
      "Compute multi-hazard relocation urgency scores combining red zone severity, capacity exceedance, and vulnerability indices.",
    status: "DECISION READY",
    tagColor: "bg-teal-100 text-teal-900 border-teal-300",
  },
  {
    number: "06",
    title: "Authority Decision Dashboard",
    description:
      "Provide NDMA and DDMA authorities with real-time red zone maps, settlement risk profiles, and relocation priority rankings.",
    status: "NDMA SYNCED",
    tagColor: "bg-amber-100 text-amber-900 border-amber-300",
  },
];

export default function FeaturesPage() {
  return (
    <div className="bg-[#fbfdfb] min-h-screen text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      <Navbar />

      <main className="flex-1 w-full pt-28 pb-20">
        
        {/* HERO SECTION */}
        <section className="relative px-5 sm:px-8 lg:px-12 py-12 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 shadow-xs mb-4">
            <ShieldCheckIcon size={16} className="text-emerald-700" /> Red Zone Intelligence Engine
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Features Built for <span className="text-emerald-700">Vulnerable Settlement Safety</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Rescue Arc aggregates multi-hazard data, carrying capacity models, and settlement vulnerability indices into a unified red zone intelligence platform.
          </p>
        </section>

        {/* FEATURES GRID */}
        <section className="px-5 sm:px-8 lg:px-12 py-10 max-w-7xl mx-auto">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((item) => (
              <div
                key={item.number}
                className="rounded-2xl border border-emerald-200 bg-white p-7 shadow-sm transition-all duration-300 hover:border-emerald-400 hover:shadow-md hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-extrabold text-emerald-800">{item.number}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${item.tagColor}`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* CTA BANNER */}
          <div className="mt-16 rounded-3xl border border-emerald-300 bg-gradient-to-r from-[#f0fdf4] via-[#e6f4ea] to-[#f4fbf7] p-8 lg:p-12 text-center shadow-md">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Ready to Explore Live Intelligence?
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
              View the red zone intelligence map or register your authority for settlement assessments.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-7 py-3 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
              >
                Assess Your Settlement
              </Link>
              <Link
                href="/#authorities"
                className="rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 px-7 py-3 text-xs font-semibold text-emerald-900 shadow-xs transition-all hover:-translate-y-0.5"
              >
                View Red Zone Map
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
