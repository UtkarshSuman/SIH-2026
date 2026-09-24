"use client";

import Link from "next/link";

const platformFeatures = [
  {
    number: "01",
    title: "Hazard Identification",
    description:
      "Identify and visualize areas exposed to different hazards using geospatial information and risk assessment data.",
  },
  {
    number: "02",
    title: "Population Assessment",
    description:
      "Understand the population living within affected areas and identify communities that may require relocation.",
  },
  {
    number: "03",
    title: "Relocation Intelligence",
    description:
      "Support authorities in evaluating safer relocation sites and planning movement of affected populations.",
  },
  {
    number: "04",
    title: "Decision Support",
    description:
      "Bring hazard, population, and geographic information together in one platform for better planning.",
  },
];

const principles = [
  {
    title: "Data Driven",
    description:
      "Use geographic, hazard, and population information to support evidence-based planning.",
  },
  {
    title: "People First",
    description:
      "Keep affected communities and vulnerable populations at the center of relocation planning.",
  },
  {
    title: "Preparedness",
    description:
      "Help authorities identify potential risks early and prepare appropriate response strategies.",
  },
];

export default function AboutSection() {
  return (
    <main className="min-h-screen bg-[#f4faf7]">
      {/* HERO */}
      <section className="border-b border-emerald-100 bg-white px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[3px] text-emerald-700">
              About Rescue Arc
            </p>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Building Better Intelligence for Safer Relocation
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
              Rescue Arc is a geospatial hazard intelligence platform designed
              to help authorities understand hazardous areas, assess affected
              populations, and support safer relocation planning.
            </p>
          </div>

          {/* PLATFORM STATUS */}
          <div className="mt-10 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-emerald-800">
                Hazard Intelligence
              </span>
            </div>

            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700">
              Population Assessment
            </div>

            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700">
              Relocation Planning
            </div>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_420px]">
          {/* TEXT */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[3px] text-emerald-700">
              Our Mission
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-950 sm:text-4xl">
              Turning geographic data into actionable information
            </h2>

            <div className="mt-6 space-y-5 text-sm leading-7 text-slate-600 sm:text-base">
              <p>
                During a disaster, knowing where a hazard exists is only one
                part of the problem. Authorities also need to understand who is
                affected, how many people may need assistance, and where safer
                relocation options are available.
              </p>

              <p>
                Rescue Arc brings these elements together through an interactive
                geospatial platform. The goal is to make complex hazard and
                population information easier to explore and use during planning
                and response.
              </p>

              <p>
                The platform is designed to support authorities, disaster
                response teams, and other stakeholders with a common view of
                risk areas and relocation requirements.
              </p>
            </div>
          </div>

          {/* HIGHLIGHT CARD */}
          <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
              🛡️
            </div>

            <h3 className="mt-6 text-2xl font-bold text-slate-950">
              One Platform. Multiple Decisions.
            </h3>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              Rescue Arc connects hazard zones, population information,
              relocation sites, and geographic context so users can move from
              identifying risk to planning a response.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-2xl font-extrabold text-emerald-700">01</p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Identify Risk
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-2xl font-extrabold text-emerald-700">02</p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Assess Impact
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-2xl font-extrabold text-emerald-700">03</p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Plan Relocation
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-2xl font-extrabold text-emerald-700">04</p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  Support Action
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE PROVIDE */}
      <section className="border-y border-slate-200 bg-white px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[3px] text-emerald-700">
              What Rescue Arc Provides
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-950 sm:text-4xl">
              From hazard detection to relocation planning
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
              The platform brings several important parts of disaster planning
              into a connected workflow.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {platformFeatures.map((feature) => (
              <div
                key={feature.number}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-emerald-50/40"
              >
                <span className="text-sm font-bold text-emerald-700">
                  {feature.number}
                </span>

                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section className="px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[3px] text-emerald-700">
              Our Approach
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-slate-950 sm:text-4xl">
              Designed around practical disaster planning
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {principles.map((principle) => (
              <div
                key={principle.title}
                className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="h-2 w-10 rounded-full bg-emerald-600" />

                <h3 className="mt-6 text-xl font-bold text-slate-900">
                  {principle.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-950 px-5 py-16 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[3px] text-emerald-400">
              Explore the Platform
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-white">
              Explore hazard information for your area
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Explore the interactive Red Zone map and understand how Rescue Arc
              presents hazard and population information.
            </p>
          </div>

          <Link
            href="/redzone"
            className="inline-flex shrink-0 cursor-pointer items-center rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Explore Red Zones →
          </Link>
        </div>
      </section>
    </main>
  );
}