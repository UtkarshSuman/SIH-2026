import Link from "next/link";
import Navbar from "@/components/marketing/Navbar";

const principles = [
  {
    number: "01",
    title: "Preparedness First",
    description:
      "The best response starts before a disaster happens. Rescue Arc focuses on turning risk information into awareness that supports preparation.",
  },
  {
    number: "02",
    title: "Clarity Over Complexity",
    description:
      "Disaster information can become overwhelming. We aim to present important signals in a way that is easier to understand and act upon.",
  },
  {
    number: "03",
    title: "Technology With Purpose",
    description:
      "AI, geospatial intelligence and real-time data are valuable only when they help people make better decisions.",
  },
  {
    number: "04",
    title: "Communities Matter",
    description:
      "Resilience is not only about technology. It is about helping communities, responders and decision-makers work with better information.",
  },
];

const platformPoints = [
  "Risk intelligence",
  "Hazard awareness",
  "Geospatial insights",
  "AI-assisted analysis",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#061b10] text-white">
      <Navbar />

      {/* =====================================================
          HERO
      ====================================================== */}
      <section className="relative overflow-hidden pt-[72px]">
        {/* Background glow */}
        <div
          className="
            pointer-events-none
            absolute
            left-[-180px]
            top-[-180px]
            h-[600px]
            w-[600px]
            rounded-full
            bg-[#4c9b58]/10
            blur-[130px]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            right-[-180px]
            top-[100px]
            h-[550px]
            w-[550px]
            rounded-full
            bg-[#aaf27d]/[0.035]
            blur-[120px]
          "
        />

        {/* Grid */}
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            opacity-[0.035]
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
            pb-24
            pt-24
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
              About Rescue Arc
            </span>
          </div>

          {/* Main heading */}
          <h1
            className="
              mt-7
              max-w-[1000px]
              text-5xl
              font-bold
              leading-[0.98]
              tracking-[-0.05em]
              sm:text-6xl
              lg:text-[82px]
            "
          >
            Building technology
            <br />
            for a <span className="text-[#aaf27d]">safer tomorrow.</span>
          </h1>

          <p
            className="
              mt-8
              max-w-[690px]
              text-sm
              leading-7
              text-white/40
              sm:text-base
            "
          >
            Rescue Arc is a disaster intelligence platform designed to help
            people understand risk, recognize emerging hazards and make more
            informed decisions when time matters.
          </p>

          {/* Mission card */}
          <div
            className="
              mt-14
              max-w-[900px]
              rounded-3xl
              border
              border-white/[0.08]
              bg-white/[0.025]
              p-7
              sm:p-9
            "
          >
            <p
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.28em]
                text-[#aaf27d]
              "
            >
              Our Mission
            </p>

            <p
              className="
                mt-5
                max-w-[760px]
                text-xl
                font-medium
                leading-9
                tracking-[-0.02em]
                text-white/75
                sm:text-2xl
              "
            >
              Make disaster intelligence more accessible, understandable and
              actionable — so people have better information when it matters
              most.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          WHAT IS RESCUE ARC
      ====================================================== */}
      <section className="border-y border-white/[0.08] bg-[#071f12]">
        <div
          className="
            mx-auto
            grid
            max-w-[1250px]
            gap-16
            px-6
            py-24
            lg:grid-cols-[0.9fr_1.1fr]
            lg:px-10
            lg:py-32
          "
        >
          {/* Left */}
          <div>
            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.3em]
                text-[#aaf27d]
              "
            >
              What We Do
            </p>

            <h2
              className="
                mt-5
                text-4xl
                font-bold
                leading-tight
                tracking-[-0.04em]
                sm:text-5xl
              "
            >
              From signals
              <br />
              <span className="text-white/35">to understanding.</span>
            </h2>
          </div>

          {/* Right */}
          <div>
            <p className="text-sm leading-8 text-white/40 sm:text-base">
              Disasters generate enormous amounts of information. Weather
              conditions, terrain, geographic data and other signals can all
              contribute to understanding how risk is changing.
            </p>

            <p className="mt-6 text-sm leading-8 text-white/40 sm:text-base">
              Rescue Arc brings these ideas together into a unified experience
              designed around risk awareness and response. Instead of forcing
              users to interpret disconnected information, the platform aims to
              surface the signals that matter.
            </p>

            {/* Platform points */}
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {platformPoints.map((point, index) => (
                <div
                  key={point}
                  className="
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    border
                    border-white/[0.07]
                    bg-white/[0.02]
                    px-4
                    py-4
                  "
                >
                  <span
                    className="
                      flex
                      h-6
                      w-6
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#aaf27d]/10
                      text-[9px]
                      font-bold
                      text-[#aaf27d]
                    "
                  >
                    0{index + 1}
                  </span>

                  <span className="text-xs font-medium text-white/55">
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          OUR PRINCIPLES
      ====================================================== */}
      <section>
        <div
          className="
            mx-auto
            max-w-[1250px]
            px-6
            py-24
            lg:px-10
            lg:py-32
          "
        >
          {/* Header */}
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
              What Drives Us
            </p>

            <h2
              className="
                mt-5
                text-4xl
                font-bold
                tracking-[-0.04em]
                sm:text-5xl
              "
            >
              Built around
              <br />
              <span className="text-white/35">
                people, not just technology.
              </span>
            </h2>
          </div>

          {/* Principles */}
          <div className="mt-16 grid gap-4 md:grid-cols-2">
            {principles.map((item) => (
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
                <div className="flex items-center justify-between">
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

                  <span
                    className="
                      h-2
                      w-2
                      rounded-full
                      bg-[#aaf27d]/60
                      transition-all
                      duration-300
                      group-hover:bg-[#aaf27d]
                      group-hover:shadow-[0_0_14px_rgba(170,242,125,0.7)]
                    "
                  />
                </div>

                <h3
                  className="
                    mt-12
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
                    max-w-[500px]
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
          VISION
      ====================================================== */}
      <section className="border-y border-white/[0.08] bg-[#071f12]">
        <div
          className="
            mx-auto
            max-w-[1100px]
            px-6
            py-24
            text-center
            lg:py-32
          "
        >
          <div
            className="
              mx-auto
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-2xl
              border
              border-[#aaf27d]/20
              bg-[#aaf27d]/5
            "
          >
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
            Our Vision
          </p>

          <h2
            className="
              mx-auto
              mt-5
              max-w-[850px]
              text-4xl
              font-bold
              leading-tight
              tracking-[-0.045em]
              sm:text-6xl
            "
          >
            A world where
            <br />
            <span className="text-white/35">
              preparation is part of everyday resilience.
            </span>
          </h2>

          <p
            className="
              mx-auto
              mt-7
              max-w-[620px]
              text-sm
              leading-7
              text-white/35
            "
          >
            We believe technology can help communities move from simply reacting
            to disasters toward anticipating risk and preparing with confidence.
          </p>
        </div>
      </section>

      {/* =====================================================
          CTA
      ====================================================== */}
      <section>
        <div
          className="
            mx-auto
            max-w-[1000px]
            px-6
            py-24
            text-center
            lg:py-28
          "
        >
          <p
            className="
              text-[10px]
              font-bold
              uppercase
              tracking-[0.3em]
              text-[#aaf27d]
            "
          >
            Explore Rescue Arc
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
            Ready to understand
            <br />
            <span className="text-white/35">risk differently?</span>
          </h2>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/features"
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
              Explore Features
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
              How It Works
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
