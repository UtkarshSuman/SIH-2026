import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";

const features = [
  {
    number: "01",
    title: "Flood Risk Detection",
    description:
      "Identify areas exposed to rising water levels and changing flood conditions before they become critical.",
    status: "LIVE MONITORING",
  },
  {
    number: "02",
    title: "Hazard Intelligence",
    description:
      "Bring multiple disaster signals together to understand where risk is increasing and what requires attention.",
    status: "AI ANALYSIS",
  },
  {
    number: "03",
    title: "Early Warning",
    description:
      "Turn detected risks into timely warnings so communities and response teams can act before conditions worsen.",
    status: "EARLY ALERT",
  },
  {
    number: "04",
    title: "Safe-Zone Intelligence",
    description:
      "Identify safer areas and support better decisions during evacuation and emergency response.",
    status: "SAFETY ROUTING",
  },
  {
    number: "05",
    title: "Risk Analysis",
    description:
      "Analyze environmental and geographic signals to create a clearer picture of potential disaster impact.",
    status: "RISK ENGINE",
  },
  {
    number: "06",
    title: "Emergency Response",
    description:
      "Connect risk information with response workflows so the right information reaches the right people faster.",
    status: "RESPONSE READY",
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-[#061b10] text-white">
      <Navbar />

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative min-h-[70vh] overflow-hidden pt-[68px]">
        {/* Background */}
        <div
          className="
            absolute inset-0
            bg-[radial-gradient(circle_at_50%_20%,rgba(93,180,95,0.16),transparent_45%)]
          "
        />

        <div
          className="
            absolute inset-0
            bg-[linear-gradient(to_bottom,rgba(6,27,16,0.35),#061b10_95%)]
          "
        />

        {/* Grid */}
        <div
          className="
            absolute inset-0
            opacity-[0.08]
            [background-image:linear-gradient(rgba(170,242,125,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(170,242,125,0.5)_1px,transparent_1px)]
            [background-size:70px_70px]
          "
        />

        <div
          className="
            relative z-10
            mx-auto
            flex
            min-h-[70vh]
            max-w-[1400px]
            flex-col
            justify-center
            px-6
            pb-20
            pt-24
            lg:px-10
          "
        >
          {/* =================================================
              LEFT CONTENT
          ================================================== */}
          <div className="relative z-20 lg:max-w-[650px]">
            {/* Eyebrow */}
            <div className="mb-6 flex items-center gap-3">
              <span className="h-[1px] w-10 bg-[#aaf27d]" />

              <span
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.3em]
                  text-[#aaf27d]
                "
              >
                Rescue Arc Platform
              </span>
            </div>

            {/* Heading */}
            <h1
              className="
                max-w-[850px]
                text-5xl
                font-bold
                leading-[0.98]
                tracking-[-0.045em]
                sm:text-6xl
                lg:text-8xl
              "
            >
              Intelligence
              <br />
              <span className="text-[#aaf27d]">before impact.</span>
            </h1>

            {/* Description */}
            <p
              className="
                mt-8
                max-w-[650px]
                text-sm
                leading-7
                text-white/45
                sm:text-base
              "
            >
              Rescue Arc combines hazard intelligence, risk analysis, early
              warnings and safety information into one disaster response
              platform.
            </p>

            {/* Bottom stats */}
            <div
              className="
                mt-14
                grid
                max-w-[700px]
                grid-cols-2
                border-y
                border-white/10
                sm:grid-cols-4
              "
            >
              <div className="border-r border-white/10 py-5 pr-5">
                <p className="text-xl font-bold text-[#aaf27d]">24/7</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/35">
                  Monitoring
                </p>
              </div>

              <div className="border-r-0 border-white/10 py-5 pl-5 sm:border-r">
                <p className="text-xl font-bold text-[#aaf27d]">AI</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/35">
                  Intelligence
                </p>
              </div>

              <div className="border-r border-t border-white/10 py-5 pr-5 sm:border-t-0 sm:pl-5">
                <p className="text-xl font-bold text-[#aaf27d]">LIVE</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/35">
                  Risk Data
                </p>
              </div>

              <div className="border-t border-white/10 py-5 pl-5 sm:border-t-0">
                <p className="text-xl font-bold text-[#aaf27d]">FAST</p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-white/35">
                  Response
                </p>
              </div>
            </div>
          </div>

          {/* =================================================
              RIGHT SIDE — VISUAL INTELLIGENCE PANEL
          ================================================== */}
          <div
            className="
              pointer-events-none
              absolute
              right-8
              top-1/2
              hidden
              w-[390px]
              -translate-y-1/2
              lg:block
              xl:right-16
              2xl:right-20
            "
          >
            {/* Outer glow */}
            <div
              className="
                absolute
                -inset-10
                rounded-full
                bg-[#aaf27d]/[0.035]
                blur-3xl
              "
            />

            {/* Main glass panel */}
            <div
              className="
                relative
                overflow-hidden
                rounded-[28px]
                border
                border-white/10
                bg-[#0a2516]/65
                p-5
                shadow-[0_25px_80px_rgba(0,0,0,0.25)]
                backdrop-blur-xl
              "
            >
              {/* Panel header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#aaf27d]">
                    Live Intelligence
                  </p>

                  <p className="mt-1 text-sm font-semibold text-white/80">
                    Regional Risk Monitor
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#aaf27d] shadow-[0_0_12px_rgba(170,242,125,0.8)]" />

                  <span className="text-[9px] uppercase tracking-[0.15em] text-white/35">
                    Active
                  </span>
                </div>
              </div>

              {/* Radar / map visualization */}
              <div
                className="
                  relative
                  mt-5
                  h-[190px]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#061b10]
                "
              >
                {/* Grid */}
                <div
                  className="
                    absolute inset-0
                    opacity-30
                    [background-image:linear-gradient(rgba(170,242,125,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(170,242,125,0.12)_1px,transparent_1px)]
                    [background-size:38px_38px]
                  "
                />

                {/* Radar rings */}
                <div
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    h-[150px]
                    w-[150px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    border
                    border-[#aaf27d]/10
                  "
                />

                <div
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    h-[105px]
                    w-[105px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    border
                    border-[#aaf27d]/15
                  "
                />

                <div
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    h-[55px]
                    w-[55px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    border
                    border-[#aaf27d]/20
                  "
                />

                {/* Radar sweep */}
                <div
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    h-[75px]
                    w-[1px]
                    origin-bottom
                    -translate-x-1/2
                    -translate-y-full
                    rotate-[35deg]
                    bg-gradient-to-t
                    from-[#aaf27d]/80
                    to-transparent
                  "
                />

                {/* Green — Low Risk */}
                <span
                  className="
                    absolute
                    left-[28%]
                    top-[32%]
                    h-2
                    w-2
                    rounded-full
                    bg-[#aaf27d]
                    shadow-[0_0_15px_rgba(170,242,125,0.95)]
                  "
                />

                {/* Yellow — Warning */}
                <span
                  className="
                    absolute
                    left-[63%]
                    top-[42%]
                    h-2
                    w-2
                    rounded-full
                    bg-[#f4cf68]
                    shadow-[0_0_15px_rgba(244,207,104,0.95)]
                  "
                />

                {/* Green — Low Risk */}
                <span
                  className="
                    absolute
                    left-[48%]
                    top-[68%]
                    h-2
                    w-2
                    rounded-full
                    bg-[#aaf27d]
                    shadow-[0_0_15px_rgba(170,242,125,0.95)]
                  "
                />

                {/* Red — High Risk */}
                <span
                  className="
                    absolute
                    left-[73%]
                    top-[70%]
                    h-2
                    w-2
                    rounded-full
                    bg-[#ff5f5f]
                    shadow-[0_0_15px_rgba(255,95,95,0.95)]
                  "
                />

                {/* Center marker */}
                <div
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    h-3
                    w-3
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    border-2
                    border-[#061b10]
                    bg-[#aaf27d]
                    shadow-[0_0_20px_rgba(170,242,125,0.8)]
                  "
                />
              </div>

              {/* Risk summary */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                  <p className="text-[8px] uppercase tracking-[0.14em] text-white/30">
                    Risk
                  </p>

                  <p className="mt-1 text-sm font-bold text-[#aaf27d]">Low</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                  <p className="text-[8px] uppercase tracking-[0.14em] text-white/30">
                    Signals
                  </p>

                  <p className="mt-1 text-sm font-bold text-white/75">18</p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                  <p className="text-[8px] uppercase tracking-[0.14em] text-white/30">
                    Areas
                  </p>

                  <p className="mt-1 text-sm font-bold text-white/75">07</p>
                </div>
              </div>

              {/* Bottom status */}
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#aaf27d]" />

                  <span className="text-[9px] uppercase tracking-[0.15em] text-white/35">
                    Continuous monitoring
                  </span>
                </div>

                <span className="text-[9px] text-white/25">Updated now</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ====================================================== */}
      <section className="relative border-t border-white/10 bg-[#061b10]">
        <div className="mx-auto max-w-[1300px] px-6 py-24 lg:px-10">
          {/* Section heading */}
          <div className="mb-14 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p
                className="
                  mb-4
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.3em]
                  text-[#aaf27d]
                "
              >
                What Rescue Arc Does
              </p>

              <h2
                className="
                  max-w-[650px]
                  text-3xl
                  font-bold
                  tracking-[-0.035em]
                  sm:text-5xl
                "
              >
                One platform.
                <br />
                <span className="text-white/35">
                  Complete disaster intelligence.
                </span>
              </h2>
            </div>

            <p className="max-w-[400px] text-sm leading-6 text-white/35">
              From detecting emerging hazards to supporting emergency decisions,
              every feature is designed around one goal: helping people act
              earlier.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="
                  group
                  relative
                  min-h-[270px]
                  overflow-hidden
                  bg-[#0a2516]
                  p-7
                  transition-all
                  duration-300
                  hover:bg-[#102e1c]
                "
              >
                {/* Number */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-[0.2em] text-white/20">
                    {feature.number}
                  </span>

                  <span
                    className="
                      rounded-full
                      border
                      border-[#aaf27d]/20
                      px-3
                      py-1
                      text-[8px]
                      font-bold
                      tracking-[0.15em]
                      text-[#aaf27d]/70
                    "
                  >
                    {feature.status}
                  </span>
                </div>

                {/* Icon / indicator */}
                <div
                  className="
                    mt-10
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-[#aaf27d]/20
                    bg-[#aaf27d]/5
                  "
                >
                  <span className="h-2 w-2 rounded-full bg-[#aaf27d] shadow-[0_0_12px_rgba(170,242,125,0.7)]" />
                </div>

                <h3 className="mt-6 text-xl font-bold tracking-[-0.02em]">
                  {feature.title}
                </h3>

                <p className="mt-3 max-w-[320px] text-xs leading-6 text-white/35">
                  {feature.description}
                </p>

                {/* Hover line */}
                <div
                  className="
                    absolute
                    bottom-0
                    left-0
                    h-[2px]
                    w-0
                    bg-[#aaf27d]
                    transition-all
                    duration-500
                    group-hover:w-full
                  "
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}
      <section className="border-t border-white/10 bg-[#071f12]">
        <div className="mx-auto max-w-[1200px] px-6 py-24 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#aaf27d]">
            Built for action
          </p>

          <h2 className="mx-auto mt-5 max-w-[700px] text-4xl font-bold tracking-[-0.04em] sm:text-6xl">
            Know the risk.
            <br />
            <span className="text-white/35">Act before it escalates.</span>
          </h2>

          <Link
            href="/register"
            className="
              mt-9
              inline-flex
              rounded-full
              bg-[#aaf27d]
              px-7
              py-3.5
              text-xs
              font-bold
              text-[#102918]
              transition
              hover:bg-[#baf58f]
            "
          >
            Get Started
          </Link>
        </div>
      </section>
    </main>
  );
}
