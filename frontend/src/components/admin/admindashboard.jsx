"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Database,
  RefreshCw,
  ShieldAlert,
  Sliders,
  FileText,
} from "lucide-react";

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
import ZoneManagementModal from "./zone-management-modal";
import { RagDocumentUploadForm } from "./rag-document-upload-form";
import { OfflineFallbackBanner } from "@/components/ui/offline-fallback-banner";

import {
  getAffectedLocations,
  getDashboardStats,
} from "@/services/admin/dashboardservice";
import { getZoneBoundary, getZoneBoundaryFeature } from "@/lib/zone-boundaries";

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
  const [zones, setZones] = useState(mockzones);
  const [relocationSites, setRelocationSites] = useState(mockrelocationsites);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Offline Fallback State
  const [isFallback, setIsFallback] = useState(false);
  const [fallbackWarning, setFallbackWarning] = useState("");
  const [fallbackSource, setFallbackSource] = useState("");

  // Modals & Controls
  const [showPopulation, setShowPopulation] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zoneToEdit, setZoneToEdit] = useState(null);
  const [showChatbotModal, setShowChatbotModal] = useState(false);

  // Global Database Feedback State
  const [dbNotification, setDbNotification] = useState(null); // { type: "loading" | "success" | "error", text: string, timestamp?: string }

  const notify = useCallback((notif) => {
    if (!notif) {
      setDbNotification(null);
      return;
    }
    const timestamp = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setDbNotification({ ...notif, timestamp });
    if (notif.type === "success") {
      const timer = setTimeout(() => {
        setDbNotification((prev) => (prev?.timestamp === timestamp ? null : prev));
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, []);

  const fetchRelocationSites = async () => {
    try {
      const res = await fetch("/api/v1/relocation/sites", { cache: "no-store" });
      const data = await res.json();
      if (data?.sites && data.sites.length > 0) {
        const mapped = data.sites.map((s) => ({
          ...s,
          id: s.id || s.siteCode,
          name: s.name,
          location: `${s.district}, ${s.state}`,
          population: s.currentOccupancy ?? s.population ?? 0,
          capacity: s.capacity,
          status:
            (s.remainingCapacity !== undefined
              ? s.remainingCapacity
              : s.capacity - (s.currentOccupancy ?? 0)) <= 0
              ? "Full"
              : "Available",
        }));
        setRelocationSites(mapped);
      }
    } catch (err) {
      console.warn("Failed fetching backend relocation sites:", err);
    }
  };

  const fetchDynamicZones = async () => {
    try {
      const res = await fetch("/api/zones", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((z) => {
            return {
              id: z.zoneId,
              zoneId: z.zoneId,
              name: z.name,
              state: z.state,
              district: z.district,
              lat: z.lat,
              lng: z.lng,
              hazardType: z.worstHazard
                ? z.worstHazard.charAt(0) + z.worstHazard.slice(1).toLowerCase()
                : "Landslide",
              worstHazard: z.worstHazard,
              coordinates: z.boundaryCoordinates || getZoneBoundary(z),
              boundary: getZoneBoundaryFeature(z),
              riskLevel:
                z.zoneColor === "RED"
                  ? "High"
                  : z.zoneColor === "YELLOW"
                  ? "Moderate"
                  : "Low",
              zoneColor: z.zoneColor,
              affectedPeople: z.population || 0,
              population: z.population || 0,
              status: z.isRedZone ? "active" : "monitoring",
              isRedZone: z.isRedZone,
              priority: z.priority,
            };
          });
          setZones(mapped);
        }
      }
    } catch (err) {
      console.warn("Failed fetching dynamic zones for map:", err);
    }
  };

  const loadDashboard = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);
      setError(null);

      const [overviewData, locationData, statsData] = await Promise.all([
        fetch(`/api/admin/overview?t=${Date.now()}`, { cache: "no-store" })
          .then((r) => r.json())
          .catch(() => null),
        getAffectedLocations(filters),
        getDashboardStats(),
        fetchRelocationSites(),
        fetchDynamicZones(),
      ]);

      if (overviewData) {
        setIsFallback(Boolean(overviewData.isFallback));
        if (overviewData.isFallback) {
          setFallbackWarning(overviewData.warning || "Database or backend offline using internal latest data.");
          setFallbackSource(overviewData.source || "CENTRAL_FALLBACK_STORE");
        }
      }

      setLocations(locationData);
      setStats(statsData);

      if (isManualRefresh) {
        notify({
          type: "success",
          text: overviewData?.isFallback
            ? "✓ Reconnection attempted: Currently utilizing verified latest fallback cache while PostgreSQL is offline."
            : "✓ Successfully refreshed dynamic hazard and relocation data from PostgreSQL database.",
        });
      }
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setError("Failed to load dashboard data from database.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, notify]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function handleLocationSelect(location) {
    setSelectedLocation(location);
  }

  function handleOpenZoneModal(targetLocation = null) {
    setZoneToEdit(targetLocation || selectedLocation);
    setShowZoneModal(true);
  }

  function handleZoneUpdated(updatedZone) {
    setZones((prev) =>
      prev.map((z) =>
        (z.zoneId || z.id) === (updatedZone.zoneId || updatedZone.id)
          ? { ...z, ...updatedZone }
          : z
      )
    );
    setLocations((prev) =>
      prev.map((l) =>
        (l.zoneId || l.id) === (updatedZone.zoneId || updatedZone.id)
          ? {
              ...l,
              riskLevel:
                updatedZone.zoneColor === "RED"
                  ? "High"
                  : updatedZone.zoneColor === "YELLOW"
                  ? "Moderate"
                  : "Low",
              peopleAffected: updatedZone.population ?? l.peopleAffected,
              hazardType: updatedZone.worstHazard ?? l.hazardType,
            }
          : l
      )
    );
    loadDashboard();
  }

  function handlePopulationUpdated(updatedSite) {
    setRelocationSites((previous) =>
      previous.map((site) =>
        site.id === updatedSite.id
          ? { ...site, ...updatedSite, population: updatedSite.population }
          : site
      )
    );
    fetchRelocationSites();
    loadDashboard();
  }

  return (
    <div className="min-h-screen bg-[#f7f9f8]">
      {/* ===============================
          NAVBAR
      ================================ */}
      <Adminnavbar />

      <main className="px-6 py-6 space-y-6">
        {/* ===============================
            HEADER & ACTIONS
        ================================ */}
        <div className="flex flex-col gap-4">
          <Adminheader />

          {/* Offline Fallback Banner */}
          {isFallback && (
            <OfflineFallbackBanner
              isFallback={true}
              message={fallbackWarning || "Database or backend offline using internal latest data."}
              source={fallbackSource || "Internal Latest Snapshot"}
              onRetry={() => loadDashboard(true)}
              isRetrying={isRefreshing}
            />
          )}

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className={`flex h-2.5 w-2.5 rounded-full ${isFallback ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
              <span className="text-xs font-bold text-slate-700">
                {isFallback ? "Offline Fallback Cache Mode" : "Connected to PostgreSQL Database"}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600">
                {zones.length} Zones &bull; {relocationSites.length} Relocation Sites
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleOpenZoneModal(null)}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Manage Zone Emergency in DB
              </button>

              <button
                onClick={() => setShowPopulation(true)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Sliders className="h-3.5 w-3.5" />
                Update Site Capacity in DB
              </button>

              <button
                onClick={() => loadDashboard(true)}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`}
                />
                Refresh DB Data
              </button>
            </div>
          </div>
        </div>

        {/* ===============================
            PERSISTENT DB NOTIFICATION BANNER
        ================================ */}
        {dbNotification && (
          <div
            className={`sticky top-3 z-[9990] flex items-center justify-between gap-4 rounded-xl border px-5 py-3.5 shadow-xl transition-all ${
              dbNotification.type === "loading"
                ? "border-blue-400 bg-blue-50 text-blue-900 ring-2 ring-blue-300 animate-pulse"
                : dbNotification.type === "success"
                ? "border-emerald-400 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300"
                : "border-red-400 bg-red-50 text-red-950 ring-2 ring-red-300"
            }`}
          >
            <div className="flex items-center gap-3">
              {dbNotification.type === "loading" && (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-600" />
              )}
              {dbNotification.type === "success" && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              )}
              {dbNotification.type === "error" && (
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
              )}

              <div>
                <p className="text-sm font-bold">
                  {dbNotification.type === "loading" && "Applying changes to database..."}
                  {dbNotification.type === "success" && "Database Update Successful"}
                  {dbNotification.type === "error" && "Database Operation Failed"}
                </p>
                <p className="text-xs font-medium opacity-90">{dbNotification.text}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {dbNotification.timestamp && (
                <span className="text-[11px] font-mono text-slate-500">
                  {dbNotification.timestamp}
                </span>
              )}
              <button
                onClick={() => setDbNotification(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-black/5 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===============================
            QUICK SUMMARY
        ================================ */}
        <Adminsummarycards
          relocationSites={relocationSites}
          stats={stats}
          onUpdatePopulation={() => setShowPopulation(true)}
          onManageAlerts={() => handleOpenZoneModal(null)}
          onOpenChatbot={() => setShowChatbotModal(true)}
        />

        {/* ===============================
            SELECTED LOCATION BANNER (If clicked)
        ================================ */}
        {selectedLocation && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Focused Location: {selectedLocation.name}
                </h4>
                <p className="text-xs text-slate-600">
                  {selectedLocation.district}, {selectedLocation.state} &bull; Hazard:{" "}
                  <strong>{selectedLocation.hazardType}</strong> &bull; People Affected:{" "}
                  <strong>
                    {(
                      selectedLocation.peopleAffected ||
                      selectedLocation.population ||
                      0
                    ).toLocaleString()}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenZoneModal(selectedLocation)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-800"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                Override Hazard / Population in DB
              </button>

              <button
                onClick={() => setSelectedLocation(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-emerald-100 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===============================
            MAIN DASHBOARD
        ================================ */}
        <div className="grid grid-cols-12 gap-5">
          {/* LEFT: FILTERS */}
          <aside className="col-span-12 xl:col-span-2">
            <Mapfilters filters={filters} setFilters={setFilters} />
          </aside>

          {/* CENTER: HAZARD MAP */}
          <section className="col-span-12 xl:col-span-7">
            <Hazardmap
              locations={locations}
              zones={zones}
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationSelect}
              loading={loading}
            />
          </section>

          {/* RIGHT: RECENT AREAS & COVERAGE */}
          <aside className="col-span-12 space-y-5 xl:col-span-3">
            <Recentaffectedareas
              locations={locations}
              onSelectLocation={(loc) => {
                handleLocationSelect(loc);
              }}
            />

            <Zonecoverage stats={stats} />
          </aside>
        </div>

        {/* ===============================
            ERROR NOTIFICATION
        ================================ */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ===============================
            RELOCATION POPULATION PLANNING (LIVE DB SYNC)
        ================================ */}
        <RelocationPopulationPlanning
          onNotify={notify}
          onPlanUpdated={() => loadDashboard()}
        />

        {/* ===============================
            SAFE RELOCATION ROUTES (LIVE DB SYNC)
        ================================ */}
        <SafeRelocationRoutes onNotify={notify} />
      </main>

      {/* ===============================
          ZONE EMERGENCY CONTROL MODAL
      ================================ */}
      <ZoneManagementModal
        isOpen={showZoneModal}
        zones={zones}
        initialZone={zoneToEdit || selectedLocation}
        onClose={() => {
          setShowZoneModal(false);
          setZoneToEdit(null);
        }}
        onZoneUpdated={handleZoneUpdated}
        onNotify={notify}
      />

      {/* ===============================
          POPULATION / SITE CAPACITY MODAL
      ================================ */}
      {showPopulation && (
        <Relocationpopulation
          sites={relocationSites}
          onClose={() => setShowPopulation(false)}
          onPopulationUpdated={handlePopulationUpdated}
          onNotify={notify}
        />
      )}

      {/* ===============================
          CHATBOT & RAG INGESTION MODAL
      ================================ */}
      {showChatbotModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
              <div>
                <h3 className="font-bold text-white">Rescue Arc Assistant & Document Ingestion</h3>
                <p className="text-xs text-slate-300">Ingest operational documents into RAG vector storage</p>
              </div>
              <button
                onClick={() => setShowChatbotModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <RagDocumentUploadForm />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
