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
    title: "Forest Fires & Wildfire Detection",
    description:
      "Detect canopy thermal hotspots and fire vectors using MODIS satellite imagery and forest moisture indices.",
    status: "MODIS SYNCED",
    tagColor: "bg-amber-100 text-amber-900 border-amber-300",
  },
  {
    number: "02",
    title: "River Basin Flood Risk Gauges",
    description:
      "Monitor river inundation and streamflow levels in real time via Central Water Commission telemetry.",
    status: "CWC LIVE",
    tagColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  {
    number: "03",
    title: "NDRF Force Dispatch Matrix",
    description:
      "Automated threat triangulation directly connected with NDRF 24x7 Control Rooms and SDMA cells.",
    status: "NDRF READY",
    tagColor: "bg-blue-100 text-blue-900 border-blue-300",
  },
  {
    number: "04",
    title: "Landslide Slope Susceptibility",
    description:
      "Identify vulnerable mountainous corridors, soil moisture saturation, and slope displacement risks.",
    status: "SLOPE SENSORS",
    tagColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  {
    number: "05",
    title: "Citizen Safe Evacuation Routing",
    description:
      "Map real-time safe routes and relief shelter locations for affected local communities.",
    status: "SAFE ROUTES",
    tagColor: "bg-teal-100 text-teal-900 border-teal-300",
  },
  {
    number: "06",
    title: "Geospatial Early Alert Dispatch",
    description:
      "Disseminate SMS, mobile app, and local siren alerts in under 3 minutes during emerging crises.",
    status: "< 3 MIN DISPATCH",
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
            <ShieldCheckIcon size={16} className="text-emerald-700" /> Multi-Hazard Intelligence Matrix
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Features Built for <span className="text-emerald-700">Resilience</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Rescue Arc aggregates satellite observations, environmental telemetry, and NDRF readiness metrics into a single natural interface.
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
              View the real-time hazard map or register your organization for early warnings.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-7 py-3 text-xs font-bold text-white shadow-sm transition-all hover:-translate-y-0.5"
              >
                Register for Alerts
              </Link>
              <Link
                href="/#authorities"
                className="rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 px-7 py-3 text-xs font-semibold text-emerald-900 shadow-xs transition-all hover:-translate-y-0.5"
              >
                View NDRF Matrix
              </Link>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
