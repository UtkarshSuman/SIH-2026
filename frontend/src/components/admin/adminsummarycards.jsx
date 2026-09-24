"use client";

import { Users, Bell, MessageCircle, ArrowUpRight } from "lucide-react";

export default function Adminsummarycards({
  relocationSites = [],
  onUpdatePopulation,
  onManageAlerts,
  onOpenChatbot,
}) {
  // Calculate population from current data
  const totalPopulation = relocationSites.reduce(
    (total, site) => total + (site.population || 0),
    0,
  );

  const totalCapacity = relocationSites.reduce(
    (total, site) => total + (site.capacity || 0),
    0,
  );

  const occupancy =
    totalCapacity > 0 ? Math.round((totalPopulation / totalCapacity) * 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* =====================================
          RELOCATION POPULATION
      ====================================== */}

      <button
        onClick={onUpdatePopulation}
        className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
              <Users size={23} className="text-blue-600" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Relocation Population
              </p>

              <h3 className="mt-1 text-2xl font-bold text-[#0b1838]">
                {totalPopulation.toLocaleString()}
              </h3>
            </div>
          </div>

          <ArrowUpRight
            size={20}
            className="text-slate-400 transition group-hover:text-blue-600"
          />
        </div>

        <div className="mt-5 flex gap-6">
          <div>
            <p className="text-xs text-slate-500">Active Sites</p>

            <p className="mt-1 font-semibold text-slate-800">
              {relocationSites.length}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Capacity</p>

            <p className="mt-1 font-semibold text-slate-800">
              {totalCapacity.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Occupancy</p>

            <p className="mt-1 font-semibold text-blue-600">{occupancy}%</p>
          </div>
        </div>

        <p className="mt-4 text-xs font-medium text-blue-600">
          Click to update population →
        </p>
      </button>

      {/* =====================================
          MANAGE ALERTS
      ====================================== */}

      <button
        onClick={onManageAlerts}
        className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50">
              <Bell size={23} className="text-red-500" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Manage Alerts
              </p>

              <h3 className="mt-1 text-2xl font-bold text-[#0b1838]">3</h3>
            </div>
          </div>

          <ArrowUpRight
            size={20}
            className="text-slate-400 transition group-hover:text-red-500"
          />
        </div>

        <div className="mt-5 flex gap-6">
          <div>
            <p className="text-xs text-slate-500">Critical</p>

            <p className="mt-1 font-semibold text-red-600">1</p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Warning</p>

            <p className="mt-1 font-semibold text-yellow-600">2</p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Status</p>

            <p className="mt-1 font-semibold text-emerald-600">Active</p>
          </div>
        </div>

        <p className="mt-4 text-xs font-medium text-red-500">
          View and manage alerts →
        </p>
      </button>

      {/* =====================================
          CHATBOT
      ====================================== */}

      <button
        onClick={onOpenChatbot}
        className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50">
              <MessageCircle size={23} className="text-emerald-700" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Rescue Arc Assistant
              </p>

              <h3 className="mt-1 text-xl font-bold text-[#0b1838]">
                Manage Chatbot
              </h3>
            </div>
          </div>

          <ArrowUpRight
            size={20}
            className="text-slate-400 transition group-hover:text-emerald-700"
          />
        </div>

        <div className="mt-5">
          <p className="text-sm text-slate-600">
            Manage chatbot setting and document ingestion.
          </p>
        </div>

        <p className="mt-4 text-xs font-medium text-emerald-700">
          Manage Rescue Arc Assistant →
        </p>
      </button>
    </div>
  );
}
