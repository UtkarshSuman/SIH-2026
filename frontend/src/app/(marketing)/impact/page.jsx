import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";

const impactAreas = [
  {
    number: "01",
    title: "Earlier Warnings",
    description:
      "Give communities more time to understand an emerging hazard and prepare before conditions become critical.",
    metric: "TIME",
    value: "EARLIER",
  },
  {
    number: "02",
    title: "Safer Decisions",
    description:
      "Turn complex risk information into clear intelligence that can support evacuation, planning and emergency decisions.",
    metric: "DECISIONS",
    value: "SMARTER",
  },
  {
    number: "03",
    title: "Faster Response",
    description:
      "Help response teams focus their attention where it matters most by bringing critical risk information into one place.",
    metric: "RESPONSE",
    value: "FASTER",
  },
  {
    number: "04",
    title: "Stronger Communities",
    description:
      "Build greater resilience by helping people move from reacting to disasters toward preparing for them.",
    metric: "RESILIENCE",
    value: "STRONGER",
  },
];

const outcomes = [
  {
    value: "24/7",
    label: "Risk Awareness",
    description: "Continuous access to disaster intelligence.",
  },
  {
    value: "1",
    label: "Unified Platform",
    description: "One place for signals, risk and response.",
  },
  {
    value: "AI",
    label: "Powered Intelligence",
    description: "Technology designed to surface meaningful risk.",
  },
  {
    value: "FAST",
    label: "Action",
    description: "Information designed for timely decisions.",
  },
];

export default function ImpactPage() {
  return (
    <main className="min-h-screen bg-[#061b10] text-white">
      <Navbar />

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden pt-[68px]">
        {/* Ambient glow */}
        <div
          className="
            pointer-events-none
            absolute
            left-[15%]
            top-[-160px]
            h-[550px]
            w-[550px]
            rounded-full
            bg-[#4c9b58]/10
            blur-[120px]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            right-[-10%]
            top-[10%]
            h-[500px]
            w-[500px]
            rounded-full
            bg-[#aaf27d]/[0.035]
            blur-[110px]
          "
        />

        {/* Subtle grid */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            opacity-[0.04]
            [background-image:linear-gradient(rgba(170,242,125,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(170,242,125,0.8)_1px,transparent_1px)]
            [background-size:80px_80px]
          "
        />

        <div
          className="
            relative
            mx-auto
            max-w-[1250px]
            px-6
            pb-42
            pt-24
            lg:px-10
            lg:pb-54
            lg:pt-32
          "
        >
          {/* =====================================================
              LEFT HERO CONTENT
          ====================================================== */}

          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-[#aaf27d]" />

            <span
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.3em]
                text-[#aaf27d]
              "
            >
              The Impact
            </span>
          </div>

          {/* Heading */}
          <h1
            className="
              mt-7
              max-w-[720px]
              text-5xl
              font-bold
              leading-[0.98]
              tracking-[-0.05em]
              sm:text-6xl
              lg:text-[84px]
            "
          >
            Technology that
            <br />
            <span className="text-[#aaf27d]">protects people.</span>
          </h1>

          <p
            className="
              mt-8
              max-w-[650px]
              text-sm
              leading-7
              text-white/40
              sm:text-base
            "
          >
            Rescue Arc is built around a simple idea: better information can
            lead to better decisions, and better decisions can give communities
            more time to prepare, respond and recover.
          </p>

          {/* Hero statement */}
          <div
            className="
              mt-14
              max-w-[650px]
              border-l
              border-[#aaf27d]/40
              pl-5
              sm:pl-7
            "
          >
            <p
              className="
                text-sm
                font-medium
                leading-7
                text-white/65
                sm:text-base
              "
            >
              From the first signal of risk to the moment action is taken, every
              second matters.
            </p>
          </div>

          {/* =====================================================
              RIGHT-SIDE IMPACT VISUAL
          ====================================================== */}

          <div
            className="
              pointer-events-none
              absolute
              right-[72px]
              top-[145px]
              hidden
              w-[390px]
              lg:block
              xl:right-[90px]
              2xl:right-[115px]
            "
          >
            <div
              className="
                relative
                overflow-hidden
                rounded-[30px]
                border
                border-white/[0.10]
                bg-[#071f12]/75
                p-6
                shadow-[0_30px_100px_rgba(0,0,0,0.28)]
                backdrop-blur-xl
              "
            >
              {/* Soft glow */}
              <div
                className="
                  pointer-events-none
                  absolute
                  right-[-100px]
                  top-[-100px]
                  h-[230px]
                  w-[230px]
                  rounded-full
                  bg-[#aaf27d]/[0.06]
                  blur-[70px]
                "
              />

              {/* Header */}
              <div className="relative flex items-start justify-between">
                <div>
                  <p
                    className="
                      text-[9px]
                      font-bold
                      uppercase
                      tracking-[0.25em]
                      text-[#aaf27d]
                    "
                  >
                    Impact readiness
                  </p>

                  <h3 className="mt-2 text-xl font-bold tracking-[-0.03em]">
                    Community outlook
                  </h3>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span
                    className="
                      h-2.5
                      w-2.5
                      rounded-full
                      bg-[#aaf27d]
                      shadow-[0_0_16px_rgba(170,242,125,0.8)]
                    "
                  />

                  <span className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/35">
                    Stable
                  </span>
                </div>
              </div>

              {/* Main visual */}
              <div
                className="
                  relative
                  mt-6
                  h-[185px]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-white/[0.08]
                  bg-[#04160d]
                "
              >
                {/* Grid */}
                <div
                  className="
                    absolute
                    inset-0
                    opacity-[0.7]
                    [background-image:linear-gradient(rgba(170,242,125,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(170,242,125,0.07)_1px,transparent_1px)]
                    [background-size:42px_42px]
                  "
                />

                {/* Before line */}
                <div
                  className="
                    absolute
                    left-[35px]
                    top-[135px]
                    h-px
                    w-[115px]
                    rotate-[-17deg]
                    bg-white/10
                  "
                />

                {/* After line */}
                <div
                  className="
                    absolute
                    left-[145px]
                    top-[110px]
                    h-px
                    w-[160px]
                    rotate-[-17deg]
                    bg-[#aaf27d]/50
                  "
                />

                {/* Central point */}
                <div
                  className="
                    absolute
                    left-[52%]
                    top-[48%]
                    flex
                    h-14
                    w-14
                    -translate-x-1/2
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-[#aaf27d]/20
                    bg-[#aaf27d]/[0.04]
                  "
                >
                  <div
                    className="
                      h-3
                      w-3
                      rounded-full
                      bg-[#aaf27d]
                      shadow-[0_0_18px_rgba(170,242,125,0.9)]
                    "
                  />
                </div>

                {/* Small nodes */}
                <span
                  className="
                    absolute
                    left-[22%]
                    top-[42%]
                    h-2.5
                    w-2.5
                    rounded-full
                    bg-[#aaf27d]
                    shadow-[0_0_14px_rgba(170,242,125,0.7)]
                  "
                />

                <span
                  className="
                    absolute
                    left-[70%]
                    top-[31%]
                    h-2.5
                    w-2.5
                    rounded-full
                    bg-[#f5c451]
                    shadow-[0_0_14px_rgba(245,196,81,0.6)]
                  "
                />

                <span
                  className="
                    absolute
                    left-[78%]
                    top-[68%]
                    h-2.5
                    w-2.5
                    rounded-full
                    bg-[#aaf27d]
                    shadow-[0_0_14px_rgba(170,242,125,0.7)]
                  "
                />

                {/* Labels */}
                <div
                  className="
                    absolute
                    bottom-4
                    left-4
                    rounded-lg
                    border
                    border-white/[0.07]
                    bg-[#071f12]/80
                    px-3
                    py-2
                    backdrop-blur-md
                  "
                >
                  <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/25">
                    Awareness
                  </p>

                  <p className="mt-1 text-[11px] font-semibold text-[#aaf27d]">
                    Improved
                  </p>
                </div>

                <div
                  className="
                    absolute
                    bottom-4
                    right-4
                    rounded-lg
                    border
                    border-white/[0.07]
                    bg-[#071f12]/80
                    px-3
                    py-2
                    text-right
                    backdrop-blur-md
                  "
                >
                  <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/25">
                    Response
                  </p>

                  <p className="mt-1 text-[11px] font-semibold text-[#aaf27d]">
                    Prepared
                  </p>
                </div>
              </div>

              {/* Readiness rows */}
              <div className="mt-5 space-y-4">
                {/* Awareness */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
                      Risk awareness
                    </span>

                    <span className="text-[9px] font-semibold text-[#aaf27d]">
                      86%
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full w-[86%] rounded-full bg-[#aaf27d]/70" />
                  </div>
                </div>

                {/* Preparedness */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
                      Preparedness
                    </span>

                    <span className="text-[9px] font-semibold text-[#aaf27d]">
                      72%
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full w-[72%] rounded-full bg-[#aaf27d]/55" />
                  </div>
                </div>

                {/* Response */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
                      Response readiness
                    </span>

                    <span className="text-[9px] font-semibold text-[#aaf27d]">
                      91%
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full w-[91%] rounded-full bg-[#aaf27d]/80" />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="
                  mt-6
                  flex
                  items-center
                  justify-between
                  border-t
                  border-white/[0.07]
                  pt-4
                "
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#aaf27d]" />

                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/25">
                    Continuous assessment
                  </span>
                </div>

                <span className="text-[8px] text-white/20">Updated now</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          OUTCOME STATS
      ====================================================== */}
      <section className="border-y border-white/[0.08] bg-[#071f12]">
        <div className="mx-auto max-w-[1250px] px-6 lg:px-10">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4">
            {outcomes.map((item, index) => (
              <div
                key={item.label}
                className={`
                  px-6
                  py-10
                  ${
                    index !== outcomes.length - 1
                      ? "border-b border-white/[0.08] sm:border-r lg:border-b-0"
                      : ""
                  }
                `}
              >
                <p className="text-3xl font-bold tracking-[-0.04em] text-[#aaf27d]">
                  {item.value}
                </p>

                <p className="mt-3 text-xs font-bold uppercase tracking-[0.15em] text-white">
                  {item.label}
                </p>

                <p className="mt-2 text-xs leading-6 text-white/30">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          IMPACT AREAS
      ====================================================== */}
      <section className="border-b border-white/[0.08]">
        <div className="mx-auto max-w-[1250px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="max-w-[700px]">
            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.3em]
                text-[#aaf27d]
              "
            >
              Where It Matters
            </p>

            <h2
              className="
                mt-5
                text-3xl
                font-bold
                tracking-[-0.04em]
                sm:text-5xl
              "
            >
              Turning intelligence
              <br />
              <span className="text-white/35">into meaningful outcomes.</span>
            </h2>

            <p className="mt-6 max-w-[600px] text-sm leading-7 text-white/35">
              The value of Rescue Arc isn't only in detecting risk. It is in
              what people can do with that information.
            </p>
          </div>

          <div className="mt-16 grid gap-4 md:grid-cols-2">
            {impactAreas.map((item) => (
              <article
                key={item.number}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-3xl
                  border
                  border-white/[0.08]
                  bg-white/[0.025]
                  p-7
                  transition-all
                  duration-300
                  hover:border-[#aaf27d]/20
                  hover:bg-white/[0.04]
                  sm:p-9
                "
              >
                <div className="flex items-start justify-between">
                  <span
                    className="
                      text-[11px]
                      font-bold
                      tracking-[0.2em]
                      text-white/20
                    "
                  >
                    {item.number}
                  </span>

                  <div className="text-right">
                    <p className="text-[8px] font-bold tracking-[0.2em] text-white/25">
                      {item.metric}
                    </p>

                    <p className="mt-1 text-[10px] font-bold text-[#aaf27d]">
                      {item.value}
                    </p>
                  </div>
                </div>

                <div
                  className="
                    mt-12
                    h-10
                    w-10
                    rounded-xl
                    border
                    border-[#aaf27d]/20
                    bg-[#aaf27d]/5
                    p-3
                  "
                >
                  <div className="h-full w-full rounded-full bg-[#aaf27d]/80" />
                </div>

                <h3
                  className="
                    mt-7
                    text-2xl
                    font-bold
                    tracking-[-0.03em]
                  "
                >
                  {item.title}
                </h3>

                <p
                  className="
                    mt-4
                    max-w-[480px]
                    text-sm
                    leading-7
                    text-white/35
                  "
                >
                  {item.description}
                </p>

                <span
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
          PEOPLE FIRST
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#061b10]">
        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            h-[600px]
            w-[900px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-[#aaf27d]/[0.025]
            blur-[120px]
          "
        />

        <div className="relative mx-auto max-w-[1100px] px-6 py-24 text-center lg:py-32">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#aaf27d]/20 bg-[#aaf27d]/5">
            <span className="h-3 w-3 rounded-full bg-[#aaf27d] shadow-[0_0_18px_rgba(170,242,125,0.8)]" />
          </div>

          <p
            className="
              mt-7
              text-[10px]
              font-bold
              uppercase
              tracking-[0.3em]
              text-[#aaf27d]
            "
          >
            People First
          </p>

          <h2
            className="
              mx-auto
              mt-5
              max-w-[800px]
              text-4xl
              font-bold
              leading-tight
              tracking-[-0.045em]
              sm:text-6xl
            "
          >
            Because every warning
            <br />
            <span className="text-white/35">represents a chance to act.</span>
          </h2>

          <p
            className="
              mx-auto
              mt-7
              max-w-[600px]
              text-sm
              leading-7
              text-white/35
            "
          >
            Rescue Arc is designed to put actionable intelligence closer to the
            people and teams who need it when it matters most.
          </p>
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}
      <section className="border-t border-white/[0.08] bg-[#071f12]">
        <div className="mx-auto max-w-[1000px] px-6 py-24 text-center lg:py-28">
          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.3em]
              text-[#aaf27d]
            "
          >
            Build a safer future
          </p>

          <h2
            className="
              mt-5
              text-4xl
              font-bold
              tracking-[-0.04em]
              sm:text-6xl
            "
          >
            Awareness today.
            <br />
            <span className="text-white/35">Resilience tomorrow.</span>
          </h2>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="
                rounded-full
                bg-[#aaf27d]
                px-7
                py-3.5
                text-xs
                font-bold
                text-[#102918]
                transition
                hover:bg-[#baf58f]
                hover:-translate-y-[1px]
              "
            >
              Get Started
            </Link>

            <Link
              href="/how-it-works"
              className="
                rounded-full
                border
                border-white/15
                px-7
                py-3.5
                text-xs
                font-semibold
                text-white/70
                transition
                hover:border-[#aaf27d]/30
                hover:text-white
              "
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
