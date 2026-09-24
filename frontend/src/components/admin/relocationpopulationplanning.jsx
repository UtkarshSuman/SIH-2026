"use client";

import { Users, MapPin, ArrowRight } from "lucide-react";

const populationData = [
  {
    id: 1,
    village: "Village A",
    zone: "Red Zone Z-101",
    totalPopulation: 5000,
    affectedPopulation: 4500,
    relocationSite: "Shelter Alpha",
    assignedCapacity: 4800,
  },
  {
    id: 2,
    village: "Village B",
    zone: "Red Zone Z-087",
    totalPopulation: 3200,
    affectedPopulation: 2700,
    relocationSite: "Shelter Beta",
    assignedCapacity: 3000,
  },
  {
    id: 3,
    village: "Village C",
    zone: "Red Zone Z-056",
    totalPopulation: 4100,
    affectedPopulation: 3500,
    relocationSite: "Shelter Gamma",
    assignedCapacity: 3800,
  },
];

export default function RelocationPopulationPlanning() {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">
            Relocation Population Planning
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Population requiring relocation based on affected population.
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
      </div>

      {/* Population Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {populationData.map((item) => {
          const unaffectedPopulation =
            item.totalPopulation - item.affectedPopulation;

          const remainingCapacity =
            item.assignedCapacity - item.affectedPopulation;

          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              {/* Village */}
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">
                    {item.village}
                  </h3>

                  <p className="mt-1 text-xs text-red-500">{item.zone}</p>
                </div>

                <MapPin className="h-4 w-4 text-slate-400" />
              </div>

              {/* Population Information */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Population</span>

                  <span className="font-medium text-slate-800">
                    {item.totalPopulation.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Affected Population</span>

                  <span className="font-medium text-red-600">
                    {item.affectedPopulation.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Unaffected Population</span>

                  <span className="font-medium text-green-600">
                    {unaffectedPopulation.toLocaleString()}
                  </span>
                </div>

                <div className="my-3 border-t border-slate-100" />

                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    Population to Relocate
                  </span>

                  <span className="font-bold text-blue-600">
                    {item.affectedPopulation.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Assigned Capacity</span>

                  <span className="font-medium text-slate-800">
                    {item.assignedCapacity.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Remaining Capacity</span>

                  <span
                    className={`font-semibold ${
                      remainingCapacity >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {remainingCapacity.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action */}
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800">
                View Relocation Plan
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
