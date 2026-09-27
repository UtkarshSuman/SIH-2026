"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Polygon,
  Marker,
  GeoJSON,
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { getZoneBoundary, getZoneBoundaryFeature, hasRealBoundary } from "@/lib/zone-boundaries";
import "leaflet/dist/leaflet.css";

const colors = {
  RED: "#dc2626",
  YELLOW: "#d97706",
  GREEN: "#16a34a",
};

function createPinIcon(colorHex) {
  if (typeof window === "undefined" || !L.divIcon) return undefined;
  return L.divIcon({
    className: "custom-pin",
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
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: ${colorHex};
          opacity: 0.35;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

// Recalculates tile coverage after mount and on window resize to prevent grey tiles
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const tid1 = setTimeout(() => map.invalidateSize(), 100);
    const tid2 = setTimeout(() => map.invalidateSize(), 400);
    const tid3 = setTimeout(() => map.invalidateSize(), 1000);
    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(tid1);
      clearTimeout(tid2);
      clearTimeout(tid3);
      window.removeEventListener("resize", handleResize);
    };
  }, [map]);
  return null;
}

function MapFocus({ zone }) {
  const map = useMap();
  const lastZoneIdRef = useRef(null);

  useEffect(() => {
    if (zone && zone.lat && zone.lng) {
      const currentId = zone.zoneId || `${zone.lat.toFixed(4)},${zone.lng.toFixed(4)}`;
      if (lastZoneIdRef.current !== currentId) {
        lastZoneIdRef.current = currentId;
        map.flyTo([zone.lat, zone.lng], 11, { duration: 0.8 });
      }
    }
  }, [map, zone]);
  return null;
}

// Click Handler: Shows green circular marker + live popup + fetches telemetry + updates color & card
function MapClickHandler({ onPointAnalyzed, onLocationSelect }) {
  const [analyzingPoint, setAnalyzingPoint] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const markerRef = useRef(null);

  useEffect(() => {
    if (markerRef.current && analyzingPoint) {
      try {
        markerRef.current.openPopup();
      } catch (_) {}
    }
  }, [analyzingPoint, statusMessage]);

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setIsError(false);
      setStatusMessage("🛰️ Fetching live GIS data (weather, slope, discharge) & running ML models...");
      setAnalyzingPoint({ lat, lng });

      try {
        const res = await fetch(`/api/analyze-point?lat=${lat}&lon=${lng}&radius_km=5`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setIsError(true);
          setStatusMessage(`❌ Failed: ${errData.detail || errData.error || res.statusText}`);
          setTimeout(() => setAnalyzingPoint(null), 4000);
          return;
        }

        const data = await res.json();
        const score = data.hazard_scores?.[data.worst_hazard] ?? data.priority_score ?? 0.35;

        const newZone = {
          zoneId: data.zone_id || `custom-${lat.toFixed(4)}-${lng.toFixed(4)}`,
          name: data.zone_name || `Point (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
          district: "Custom Analyzed Spot",
          state: "Live Telemetry",
          lat: data.center?.lat ?? lat,
          lng: data.center?.lon ?? lng,
          zoneColor: data.zone_color || "GREEN",
          worstHazard: data.worst_hazard || "MULTI-HAZARD",
          worstScore: score,
          worstStatus: data.zone_color || "GREEN",
          hazardScores: {
            FLOOD: data.hazard_scores?.FLOOD ?? 0,
            LANDSLIDE: data.hazard_scores?.LANDSLIDE ?? 0,
            EROSION: data.hazard_scores?.EROSION ?? 0,
            CLOUDBURST: data.hazard_scores?.CLOUDBURST ?? 0,
          },
          priority: data.priority || "LOW",
          priorityScore: data.priority_score ?? 0.0,
          population: data.population ?? 1200,
          slopeClass: data.hazard_details?.landslide?.parameters?.slope_degrees
            ? `${data.hazard_details.landslide.parameters.slope_degrees}°`
            : "N/A",
          isClickAnalyzed: true,
          metrics: {
            rainfall_24h_mm: data.hazard_details?.flood?.parameters?.rainfall_mm_24h ?? 0,
            rainfall_72h_mm: data.hazard_details?.flood?.parameters?.rainfall_mm_72h ?? 0,
            river_discharge_m3s: data.hazard_details?.flood?.parameters?.river_discharge_m3s ?? 0,
            soil_saturation_pct: data.hazard_details?.landslide?.parameters?.soil_moisture_pct ?? 0,
            elevation_m: data.hazard_details?.flood?.parameters?.elevation_m ?? 0,
          },
        };

        setAnalyzingPoint(null);
        if (onPointAnalyzed) onPointAnalyzed(newZone);
        if (onLocationSelect) onLocationSelect(newZone);
      } catch (err) {
        setIsError(true);
        setStatusMessage(`❌ Error: ${err.message}`);
        setTimeout(() => setAnalyzingPoint(null), 4000);
      }
    },
  });

  if (!analyzingPoint) return null;

  return (
    <CircleMarker
      ref={markerRef}
      center={[analyzingPoint.lat, analyzingPoint.lng]}
      radius={16}
      pathOptions={{
        color: isError ? "#ef4444" : "#10b981",
        fillColor: isError ? "#f87171" : "#34d399",
        fillOpacity: 0.85,
        weight: 3,
      }}
    >
      <Popup autoClose={false} closeOnClick={false}>
        <div style={{ minWidth: "230px", fontSize: "12px", padding: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", color: "#0f172a" }}>
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: isError ? "#ef4444" : "#10b981",
                animation: isError ? "none" : "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
              }}
            />
            {isError ? "Analysis Failed" : "🛰 Analyzing Spot Live..."}
          </div>
          <p style={{ marginTop: "6px", color: "#334155", lineHeight: "1.4" }}>{statusMessage}</p>
          <div
            style={{
              marginTop: "6px",
              paddingTop: "6px",
              borderTop: "1px solid #f1f5f9",
              fontSize: "10px",
              color: "#94a3b8",
              fontFamily: "monospace",
            }}
          >
            {analyzingPoint.lat.toFixed(5)}°N, {analyzingPoint.lng.toFixed(5)}°E
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
}

export default function RedZoneMap({
  zones = [],
  selectedZone = null,
  onLocationSelect = () => {},
  onPointAnalyzed = () => {},
  isFallback = false,
  warningMessage = "",
}) {
  const [activeBasemap, setActiveBasemap] = useState("terrain");

  const basemaps = {
    terrain: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom",
      maxZoom: 18,
    },
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      maxZoom: 18,
    },
    dark: {
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      maxZoom: 19,
    },
  };

  const basemap = basemaps[activeBasemap] || basemaps.terrain;

  return (
    <div className="relative min-h-[620px] h-[620px] w-full rounded-2xl border border-slate-200/80 shadow-inner bg-slate-950">
      {/* Offline/Fallback status indicator */}
      {isFallback && (
        <div className="absolute top-3 left-3 z-[1000] max-w-sm rounded-lg bg-amber-500/95 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-md backdrop-blur flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-slate-950 animate-ping" />
          <span>{warningMessage || "Offline data mode active"}</span>
        </div>
      )}

      {/* Layer switcher controls */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center rounded-lg bg-white/90 p-1 shadow-md backdrop-blur border border-slate-200/60 text-xs">
        {Object.keys(basemaps).map((bm) => (
          <button
            key={bm}
            onClick={() => setActiveBasemap(bm)}
            className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
              activeBasemap === bm
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {bm}
          </button>
        ))}
      </div>

      <MapContainer
        center={[22.5, 82.0]}
        zoom={5}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          key={activeBasemap}
          attribution={basemap.attribution}
          url={basemap.url}
          maxZoom={basemap.maxZoom}
        />

        <MapResizer />
        <MapFocus zone={selectedZone} />
        <MapClickHandler
          onPointAnalyzed={onPointAnalyzed}
          onLocationSelect={onLocationSelect}
        />

        {zones.map((zone) => {
          if (!zone.lat || !zone.lng) return null;
          const color = colors[zone.zoneColor] || colors.GREEN;
          const isSelected = zone.zoneId === selectedZone?.zoneId;
          const boundaryFeature = getZoneBoundaryFeature(zone);
          const coords = zone.boundaryCoordinates || getZoneBoundary(zone);
          const isReal = hasRealBoundary(zone);

          const popupContent = (
            <div className="min-w-56 p-1 text-xs">
              <div className="flex items-center justify-between border-b pb-1.5">
                <p className="font-bold text-slate-900 text-sm">{zone.name}</p>
                <div className="flex items-center gap-1">
                  {isReal && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      OSM
                    </span>
                  )}
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase text-white"
                    style={{ backgroundColor: color }}
                  >
                    {zone.zoneColor} ZONE
                  </span>
                </div>
              </div>

              <div className="mt-2 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="font-medium">Worst Hazard:</span>
                  <span className="font-bold text-slate-900">{zone.worstHazard || "MULTI-HAZARD"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="font-medium">Calculated Risk:</span>
                  <span className="font-bold" style={{ color }}>
                    {((zone.worstScore ?? 0) * 100).toFixed(1)}%
                  </span>
                </div>

                {zone.priority && (
                  <div className="flex justify-between">
                    <span className="font-medium">Priority:</span>
                    <span className="font-semibold text-slate-800">{zone.priority}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="font-medium">Est. Population:</span>
                  <span className="font-semibold text-slate-800">
                    {zone.population ? zone.population.toLocaleString() : "N/A"}
                  </span>
                </div>
              </div>

              {zone.hazardScores && Object.keys(zone.hazardScores).length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Hazard Breakdown</p>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {Object.entries(zone.hazardScores).map(([hazard, score]) => (
                      <div key={hazard} className="flex justify-between bg-slate-50 px-1.5 py-0.5 rounded">
                        <span className="text-slate-500 capitalize">{hazard.toLowerCase()}:</span>
                        <span className="font-mono font-semibold text-slate-700">{(score * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2 pt-1.5 border-t border-slate-100 flex justify-between text-[10px] text-slate-400">
                <span>{zone.isClickAnalyzed ? "Point Analyzed Live" : "Database Synchronized"}</span>
                <span>
                  {zone.lastAssessedAt
                    ? new Date(zone.lastAssessedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Live"}
                </span>
              </div>
            </div>
          );

          // CRITICAL: Use React.Fragment (not div) as wrapper inside MapContainer
          return (
            <React.Fragment key={zone.zoneId || `${zone.lat}-${zone.lng}`}>
              {/* Authentic Real OSM Boundary Polygon */}
              {boundaryFeature ? (
                <GeoJSON
                  key={`geojson-${zone.zoneId || zone.lat}-${zone.lastAssessedAt || ""}`}
                  data={boundaryFeature}
                  style={{
                    color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.45 : zone.zoneColor === "RED" ? 0.35 : 0.22,
                    weight: isSelected ? 3.5 : 2,
                  }}
                  eventHandlers={{ click: () => onLocationSelect(zone) }}
                >
                  <Popup>{popupContent}</Popup>
                </GeoJSON>
              ) : isReal || (coords && coords.length >= 3) ? (
                <Polygon
                  positions={coords}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.45 : zone.zoneColor === "RED" ? 0.35 : 0.22,
                    weight: isSelected ? 3.5 : 2,
                  }}
                  eventHandlers={{ click: () => onLocationSelect(zone) }}
                >
                  <Popup>{popupContent}</Popup>
                </Polygon>
              ) : (
                <Circle
                  center={[zone.lat, zone.lng]}
                  radius={isSelected ? 10000 : 7000}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.45 : zone.zoneColor === "RED" ? 0.35 : 0.22,
                    weight: isSelected ? 3.5 : 2,
                  }}
                  eventHandlers={{ click: () => onLocationSelect(zone) }}
                >
                  <Popup>{popupContent}</Popup>
                </Circle>
              )}

              {/* Center Marker Pin */}
              <Marker
                position={[zone.lat, zone.lng]}
                icon={createPinIcon(color)}
                eventHandlers={{ click: () => onLocationSelect(zone) }}
              >
                <Popup>{popupContent}</Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
