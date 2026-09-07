"use client";

import React from "react";
import Link from "next/link";

/* =========================================================
   ICONS
========================================================= */

function ArrowIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function MapIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
      <path d="M9 3v15" />
      <path d="M15 6v15" />
    </svg>
  );
}

function UsersIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function PinIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ClockIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function LeafIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M20 4C12 4 6 8 6 14c0 3 2 5 5 5 6 0 9-6 9-15Z" />
      <path d="M4 20c3-5 7-8 12-10" />
    </svg>
  );
}

function AlertIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M10.3 3.5 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function FloodIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M3 8c2.2 0 2.2 1.5 4.5 1.5S9.8 8 12 8s2.2 1.5 4.5 1.5S18.8 8 21 8" />
      <path d="M3 13c2.2 0 2.2 1.5 4.5 1.5S9.8 13 12 13s2.2 1.5 4.5 1.5S18.8 13 21 13" />
      <path d="M3 18c2.2 0 2.2 1.5 4.5 1.5S9.8 18 12 18s2.2 1.5 4.5 1.5S18.8 18 21 18" />
    </svg>
  );
}

function MountainIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="m3 20 7-12 4 6 2-3 5 9H3Z" />
    </svg>
  );
}

function WindIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M3 8h10a3 3 0 1 0-3-3" />
      <path d="M3 12h15a3 3 0 1 1-3 3" />
      <path d="M3 16h7a3 3 0 1 1-3 3" />
    </svg>
  );
}

function RainIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path d="M7 16a4 4 0 1 1 1-7.87A5 5 0 0 1 18 10a3 3 0 0 1 0 6H7Z" />
      <path d="M9 19v2" />
      <path d="M13 19v2" />
      <path d="M17 19v2" />
    </svg>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ icon, value, label }) {
  return (
    <div
      className="
        group flex min-w-0 flex-1 items-center gap-3.5
        rounded-[18px]
        border border-white/15
        bg-[#0d2a1c]/70
        px-4 py-3.5
        shadow-[0_14px_40px_rgba(0,0,0,.22)]
        backdrop-blur-xl
        transition duration-300
        hover:-translate-y-0.5
        hover:border-[#a9ef7e]/35
        hover:bg-[#123522]/80
      "
    >
      <div
        className="
          flex h-10 w-10 shrink-0
          items-center justify-center
          rounded-full
          bg-[#8fdf68]/15
          text-[#b8f39b]
          ring-1 ring-[#a9ef7e]/15
        "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-[17px] font-bold tracking-[-0.02em] text-white">
          {value}
        </div>

        <div className="mt-0.5 truncate text-[10px] leading-4 text-white/55">
          {label}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HAZARD ITEM
========================================================= */

function HazardItem({ icon, title }) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-lg
        px-2
        py-2
        text-[12px]
        text-white/70
        transition
        hover:bg-white/[0.045]
        hover:text-white
      "
    >
      <span className="text-[#c6f6aa]">{icon}</span>
      <span>{title}</span>
    </div>
  );
}

/* =========================================================
   FLOOD RISK OVERLAY
========================================================= */

function FloodRiskOverlay() {
  return (
    <>
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-[59.1%]
          top-[38.4%]
          z-20
          hidden
          h-[15px]
          w-[15px]
          rounded-full
          border-[3px]
          border-white
          bg-[#ff7656]
          shadow-[0_0_0_6px_rgba(255,118,86,.18),0_0_18px_rgba(255,92,64,.7)]
          lg:block
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-[59.55%]
          top-[38.15%]
          z-20
          hidden
          h-px
          w-[72px]
          origin-left
          rotate-[-25deg]
          bg-gradient-to-r
          from-white/90
          via-[#ff977d]/70
          to-transparent
          lg:block
        "
      />

      <div
        className="
          absolute
          left-[61.7%]
          top-[30.5%]
          z-30
          hidden
          h-[82px]
          w-[190px]
          items-center
          gap-2.5
          rounded-[15px]
          border border-[#ff977d]/30
          bg-[#3b251f]/92
          px-3
          py-2.5
          shadow-[0_14px_35px_rgba(0,0,0,.38)]
          backdrop-blur-xl
          lg:flex
        "
      >
        <div
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-[#ff7957]/15
            text-[#ff9d85]
          "
        >
          <AlertIcon size={20} />
        </div>

        <div className="min-w-0">
          <div className="text-[12px] font-bold leading-4 text-white">
            Flood Risk
          </div>

          <div className="mt-1 whitespace-nowrap text-[9px] font-medium text-[#ffab94]">
            High Risk Area
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   HOME SECTION
========================================================= */

export default function HomeSection() {
  return (
    <section
      id="home"
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#071b12]
        font-sans
        text-white
        selection:bg-[#aaf27d]
        selection:text-[#102717]
      "
    >
      {/* =====================================================
          BACKGROUND MAP
      ===================================================== */}

      <div
        aria-hidden="true"
        className="
          absolute inset-0
          scale-[1.02]
          bg-cover
          bg-center
          bg-no-repeat
        "
        style={{
          backgroundImage: "url('/background-image.png')",
        }}
      />

      {/* LEFT DARK GRADIENT */}

      <div
        className="
          pointer-events-none
          absolute inset-0
          bg-gradient-to-r
          from-[#04180f]/90
          via-[#08291a]/48
          via-[46%]
          to-[#04180f]/5
        "
      />

      {/* TOP / BOTTOM GRADIENT */}

      <div
        className="
          pointer-events-none
          absolute inset-0
          bg-gradient-to-b
          from-[#03140c]/65
          via-transparent
          via-[48%]
          to-[#03160d]/70
        "
      />

      <div className="pointer-events-none absolute inset-0 bg-black/[0.08]" />

      {/* =====================================================
          MAIN HERO
      ===================================================== */}

      <main
        id="home-content"
        className="
          relative
          z-20
          min-h-[calc(100vh-78px)]
        "
      >
        <section
          className="
            mx-auto
            flex
            min-h-[calc(100vh-78px)]
            max-w-[1500px]
            items-center
            px-5
            pb-[185px]
            pt-[120px]
            sm:px-8
            lg:px-12
          "
        >
          <div className="w-full max-w-[700px]">
            {/* PRODUCT BADGE */}

            <div
              className="
                mb-6
                inline-flex
                items-center
                gap-2.5
                rounded-full
                border border-[#a9e98d]/25
                bg-[#123622]/55
                px-4
                py-2
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-white/75
                shadow-[0_8px_30px_rgba(0,0,0,.12)]
                backdrop-blur-lg
                sm:text-[10px]
              "
            >
              <span
                className="
                  h-2
                  w-2
                  rounded-full
                  bg-[#b5f58b]
                  shadow-[0_0_12px_rgba(181,245,139,.75)]
                "
              />
              Real-time
              <span className="text-white/25">•</span>
              AI-powered
              <span className="text-white/25">•</span>
              People-centric
            </div>

            {/* HEADING */}

            <h1
              className="
                max-w-[690px]
                text-[54px]
                font-bold
                leading-[0.96]
                tracking-[-0.055em]
                text-white
                drop-shadow-[0_8px_28px_rgba(0,0,0,.35)]
                sm:text-[68px]
                lg:text-[82px]
                xl:text-[88px]
              "
            >
              From Risk to
              <br />
              <span className="text-[#adf27d]">Resilience</span>
            </h1>

            {/* DESCRIPTION */}

            <p
              className="
                mt-7
                max-w-[620px]
                text-[15px]
                leading-7
                text-white/76
                sm:text-[17px]
                sm:leading-8
              "
            >
              Real-time disaster risk assessment, early warnings, and safer
              relocation options — powered by AI and geospatial data.
            </p>

            {/* BUTTONS */}

            <div
              className="
                mt-8
                flex
                flex-col
                gap-3
                sm:flex-row
              "
            >
              {/* GET STARTED → REGISTER */}

              <Link
                href="/register"
                className="
                  inline-flex
                  min-h-[52px]
                  items-center
                  justify-center
                  gap-3
                  rounded-xl
                  bg-[#aaf27d]
                  px-7
                  text-[14px]
                  font-bold
                  text-[#102918]
                  shadow-[0_14px_38px_rgba(126,218,82,.22)]
                  transition
                  hover:-translate-y-1
                  hover:bg-[#baf58f]
                "
              >
                Get Started
                <ArrowIcon />
              </Link>

              {/* EXPLORE LIVE MAP */}

              <a
                href="#risk-map"
                className="
                  inline-flex
                  min-h-[52px]
                  items-center
                  justify-center
                  gap-3
                  rounded-xl
                  border border-white/25
                  bg-[#123521]/55
                  px-7
                  text-[14px]
                  font-semibold
                  text-white
                  shadow-[0_10px_30px_rgba(0,0,0,.12)]
                  backdrop-blur-md
                  transition
                  hover:-translate-y-1
                  hover:border-[#b1ed91]/50
                  hover:bg-[#17462c]/65
                "
              >
                <MapIcon />
                Explore Live Map
              </a>
            </div>

            {/* SUPPORTING LINE */}

            <div
              className="
                mt-6
                flex
                items-center
                gap-3
                text-[12px]
                text-white/58
              "
            >
              <UsersIcon size={20} />

              <span>For safer communities. For a more resilient tomorrow.</span>
            </div>
          </div>
        </section>

        {/* ===================================================
            FLOOD RISK MARKER
        =================================================== */}

        <FloodRiskOverlay />

        {/* ===================================================
            LIVE HAZARD PANEL
        =================================================== */}

        <aside
          id="live-hazard"
          className="
            absolute
            right-7
            top-[120px]
            z-30
            hidden
            w-[255px]
            rounded-[22px]
            border border-white/16
            bg-[#102f20]/88
            p-4
            shadow-[0_20px_55px_rgba(0,0,0,.30)]
            backdrop-blur-2xl
            xl:block
          "
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border border-[#a9f08a]/35
                  bg-[#7ed65c]/10
                  text-[#b9f59c]
                "
              >
                <span className="text-[22px] leading-none">◎</span>
              </div>

              <div>
                <div
                  className="
                    flex
                    items-center
                    gap-1.5
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[0.12em]
                    text-[#aaf28a]
                  "
                >
                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-[#b4f88c]
                    "
                  />
                  Live
                </div>

                <div
                  className="
                    mt-1
                    text-[13px]
                    font-semibold
                    leading-[18px]
                    text-white
                  "
                >
                  Monitoring multiple
                  <br />
                  hazards
                </div>
              </div>
            </div>

            <span
              className="
                pt-1
                text-[18px]
                leading-none
                text-white/40
              "
            >
              ›
            </span>
          </div>

          <div className="my-3.5 h-px bg-white/10" />

          <div className="space-y-0.5">
            <HazardItem icon={<FloodIcon size={18} />} title="Floods" />

            <HazardItem icon={<MountainIcon size={18} />} title="Landslides" />

            <HazardItem icon={<WindIcon size={18} />} title="Cyclones" />

            <HazardItem icon={<RainIcon size={18} />} title="Heavy Rainfall" />
          </div>
        </aside>

        {/* ===================================================
            MOBILE HAZARD PANEL
        =================================================== */}

        <div
          className="
            absolute
            right-4
            top-[96px]
            z-30
            w-[178px]
            rounded-2xl
            border border-white/15
            bg-[#123520]/82
            p-3.5
            shadow-[0_18px_45px_rgba(0,0,0,.25)]
            backdrop-blur-xl
            xl:hidden
          "
        >
          <div
            className="
              mb-2.5
              flex
              items-center
              justify-between
            "
          >
            <span
              className="
                flex
                items-center
                gap-1.5
                text-[9px]
                font-bold
                uppercase
                tracking-[0.12em]
                text-[#b1f38d]
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[#b1f38d]
                "
              />
              Live
            </span>

            <span className="text-[9px] text-white/45">Monitoring</span>
          </div>

          <HazardItem icon={<FloodIcon size={17} />} title="Floods" />

          <HazardItem icon={<MountainIcon size={17} />} title="Landslides" />

          <HazardItem icon={<WindIcon size={17} />} title="Cyclones" />

          <HazardItem icon={<RainIcon size={17} />} title="Heavy Rainfall" />
        </div>

        {/* ===================================================
            IMPACT STATS
        =================================================== */}

        <section
          id="impact"
          className="
            absolute
            bottom-8
            left-5
            right-5
            z-40
            sm:left-8
            sm:right-8
            lg:left-12
            lg:right-12
          "
        >
          <div
            className="
              mx-auto
              flex
              max-w-[1160px]
              flex-col
              gap-2.5
              sm:flex-row
            "
          >
            <StatCard
              icon={<UsersIcon />}
              value="1.2M+"
              label="People potentially safer"
            />

            <StatCard
              icon={<PinIcon />}
              value="300+"
              label="High-risk areas monitored"
            />

            <StatCard
              icon={<ClockIcon />}
              value="24/7"
              label="Real-time updates"
            />

            <StatCard
              icon={<LeafIcon />}
              value="Stronger"
              label="Communities ahead"
            />
          </div>
        </section>
      </main>

      {/* =====================================================
          SECTION ANCHORS
      ===================================================== */}

      <span id="how-it-works" className="absolute bottom-0" />

      <span id="about" className="absolute bottom-0" />

      <span id="contact" className="absolute bottom-0" />

      <span id="risk-map" className="absolute bottom-0" />
    </section>
  );
}
