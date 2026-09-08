import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/footer";

function PhoneCallIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <div className="bg-[#fbfdfb] min-h-screen text-slate-800 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      <Navbar />

      <main className="flex-1 w-full pt-28 pb-20">
        
        {/* HERO */}
        <section className="relative px-5 sm:px-8 lg:px-12 py-12 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 shadow-xs mb-4">
            <PhoneCallIcon size={16} className="text-amber-700" /> Emergency & Authority Contact
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Connect with <span className="text-emerald-700">Rescue Arc</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Reach out for red zone assessment integration, carrying capacity onboarding, or relocation planning technical support.
          </p>
        </section>

        {/* CONTACT OPTIONS GRID */}
        <section className="px-5 sm:px-8 lg:px-12 py-10 max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
          
          {/* NDRF EMERGENCY HOTLINE CARD */}
          <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-8 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-900 mb-2">
              National Emergency Response
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
              NDMA Toll-Free Emergency Hotline
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed mb-6">
              For active disaster emergencies or urgent red zone relocation coordination requiring National Disaster Management Authority response:
            </p>
            <div className="space-y-3">
              <a
                href="tel:1078"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-6 py-3 text-xs font-bold text-white shadow-sm transition-all"
              >
                <PhoneCallIcon size={16} /> NDMA Helpline: 1078
              </a>
              <div className="text-xs font-bold text-slate-800">
                National Emergency Response Center: <span className="text-amber-900">112</span>
              </div>
            </div>
          </div>

          {/* ORGANIZATION ONBOARDING CARD */}
          <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
               Authority Onboarding
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">
               Register Red Zone Assessment Cell
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              District collectors, DDMA officers, GSI officials, and state disaster management authorities can apply for red zone intelligence API access.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-6 py-3 text-xs font-bold text-white shadow-sm transition-all"
            >
              Register Authority Cell &rarr;
            </Link>
          </div>

        </section>

      </main>

      <Footer />
    </div>
  );
}
