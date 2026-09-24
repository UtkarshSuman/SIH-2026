import FeatureCard from "./FeatureCard";

const features = [
  {
    title: "Hazard Red Zone Identification",
    description:
      "Identify and visualize areas exposed to multiple hazards using geospatial data.",
    icon: "⚠️",
  },
  {
    title: "Settlement Vulnerability",
    description:
      "Assess settlements and understand the population affected by identified hazards.",
    icon: "🏘️",
  },
  {
    title: "Relocation Planning",
    description:
      "Support authorities in identifying suitable relocation areas and planning population movement.",
    icon: "📍",
  },
  {
    title: "Risk Analysis",
    description:
      "Combine hazard and settlement information to support risk-based decision making.",
    icon: "📊",
  },
  {
    title: "Safe Route Planning",
    description:
      "Identify safer routes for moving affected populations from vulnerable areas.",
    icon: "🛣️",
  },
  {
    title: "Authority Dashboard",
    description:
      "Provide authorities with centralized information for monitoring and managing affected areas.",
    icon: "🖥️",
  },
];

export default function FeatureSection() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="px-5 py-20 text-center">
        <p className="text-sm font-bold uppercase tracking-[3px] text-emerald-700">
          Platform Capabilities
        </p>

        <h1 className="mt-4 text-5xl font-extrabold text-slate-950">
          Powerful Tools for Safer Communities
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-slate-600">
          Rescue Arc brings hazard intelligence, population analysis, and
          relocation planning together in one platform.
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </section>
    </main>
  );
}