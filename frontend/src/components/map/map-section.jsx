"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import "leaflet/dist/leaflet.css";

function createPinIcon(colorHex) {
  return L.divIcon({
    className: "rescue-map-marker",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: ${colorHex};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
        "></div>
        <div style="
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${colorHex};
          opacity: 0.25;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const RED_ICON = createPinIcon("#ef4444");
const YELLOW_ICON = createPinIcon("#f59e0b");
const GREEN_ICON = createPinIcon("#10b981");

function MapRecenter({ position, zoom = 9 }) {
  const map = useMap();
  useEffect(() => {
    if (position && position[0] && position[1]) {
      map.flyTo(position, zoom, { duration: 1.2 });
    }
  }, [map, position, zoom]);
  return null;
}

export default function MapSection() {
  const router = useRouter();

  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [mapPosition, setMapPosition] = useState([30.5551, 79.5641]); // Default Joshimath
  const [search, setSearch] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dynamic zones from API/database
  useEffect(() => {
    let cancelled = false;
    fetch("/api/zones")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setZones(data);
          // Default to highest risk zone
          const highestRisk = [...data].sort((a, b) => b.worstScore - a.worstScore)[0];
          setSelectedZone(highestRisk || data[0]);
          setMapPosition([highestRisk.lat, highestRisk.lng]);
        }
      })
      .catch((err) => {
        console.warn("Failed to load dynamic zones:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = search.trim().toLowerCase();

    if (!query) {
      setSearchMessage("Enter a city, district, or state to search.");
      return;
    }

    const match = zones.find(
      (z) =>
        z.name.toLowerCase().includes(query) ||
        z.district.toLowerCase().includes(query) ||
        z.state.toLowerCase().includes(query) ||
        z.zoneId.toLowerCase().includes(query)
    );

    if (match) {
      setSelectedZone(match);
      setMapPosition([match.lat, match.lng]);
      setSearchMessage("");
    } else {
      setSearchMessage(`No direct zone match for "${search}". Try selecting from the options below.`);
    }
  };

  const handleSelectZone = (zone) => {
    setSelectedZone(zone);
    setMapPosition([zone.lat, zone.lng]);
    setSearchMessage("");
    setSearch(zone.name.split(",")[0]);
  };

  const zoneColorBadge = useMemo(() => {
    if (!selectedZone) return null;
    if (selectedZone.zoneColor === "RED") {
      return {
        bg: "bg-red-50 text-red-700 border-red-200",
        dot: "bg-red-500",
        label: "RED ZONE — CRITICAL HAZARD",
      };
    }
    if (selectedZone.zoneColor === "YELLOW") {
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
        label: "YELLOW ZONE — HEIGHTENED WATCH",
      };
    }
    return {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dot: "bg-emerald-500",
      label: "GREEN ZONE — MONITORING SAFE",
    };
  }, [selectedZone]);

  return (
    <section
      id="map"
      className="relative isolate z-0 w-full overflow-hidden bg-[#f2fbf7] px-5 py-16 sm:px-8 lg:px-12"
    >
      <div className="relative z-0 mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[1.6px] text-emerald-700">
            Multi-Hazard GIS Intelligence (SIH 26191)
          </p>

          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Live Red Zone & Vulnerability Map
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Dynamic ML hazard risk scores, real-time weather & terrain telemetry, and Sphere-standard
            evacuation readiness for vulnerable habitations.
          </p>
        </div>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="mx-auto mt-7 flex max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <div className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
            <span className="text-lg text-slate-400" aria-hidden="true">
              ⌖
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by city, district, or state (e.g. Joshimath, Wayanad, Patna)..."
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            className="flex h-12 items-center justify-center rounded-xl bg-emerald-700 px-7 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Search Location
          </button>
        </form>

        {searchMessage && (
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-amber-700">
            {searchMessage}
          </p>
        )}

        {/* Dynamic Zone Quick Filters */}
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          <span className="py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Monitored Zones:
          </span>

          {zones.map((zone) => {
            const isSelected = selectedZone?.zoneId === zone.zoneId;
            return (
              <button
                key={zone.zoneId}
                type="button"
                onClick={() => handleSelectZone(zone)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:text-emerald-700"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    zone.zoneColor === "RED"
                      ? "bg-red-500"
                      : zone.zoneColor === "YELLOW"
                      ? "bg-amber-400"
                      : "bg-emerald-500"
                  }`}
                />
                {zone.name.split(",")[0]}
              </button>
            );
          })}
        </div>

        {/* Map and information panel */}
        <div className="relative z-0 mt-10 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          {/* Map Container */}
          <div className="relative z-0 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="relative z-0 h-[400px] sm:h-[480px] lg:h-[580px]">
              <MapContainer
                center={mapPosition}
                zoom={9}
                scrollWheelZoom={true}
                className="rescue-leaflet-map h-full w-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapRecenter position={mapPosition} zoom={9} />

                {/* Render All Dynamic Zones on the map */}
                {zones.map((zone) => {
                  const isRed = zone.zoneColor === "RED";
                  const isYellow = zone.zoneColor === "YELLOW";
                  const colorHex = isRed ? "#ef4444" : isYellow ? "#f59e0b" : "#10b981";
                  const icon = isRed ? RED_ICON : isYellow ? YELLOW_ICON : GREEN_ICON;

                  return (
                    <div key={zone.zoneId}>
                      {/* Bounding Area Circle */}
                      <Circle
                        center={[zone.lat, zone.lng]}
                        radius={isRed ? 4500 : 3500}
                        pathOptions={{
                          color: colorHex,
                          fillColor: colorHex,
                          fillOpacity: isRed ? 0.35 : 0.2,
                          weight: 2,
                        }}
                        eventHandlers={{
                          click: () => handleSelectZone(zone),
                        }}
                      />

                      {/* Center Point Marker */}
                      <Marker
                        position={[zone.lat, zone.lng]}
                        icon={icon}
                        eventHandlers={{
                          click: () => handleSelectZone(zone),
                        }}
                      >
                        <Popup>
                          <div className="p-1">
                            <strong className="text-slate-900">{zone.name}</strong>
                            <div className="mt-1 flex items-center gap-1.5 text-xs">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ backgroundColor: colorHex }}
                              />
                              <span className="font-semibold">{zone.zoneColor} ZONE</span> —{" "}
                              <span>{zone.worstHazard} ({Math.round(zone.worstScore * 100)}%)</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              Population: {zone.population.toLocaleString()} | Priority: {zone.priority}
                            </p>
                          </div>
                        </Popup>
                      </Marker>
                    </div>
                  );
                })}
              </MapContainer>
            </div>

            {/* Map legend */}
            <div className="relative z-10 flex flex-wrap items-center justify-between border-t border-slate-100 bg-white px-5 py-3 text-xs text-slate-600">
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  Red Zone (Score &ge; 0.70)
                </span>

                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  Yellow Zone (0.40 - 0.70)
                </span>

                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  Green Zone (&lt; 0.40)
                </span>
              </div>

              <div className="text-[11px] text-slate-400">
                Source: Database Stored Snapshot (Non-Blocking)
              </div>
            </div>
          </div>

          {/* Dynamic Risk Details Panel */}
          {selectedZone ? (
            <div className="relative z-0 flex flex-col justify-between rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <div>
                {/* Zone Color Tag */}
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${
                    zoneColorBadge?.bg
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${zoneColorBadge?.dot}`} />
                  {zoneColorBadge?.label}
                </div>

                <h3 className="mt-3 text-2xl font-extrabold text-slate-900">
                  {selectedZone.name}
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  District: <span className="font-semibold text-slate-700">{selectedZone.district}</span> | State:{" "}
                  <span className="font-semibold text-slate-700">{selectedZone.state}</span> | ID:{" "}
                  <span className="font-mono text-slate-400">{selectedZone.zoneId}</span>
                </p>

                {/* Primary Metric Badges */}
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-500">Worst Hazard</p>
                    <p className="mt-0.5 text-sm font-bold text-red-600">
                      {selectedZone.worstHazard} ({(selectedZone.worstScore * 100).toFixed(1)}%)
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-500">Relocation Urgency</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {selectedZone.priority} ({selectedZone.priorityScore.toFixed(2)})
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-500">At-Risk Habitation</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {selectedZone.population.toLocaleString()} citizens
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-medium text-slate-500">Terrain Slope</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {selectedZone.slopeClass}
                    </p>
                  </div>
                </div>

                {/* Dynamic 4-Hazard Breakdown */}
                <div className="mt-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    ML Hazard Risk Breakdown:
                  </p>

                  <div className="mt-2.5 space-y-2">
                    {[
                      { name: "Flood Risk", val: selectedZone.hazardScores.FLOOD, color: "bg-blue-500" },
                      { name: "Landslide Risk", val: selectedZone.hazardScores.LANDSLIDE, color: "bg-amber-500" },
                      { name: "Erosion Risk", val: selectedZone.hazardScores.EROSION, color: "bg-teal-500" },
                      { name: "Cloudburst Risk", val: selectedZone.hazardScores.CLOUDBURST, color: "bg-purple-500" },
                    ].map((h) => (
                      <div key={h.name}>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">{h.name}</span>
                          <span className="font-semibold text-slate-900">
                            {(h.val * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${h.color}`}
                            style={{ width: `${Math.min(100, Math.max(0, h.val * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Physical Telemetry */}
                <div className="mt-4 rounded-xl border border-slate-100 bg-[#f8fafc] p-3 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Physical Sensor Snapshots:</p>
                  <div className="mt-1.5 grid grid-cols-2 gap-1 text-[11px]">
                    <div>Rainfall 24h: <span className="font-semibold text-slate-900">{selectedZone.metrics.rainfall_24h_mm} mm</span></div>
                    <div>Rainfall 72h: <span className="font-semibold text-slate-900">{selectedZone.metrics.rainfall_72h_mm} mm</span></div>
                    <div>River Flow: <span className="font-semibold text-slate-900">{selectedZone.metrics.river_discharge_m3s} m³/s</span></div>
                    <div>Soil Moisture: <span className="font-semibold text-slate-900">{selectedZone.metrics.soil_saturation_pct}%</span></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/relocation?zoneId=${encodeURIComponent(selectedZone.zoneId)}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Plan Relocation & View Safe Corridors →
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/analytics?zoneId=${encodeURIComponent(selectedZone.zoneId)}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  View Historical Hazard Analytics ↗
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-emerald-100 bg-white p-8 text-center text-sm text-slate-400">
              Loading dynamic zone intelligence...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
