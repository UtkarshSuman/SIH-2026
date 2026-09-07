"use client";

import React, { useState } from "react";

import FeatureCard from "./FeatureCard";
import HazardPreview from "./HazardPreview";

const hazards = [
  {
    id: "flood",
    title: "Floods",
    status: "HIGH RISK",
    description:
      "Detect flood-prone areas using terrain, water systems, rainfall and real-time geospatial signals.",
    previewTitle: "Flood Risk",
    previewStatus: "High Risk Area",
  },
  {
    id: "landslide",
    title: "Landslides",
    status: "MONITORED",
    description:
      "Identify vulnerable terrain and slope conditions to understand potential landslide zones.",
    previewTitle: "Landslide Risk",
    previewStatus: "Monitoring Area",
  },
  {
    id: "cyclone",
    title: "Cyclones",
    status: "LIVE TRACKING",
    description:
      "Track changing cyclone conditions and visualize affected regions through live hazard intelligence.",
    previewTitle: "Cyclone Risk",
    previewStatus: "Live Tracking",
  },
  {
    id: "rainfall",
    title: "Heavy Rainfall",
    status: "LIVE MONITORING",
    description:
      "Monitor intense rainfall patterns and identify areas where extreme precipitation may increase risk.",
    previewTitle: "Rainfall Risk",
    previewStatus: "Live Monitoring",
  },
];

export default function FeaturesSection() {
  const [activeHazard, setActiveHazard] = useState("flood");

  const selectedHazard =
    hazards.find((hazard) => hazard.id === activeHazard) || hazards[0];

  return (
    <section
      id="features"
      className="
        relative
        min-h-screen
        scroll-mt-20
        overflow-hidden
        bg-[#061b10]
        text-white
      "
    >
      {/* =====================================================
          SUBTLE BACKGROUND
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
        "
      >
        {/* Top glow */}
        <div
          className="
            absolute
            -left-40
            -top-40
            h-[420px]
            w-[420px]
            rounded-full
            bg-[#aaf27d]/[0.035]
            blur-[100px]
          "
        />

        {/* Right glow */}
        <div
          className="
            absolute
            -right-40
            top-[35%]
            h-[500px]
            w-[500px]
            rounded-full
            bg-[#1b6b43]/[0.08]
            blur-[120px]
          "
        />

        {/* Bottom glow */}
        <div
          className="
            absolute
            bottom-[-220px]
            left-[25%]
            h-[450px]
            w-[600px]
            rounded-full
            bg-[#aaf27d]/[0.025]
            blur-[120px]
          "
        />

        {/* Very subtle grid */}
        <div
          className="
            absolute
            inset-0
            opacity-[0.025]
            [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)]
            [background-size:70px_70px]
          "
        />
      </div>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          flex
          min-h-screen
          max-w-[1280px]
          flex-col
          justify-center
          px-5
          py-[110px]
          sm:px-8
          lg:px-12
          lg:py-[130px]
        "
      >
        {/* =================================================
            SECTION HEADER
        ================================================== */}

        <div className="mx-auto max-w-[760px] text-center">
          {/* Label */}

          <div
            className="
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-[#aaf27d]/20
              bg-[#102f1d]/70
              px-4
              py-2
              text-[9px]
              font-bold
              uppercase
              tracking-[0.18em]
              text-white/60
              backdrop-blur-xl
            "
          >
            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-[#aaf27d]
                shadow-[0_0_10px_rgba(170,242,125,.8)]
              "
            />
            Hazard Intelligence
          </div>

          {/* Heading */}

          <h2
            className="
              mt-6
              text-[45px]
              font-bold
              leading-[0.98]
              tracking-[-0.055em]
              text-white
              sm:text-[58px]
              lg:text-[68px]
            "
          >
            One map.
            <br />
            <span className="text-[#aaf27d]">Multiple hazards.</span>
          </h2>

          {/* Description */}

          <p
            className="
              mx-auto
              mt-6
              max-w-[650px]
              text-[14px]
              leading-7
              text-white/45
              sm:text-[15px]
            "
          >
            Rescue Arc brings multiple disaster signals into one intelligent
            view, helping communities understand where risk is developing before
            it becomes an emergency.
          </p>
        </div>

        {/* =================================================
            FEATURE AREA
        ================================================== */}

        <div
          className="
            mt-16
            grid
            gap-8
            lg:grid-cols-[380px_minmax(0,1fr)]
            lg:items-center
            lg:gap-10
          "
        >
          {/* =================================================
              HAZARD LIST
          ================================================== */}

          <div>
            <div className="mb-4 px-1">
              <div
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-white/35
                "
              >
                Monitor hazards
              </div>

              <div className="mt-1 text-[11px] text-white/30">
                Select a hazard to explore its live intelligence.
              </div>
            </div>

            <div className="space-y-3">
              {hazards.map((hazard) => (
                <FeatureCard
                  key={hazard.id}
                  type={hazard.id}
                  title={hazard.title}
                  status={hazard.status}
                  description={hazard.description}
                  active={activeHazard === hazard.id}
                  onClick={() => setActiveHazard(hazard.id)}
                />
              ))}
            </div>

            {/* Monitoring status */}

            <div
              className="
                mt-5
                flex
                items-center
                justify-between
                rounded-[16px]
                border
                border-white/[0.07]
                bg-white/[0.025]
                px-4
                py-3
              "
            >
              <div className="flex items-center gap-2">
                <span
                  className="
                    h-1.5
                    w-1.5
                    rounded-full
                    bg-[#aaf27d]
                    shadow-[0_0_9px_rgba(170,242,125,.8)]
                  "
                />

                <span className="text-[9px] font-semibold text-white/40">
                  SYSTEM ONLINE
                </span>
              </div>

              <span className="text-[9px] font-bold text-[#aaf27d]/70">
                24/7
              </span>
            </div>
          </div>

          {/* =================================================
              HAZARD PREVIEW
          ================================================== */}

          <div className="min-w-0">
            <HazardPreview
              title={selectedHazard.previewTitle}
              status={selectedHazard.previewStatus}
              hazard={selectedHazard.id}
            />
          </div>
        </div>

        {/* =================================================
            BOTTOM SECTION STATEMENT
        ================================================== */}

        <div
          className="
            mt-16
            flex
            flex-col
            gap-5
            border-t
            border-white/[0.08]
            pt-7
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <div
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.15em]
                text-white/50
              "
            >
              From detection to decision
            </div>

            <p className="mt-1 text-[10px] text-white/30">
              One connected intelligence layer for safer communities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-[#aaf27d]
                shadow-[0_0_9px_rgba(170,242,125,.7)]
              "
            />

            <span
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-[#aaf27d]/75
              "
            >
              Real-time monitoring
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
