"use client";

import { useEffect, useState } from "react";

import Adminnavbar from "./adminnavbar";
import Adminheader from "./adminheader";
import Adminsummarycards from "./adminsummarycards";
import Mapfilters from "./mapfilters";
import Hazardmap from "./hazardmap";
import Recentaffectedareas from "./recentaffectedareas";
import Zonecoverage from "./zonecoverage";
import Relocationpopulation from "./relocationpopulation";
import RelocationPopulationPlanning from "./relocationpopulationplanning";
import SafeRelocationRoutes from "./saferelocationroutes";

import {
  getAffectedLocations,
  getDashboardStats,
} from "@/services/admin/dashboardservice";

import { mockzones } from "@/data/mockzones";
import { mockrelocationsites } from "@/data/mockrelocationsites";

export default function Admindashboard() {
  const [filters, setFilters] = useState({
    hazardType: "All",
    riskLevel: "All",
    state: "All",
    district: "All",
  });

  const [locations, setLocations] = useState([]);

  const [stats, setStats] = useState(null);

  const [zones] = useState(mockzones);

  const [relocationSites, setRelocationSites] = useState(mockrelocationsites);

  const [showPopulation, setShowPopulation] = useState(false);

  const [selectedLocation, setSelectedLocation] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [locationData, statsData] = await Promise.all([
          getAffectedLocations(filters),
          getDashboardStats(),
        ]);

        setLocations(locationData);
        setStats(statsData);
      } catch (error) {
        console.error("Dashboard loading error:", error);

        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [filters]);

  function handleLocationSelect(location) {
    setSelectedLocation(location);
  }

  function handlePopulationUpdated(updatedSite) {
    setRelocationSites((previous) =>
      previous.map((site) => (site.id === updatedSite.id ? updatedSite : site)),
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9f8]">
      {/* ===============================
          NAVBAR
      ================================ */}

      <Adminnavbar />

      <main className="px-6 py-6">
        {/* ===============================
            HEADER
        ================================ */}

        <Adminheader />

        {/* ===============================
            QUICK SUMMARY
        ================================ */}

        <div className="mt-6">
          <Adminsummarycards
            locations={locations}
            relocationSites={relocationSites}
            onUpdatePopulation={() => setShowPopulation(true)}
          />
        </div>

        {/* ===============================
            MAIN DASHBOARD
        ================================ */}

        <div className="mt-6 grid grid-cols-12 gap-5">
          {/* LEFT */}

          <aside className="col-span-12 xl:col-span-2">
            <Mapfilters filters={filters} setFilters={setFilters} />
          </aside>

          {/* CENTER */}

          <section className="col-span-12 xl:col-span-7">
            <Hazardmap
              locations={locations}
              zones={zones}
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              loading={loading}
            />
          </section>

          {/* RIGHT */}

          <aside className="col-span-12 space-y-5 xl:col-span-3">
            <Recentaffectedareas
              locations={locations}
              onSelectLocation={handleLocationSelect}
            />

            <Zonecoverage stats={stats} />
          </aside>
        </div>

        {/* ===============================
            ERROR
        ================================ */}

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ===============================
            RELOCATION POPULATION PLANNING
        ================================ */}

        <RelocationPopulationPlanning />

        {/* ===============================
            SAFE RELOCATION ROUTES
        ================================ */}

        <SafeRelocationRoutes />
      </main>

      {/* ===============================
          POPULATION MODAL
      ================================ */}

      {showPopulation && (
        <Relocationpopulation
          sites={relocationSites}
          onClose={() => setShowPopulation(false)}
          onPopulationUpdated={handlePopulationUpdated}
        />
      )}
    </div>
  );
}
