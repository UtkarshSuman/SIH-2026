import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";

const steps = [
  {
    number: "01",
    label: "COLLECT",
    title: "Gather the signals",
    description:
      "Rescue Arc brings together geographic, environmental and hazard-related information from multiple sources into one unified view.",
  },
  {
    number: "02",
    label: "ANALYZE",
    title: "Understand the risk",
    description:
      "The platform processes incoming information to identify developing hazards, changing conditions and areas that may require attention.",
  },
  {
    number: "03",
    label: "PREDICT",
    title: "Detect what comes next",
    description:
      "Risk patterns are evaluated to help identify where conditions could worsen and where early intervention may matter most.",
  },
  {
    number: "04",
    label: "ALERT",
    title: "Warn the right people",
    description:
      "Important risk information is transformed into clear warnings so communities and response teams can make faster decisions.",
  },
  {
    number: "05",
    label: "RESPOND",
    title: "Move with confidence",
    description:
      "Teams can use the available intelligence to coordinate response, identify safer areas and act before a situation escalates.",
  },
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#061b10] text-white">
      <Navbar />

      {/* =====================================================
          HERO
      ====================================================== */}
      <section
        className="
          relative
          min-h-[760px]
          overflow-hidden
          pt-[68px]
          lg:min-h-[820px]
        "
      >
        {/* Ambient glow */}
        <div
          className="
            pointer-events-none
            absolute
            left-1/2
            top-[-180px]
            h-[600px]
            w-[900px]
            -translate-x-1/2
            rounded-full
            bg-[#4c9b58]/10
            blur-[120px]
          "
        />

        {/* Grid */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            opacity-[0.045]
            [background-image:linear-gradient(rgba(170,242,125,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(170,242,125,0.8)_1px,transparent_1px)]
            [background-size:80px_80px]
          "
        />

        <div
          className="
            relative
            mx-auto
            min-h-[692px]
            max-w-[1250px]
            px-6
            pb-24
            pt-24
            lg:min-h-[752px]
            lg:px-10
            lg:pb-32
            lg:pt-32
          "
        >
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
              How Rescue Arc Works
            </span>
          </div>

          {/* Heading */}
          <h1
            className="
              mt-7
              max-w-[900px]
              text-5xl
              font-bold
              leading-[0.98]
              tracking-[-0.05em]
              sm:text-6xl
              lg:text-[82px]
            "
          >
            From signals
            <br />
            <span className="text-[#aaf27d]">to action.</span>
          </h1>

          <p
            className="
              mt-8
              max-w-[620px]
              text-sm
              leading-7
              text-white/40
              sm:text-base
            "
          >
            Rescue Arc turns complex disaster information into actionable
            intelligence — helping people understand risk, receive timely
            warnings and respond faster.
          </p>

          {/* =====================================================
              LIVE DECISION ENGINE
          ====================================================== */}
          <div
            className="
              pointer-events-none
              absolute
              right-8
              top-[105px]
              hidden
              w-[370px]
              lg:block
              xl:right-16
              2xl:right-24
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
              {/* subtle inner glow */}
              <div
                className="
                  pointer-events-none
                  absolute
                  right-[-80px]
                  top-[-80px]
                  h-[180px]
                  w-[180px]
                  rounded-full
                  bg-[#aaf27d]/10
                  blur-[60px]
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
                    Live Decision Engine
                  </p>

                  <h3 className="mt-2 text-lg font-bold text-white">
                    Intelligence pipeline
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#aaf27d] shadow-[0_0_14px_rgba(170,242,125,0.8)]" />

                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    Active
                  </span>
                </div>
              </div>

              {/* Signal visual */}
              <div
                className="
                  relative
                  mt-6
                  h-[155px]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-white/[0.08]
                  bg-[#04170d]
                "
              >
                {/* grid */}
                <div
                  className="
                    absolute
                    inset-0
                    opacity-[0.08]
                    [background-image:linear-gradient(rgba(170,242,125,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(170,242,125,0.6)_1px,transparent_1px)]
                    [background-size:38px_38px]
                  "
                />

                {/* connecting line */}
                <div
                  className="
                    absolute
                    left-[46px]
                    top-[92px]
                    h-px
                    w-[235px]
                    rotate-[-18deg]
                    bg-gradient-to-r
                    from-transparent
                    via-[#aaf27d]/60
                    to-transparent
                  "
                />

                {/* green signal node */}
                <span
                  className="
                    absolute
                    left-[42px]
                    top-[85px]
                    h-3
                    w-3
                    rounded-full
                    bg-[#aaf27d]
                    shadow-[0_0_18px_rgba(170,242,125,0.8)]
                  "
                />

                {/* green signal node */}
                <span
                  className="
                    absolute
                    left-[118px]
                    top-[54px]
                    h-2.5
                    w-2.5
                    rounded-full
                    bg-[#aaf27d]
                    shadow-[0_0_16px_rgba(170,242,125,0.7)]
                  "
                />

                {/* yellow risk node */}
                <span
                  className="
                    absolute
                    left-[190px]
                    top-[78px]
                    h-2.5
                    w-2.5
                    rounded-full
                    bg-[#f5c451]
                    shadow-[0_0_16px_rgba(245,196,81,0.7)]
                  "
                />

                {/* red warning node */}
                <span
                  className="
                    absolute
                    right-[48px]
                    top-[42px]
                    h-2.5
                    w-2.5
                    rounded-full
                    bg-[#ff6262]
                    shadow-[0_0_16px_rgba(255,98,98,0.7)]
                  "
                />

                {/* center ring */}
                <div
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    h-[72px]
                    w-[72px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    border
                    border-[#aaf27d]/20
                  "
                />

                <div
                  className="
                    absolute
                    left-1/2
                    top-1/2
                    h-[36px]
                    w-[36px]
                    -translate-x-1/2
                    -translate-y-1/2
                    rounded-full
                    border
                    border-[#aaf27d]/30
                  "
                />
              </div>

              {/* Pipeline states */}
              <div className="mt-5 space-y-3">
                {/* Signal */}
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    border-white/[0.06]
                    bg-white/[0.025]
                    px-4
                    py-3
                  "
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#aaf27d]/10">
                      <span className="h-2 w-2 rounded-full bg-[#aaf27d]" />
                    </span>

                    <div>
                      <p className="text-[10px] font-bold text-white/80">
                        Signal intake
                      </p>

                      <p className="mt-0.5 text-[9px] text-white/30">
                        Environmental data
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] font-semibold text-[#aaf27d]">
                    LIVE
                  </span>
                </div>

                {/* Analysis */}
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    border-white/[0.06]
                    bg-white/[0.025]
                    px-4
                    py-3
                  "
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f5c451]/10">
                      <span className="h-2 w-2 rounded-full bg-[#f5c451]" />
                    </span>

                    <div>
                      <p className="text-[10px] font-bold text-white/80">
                        Risk analysis
                      </p>

                      <p className="mt-0.5 text-[9px] text-white/30">
                        Pattern evaluation
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] font-semibold text-[#f5c451]">
                    READY
                  </span>
                </div>

                {/* Response */}
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    border-[#ff6262]/10
                    bg-[#ff6262]/[0.025]
                    px-4
                    py-3
                  "
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff6262]/10">
                      <span className="h-2 w-2 rounded-full bg-[#ff6262]" />
                    </span>

                    <div>
                      <p className="text-[10px] font-bold text-white/80">
                        Response state
                      </p>

                      <p className="mt-0.5 text-[9px] text-white/30">
                        Decision readiness
                      </p>
                    </div>
                  </div>

                  <span className="text-[9px] font-semibold text-[#ff6262]">
                    MONITOR
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-4">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#aaf27d]" />

                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">
                    Continuous processing
                  </span>
                </div>

                <span className="text-[9px] text-white/25">System active</span>
              </div>
            </div>
          </div>

          {/* Process indicator */}
          <div className="mt-14 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-[#aaf27d] shadow-[0_0_14px_rgba(170,242,125,0.8)]" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
              Continuous risk intelligence
            </span>

            <span className="h-px w-16 bg-white/10" />
          </div>
        </div>
      </section>

      {/* =====================================================
          PROCESS
      ====================================================== */}
      <section className="border-t border-white/[0.08]">
        <div className="mx-auto max-w-[1250px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid gap-16 lg:grid-cols-[0.75fr_1.25fr]">
            {/* Left intro */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.3em]
                  text-[#aaf27d]
                "
              >
                The Rescue Arc Loop
              </p>

              <h2
                className="
                  mt-5
                  max-w-[430px]
                  text-3xl
                  font-bold
                  leading-tight
                  tracking-[-0.035em]
                  sm:text-4xl
                "
              >
                A continuous cycle of
                <span className="text-white/35"> awareness and response.</span>
              </h2>

              <p className="mt-6 max-w-[390px] text-sm leading-7 text-white/35">
                Disaster conditions can change quickly. Rescue Arc is designed
                around a continuous flow of information, analysis and action
                rather than a single point-in-time warning.
              </p>

              <div
                className="
                  mt-10
                  rounded-2xl
                  border
                  border-[#aaf27d]/15
                  bg-[#aaf27d]/[0.035]
                  p-5
                "
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#aaf27d]/20 bg-[#aaf27d]/5">
                    <span className="h-2 w-2 rounded-full bg-[#aaf27d]" />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-white">
                      Always watching
                    </p>

                    <p className="mt-1 text-[10px] text-white/30">
                      Risk intelligence stays active
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div
                className="
                  absolute
                  bottom-8
                  left-[25px]
                  top-8
                  w-px
                  bg-gradient-to-b
                  from-[#aaf27d]/50
                  via-white/10
                  to-transparent
                "
              />

              <div className="space-y-4">
                {steps.map((step, index) => (
                  <article
                    key={step.number}
                    className="
                      group
                      relative
                      rounded-3xl
                      border
                      border-white/[0.08]
                      bg-white/[0.025]
                      p-6
                      transition-all
                      duration-300
                      hover:border-[#aaf27d]/20
                      hover:bg-white/[0.04]
                      sm:p-7
                    "
                  >
                    <div className="flex gap-6">
                      {/* Number */}
                      <div
                        className="
                          relative
                          z-10
                          flex
                          h-[52px]
                          w-[52px]
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          border
                          border-[#aaf27d]/25
                          bg-[#092317]
                          text-[11px]
                          font-bold
                          text-[#aaf27d]
                        "
                      >
                        {step.number}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className="
                              text-[9px]
                              font-bold
                              tracking-[0.22em]
                              text-[#aaf27d]/70
                            "
                          >
                            {step.label}
                          </span>

                          {index === 4 && (
                            <span
                              className="
                                rounded-full
                                border
                                border-[#aaf27d]/20
                                px-2.5
                                py-1
                                text-[8px]
                                font-bold
                                text-[#aaf27d]
                              "
                            >
                              ACTION
                            </span>
                          )}
                        </div>

                        <h3
                          className="
                            mt-3
                            text-xl
                            font-bold
                            tracking-[-0.025em]
                            text-white
                            sm:text-2xl
                          "
                        >
                          {step.title}
                        </h3>

                        <p
                          className="
                            mt-3
                            max-w-[560px]
                            text-xs
                            leading-6
                            text-white/35
                            sm:text-sm
                          "
                        >
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {/* Hover indicator */}
                    <span
                      className="
                        absolute
                        bottom-0
                        left-8
                        h-[2px]
                        w-0
                        rounded-full
                        bg-[#aaf27d]
                        transition-all
                        duration-500
                        group-hover:w-20
                      "
                    />
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          DATA FLOW
      ====================================================== */}
      <section className="border-t border-white/[0.08] bg-[#071f12]">
        <div className="mx-auto max-w-[1250px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="text-center">
            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.3em]
                text-[#aaf27d]
              "
            >
              The Intelligence Flow
            </p>

            <h2
              className="
                mx-auto
                mt-5
                max-w-[750px]
                text-3xl
                font-bold
                tracking-[-0.04em]
                sm:text-5xl
              "
            >
              Information becomes
              <span className="text-white/35"> decisions.</span>
            </h2>
          </div>

          {/* Flow */}
          <div className="mt-16 grid gap-3 md:grid-cols-5">
            {[
              ["01", "Signals"],
              ["02", "Analysis"],
              ["03", "Risk"],
              ["04", "Alert"],
              ["05", "Action"],
            ].map(([number, label], index) => (
              <div key={number} className="relative">
                <div
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-[#0a2516]
                    px-5
                    py-7
                    text-center
                    transition
                    hover:border-[#aaf27d]/20
                  "
                >
                  <span className="text-[9px] font-bold tracking-[0.2em] text-[#aaf27d]/60">
                    {number}
                  </span>

                  <p className="mt-3 text-sm font-bold text-white">{label}</p>
                </div>

                {index < 4 && (
                  <span
                    className="
                      absolute
                      -right-2
                      top-1/2
                      z-10
                      hidden
                      h-px
                      w-4
                      bg-[#aaf27d]/30
                      md:block
                    "
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}
      <section className="border-t border-white/[0.08]">
        <div className="mx-auto max-w-[1000px] px-6 py-24 text-center lg:py-32">
          <div className="mx-auto h-2 w-2 rounded-full bg-[#aaf27d] shadow-[0_0_18px_rgba(170,242,125,0.8)]" />

          <h2
            className="
              mt-7
              text-4xl
              font-bold
              tracking-[-0.04em]
              sm:text-6xl
            "
          >
            Earlier intelligence.
            <br />
            <span className="text-white/35">Faster response.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-[560px] text-sm leading-7 text-white/35">
            Rescue Arc helps transform uncertainty into information people can
            understand and act on.
          </p>

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
              hover:-translate-y-[1px]
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
