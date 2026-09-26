import Link from "next/link";

export default function HomeSection() {
  return (
    <section className="min-h-[calc(100vh-76px)] bg-slate-50">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-14 lg:flex lg:min-h-[calc(100vh-76px)] lg:items-center lg:px-16 lg:py-16">
        {/* LEFT CONTENT */}
        <div className="w-full lg:w-[58%]">
          {/* EYEBROW */}
          <p className="mb-5 text-xs font-bold uppercase tracking-[2.5px] text-emerald-700 sm:text-sm sm:tracking-[3px]">
            Safer Communities. Smarter Decisions.
          </p>

          {/* HEADING */}
          <h1 className="max-w-[720px] text-5xl font-extrabold leading-[1.04] tracking-[-2px] text-slate-950 sm:text-6xl lg:text-7xl">
            Identify Risk.
            <br />
            Enable <span className="text-emerald-700">Safer</span>
            <br />
            <span className="text-emerald-700">Communities.</span>
          </h1>

          {/* DESCRIPTION */}
          <p className="mt-7 max-w-[700px] text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Rescue Arc uses geospatial intelligence and multi-hazard risk
            modeling to identify hazard-based red zones, assess settlement
            vulnerability, and support evidence-based relocation planning across
            India.
          </p>

          {/* BUTTONS */}
          <div className="mt-8 flex flex-wrap gap-3 sm:mt-9 sm:gap-4">
            <Link
              href="/redzone"
              className="rounded-xl bg-emerald-700 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-800 sm:px-7 sm:py-4 sm:text-base"
            >
              Explore Live Map →
            </Link>

            <Link
              href="/redzone"
              className="rounded-xl bg-red-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-red-700 sm:px-7 sm:py-4 sm:text-base"
            >
              🔔 Get Alerts →
            </Link>
          </div>

          {/* TRUST INDICATORS */}
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 border-t border-slate-200 pt-6 text-xs font-medium text-slate-600 sm:mt-10 sm:text-sm">
            <span>
              <span className="mr-2 text-emerald-700">✓</span>
              Multi-Hazard Data
            </span>

            <span>
              <span className="mr-2 text-emerald-700">✓</span>
              Evidence-Based Planning
            </span>

            <span>
              <span className="mr-2 text-emerald-700">✓</span>
              Authority Support
            </span>
          </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="mt-14 w-full lg:mt-0 lg:w-[42%] lg:pl-16">
          {/* INTRO */}
          <div className="mb-7 max-w-md">
            <p className="text-xs font-bold uppercase tracking-[2px] text-slate-500 sm:text-sm">
              One Platform. Multiple Decisions.
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              From identifying hazardous locations to understanding affected
              communities, Rescue Arc brings critical risk information into one
              place.
            </p>
          </div>

          {/* INFORMATION BLOCKS */}
          <div className="border-t border-slate-200">
            {/* ITEM 1 */}
            <div className="flex gap-4 border-b border-slate-200 py-5 sm:gap-5 sm:py-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <span className="text-lg">◉</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  Red Zone Identification
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                  Locate areas exposed to significant hazard risks using spatial
                  risk information.
                </p>
              </div>
            </div>

            {/* ITEM 2 */}
            <div className="flex gap-4 border-b border-slate-200 py-5 sm:gap-5 sm:py-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <span className="text-lg">⌖</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  Settlement Vulnerability
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                  Understand affected populations and settlement-level
                  vulnerability before planning relocation.
                </p>
              </div>
            </div>

            {/* ITEM 3 */}
            <div className="flex gap-4 border-b border-slate-200 py-5 sm:gap-5 sm:py-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <span className="text-lg">↗</span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                  Safer Relocation Planning
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
                  Support authorities in evaluating safer locations and
                  relocation requirements.
                </p>
              </div>
            </div>
          </div>

          {/* STATUS */}
          <div className="mt-6 flex items-center gap-3 text-xs font-medium text-slate-500 sm:text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600" />
            Built for disaster risk awareness and planning
          </div>
        </div>
      </div>
    </section>
  );
}