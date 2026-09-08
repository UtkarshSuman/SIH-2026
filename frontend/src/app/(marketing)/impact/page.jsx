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

const stats = [
  { value: "5,000+", label: "Vulnerable Habitations Assessed" },
  { value: "850+", label: "Hazard-Based Red Zones Classified" },
  { value: "1,200+", label: "Settlements Flagged for Relocation" },
  { value: "96.2%", label: "Carrying Capacity Model Accuracy" },
];

export default function ImpactPage() {
  return (
    <div className="bg-[#fbfdfb] min-h-screen text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      <Navbar />

      <main className="flex-1 w-full pt-28 pb-20">
        
        {/* HERO */}
        <section className="relative px-5 sm:px-8 lg:px-12 py-12 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900 shadow-xs mb-4">
            <ShieldCheckIcon size={16} className="text-emerald-700" /> Operational Impact
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Measurable <span className="text-emerald-700">Red Zone & Relocation Impact</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Rescue Arc translates geospatial AI and carrying capacity modeling into real-world vulnerable habitation assessments and relocation outcomes across India.
          </p>
        </section>

        {/* METRICS GRID */}
        <section className="px-5 sm:px-8 lg:px-12 py-10 max-w-7xl mx-auto">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-emerald-200 bg-white p-7 shadow-sm text-center"
              >
                <div className="text-4xl font-extrabold text-slate-900 mb-2">{s.value}</div>
                <div className="text-xs font-semibold text-slate-600 leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-3xl border border-emerald-300 bg-gradient-to-r from-[#f0fdf4] via-[#e6f4ea] to-[#f4fbf7] p-8 lg:p-12 text-center shadow-md">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Join India's Hazard-Based Red Zone Intelligence Network
            </h2>
            <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
              Onboard your district authority to Rescue Arc for red zone assessment and relocation planning.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-7 py-3 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
              >
                Register Authority
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
