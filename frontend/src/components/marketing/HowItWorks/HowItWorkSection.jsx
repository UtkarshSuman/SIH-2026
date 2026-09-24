const steps = [
  {
    number: "01",
    title: "Collect Hazard Data",
    description:
      "Rescue Arc collects and processes multi-hazard and geospatial information from relevant data sources.",
  },
  {
    number: "02",
    title: "Identify Risk Zones",
    description:
      "The platform analyzes hazard information to identify areas that require closer risk assessment.",
  },
  {
    number: "03",
    title: "Assess Affected Population",
    description:
      "Settlement and population information is analyzed to understand how many people may be affected.",
  },
  {
    number: "04",
    title: "Plan Safe Relocation",
    description:
      "Authorities can evaluate relocation sites and safer routes for moving affected populations.",
  },
];

export default function HowItWorksSection() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="px-5 py-20 text-center">
        <p className="text-sm font-bold uppercase tracking-[3px] text-emerald-700">
          How It Works
        </p>

        <h1 className="mt-4 text-5xl font-extrabold text-slate-950">
          From Risk Detection to Safer Relocation
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-slate-600">
          Rescue Arc combines hazard information, population data, and
          geographic analysis to support informed relocation planning.
        </p>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-slate-200 bg-white p-7"
            >
              <span className="text-sm font-bold text-emerald-700">
                {step.number}
              </span>

              <h2 className="mt-3 text-2xl font-bold text-slate-900">
                {step.title}
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}