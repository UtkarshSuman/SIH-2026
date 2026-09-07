"use client";

import { useState } from "react";
import FeatureCard from "./FeatureCard";

const hazards = [
  {
    id: "flood",
    title: "Floods",
    status: "HIGH RISK",
    description: "Detect flood-prone areas using terrain and rainfall signals.",
  },
  {
    id: "landslide",
    title: "Landslides",
    status: "MONITORED",
    description: "Identify vulnerable terrain and potential landslide zones.",
  },
  {
    id: "cyclone",
    title: "Cyclones",
    status: "LIVE TRACKING",
    description: "Track changing cyclone conditions and affected regions.",
  },
  {
    id: "rainfall",
    title: "Heavy Rainfall",
    status: "LIVE MONITORING",
    description: "Monitor intense rainfall patterns and emerging risk.",
  },
];

export default function FeaturesSection() {
  const [activeHazard, setActiveHazard] = useState("flood");

  return (
    <section className="min-h-screen bg-[#061b10] px-6 pb-20 pt-[140px] text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#aaf27d]">
          Hazard Intelligence
        </div>

        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          One map.
          <br />
          <span className="text-[#aaf27d]">Multiple hazards.</span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-white/50">
          Rescue Arc brings multiple disaster signals into one intelligent view,
          helping communities understand where risk is developing before it
          becomes an emergency.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {hazards.map((hazard) => (
            <FeatureCard
              key={hazard.id}
              title={hazard.title}
              status={hazard.status}
              description={hazard.description}
              active={activeHazard === hazard.id}
              onClick={() => setActiveHazard(hazard.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
