import Image from "next/image";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";

function PhoneCallIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export default async function LoginPage({ searchParams }) {
  const { mode } = await searchParams;
  const initialMode = mode === "register" ? "register" : "login";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f4fbf7] via-white to-[#f0fdf4] px-4 py-6 font-sans text-slate-800 flex flex-col justify-between selection:bg-emerald-200 selection:text-emerald-950">
      {/* BACKGROUND PATTERN */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.035]"
        style={{
          backgroundImage: "url('/background-image.png')",
        }}
      />

      {/* SOFT SAGE & EMERALD BLUR ORBS */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 top-12 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 bottom-20 h-96 w-96 rounded-full bg-teal-100/50 blur-3xl" />

      {/* TOP BAR */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-2 sm:px-6">
        {/* LOGO */}
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50 p-1 shadow-sm">
            <Image
              src="/logo.jpeg"
              alt="Rescue Arc Logo"
              fill
              priority
              sizes="44px"
              className="object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold leading-none tracking-tight text-slate-900">
              Rescue <span className="text-emerald-700">Arc</span>
            </span>
            <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-emerald-800/80">
              NDRF & Forest Response Hub
            </span>
          </div>
        </Link>

        {/* RIGHT ACTION: BACK TO HOME & HOTLINE */}
        <div className="flex items-center gap-3">
          <a
            href="tel:1078"
            className="hidden sm:flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-900 shadow-xs hover:bg-amber-100 transition-all"
          >
            <PhoneCallIcon size={14} />
            Hotline: 1078
          </a>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-900 transition-all"
          >
            <span>&larr;</span> Back to Home
          </Link>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <section className="relative z-10 mx-auto my-auto flex w-full max-w-5xl items-center justify-center py-8">
        <AuthCard initialMode={initialMode} />
      </section>

      {/* FOOTER */}
      <footer className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-4 text-xs text-slate-500 border-t border-emerald-200/50 pt-4">
        <span>© {new Date().getFullYear()} Rescue Arc &bull; Smart India Hackathon</span>
        <span className="hidden sm:inline font-medium text-emerald-800">
          NDRF & State Disaster Management Authority Telemetry Gateway
        </span>
      </footer>
    </main>
  );
}
