"use client";

import { useEffect, useState, useRef } from "react";
import {
  Polygon,
  Marker,
  GeoJSON,
  Circle,
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

function MapClickHandler({ onPointAnalyzed, onLocationSelect }) {
  const [analyzing, setAnalyzing] = useState(false);

  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      if (!onPointAnalyzed) return;

      try {
        setAnalyzing(true);
        const res = await fetch(
          `/api/zones?action=analyze-point&lat=${lat.toFixed(5)}&lng=${lng.toFixed(5)}`
        );
        if (!res.ok) throw new Error("Point analysis failed");
        const analyzed = await res.json();
        if (analyzed && analyzed.zoneId) {
          onPointAnalyzed(analyzed);
          if (onLocationSelect) onLocationSelect(analyzed);
        }
      } catch (err) {
        console.error("Map click analysis failed:", err);
      } finally {
        setAnalyzing(false);
      }
    },
  });

  return analyzing ? (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-full shadow-lg border border-slate-700 backdrop-blur animate-pulse flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
      Running ML Multi-Hazard Assessment at coordinates...
    </div>
  ) : null;
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
    <div className="relative h-full w-full rounded-2xl overflow-hidden border border-slate-200/80 shadow-inner bg-slate-950">
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
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          key={activeBasemap}
          attribution={basemap.attribution}
          url={basemap.url}
          maxZoom={basemap.maxZoom}
        />

        <MapFocus zone={selectedZone} />
        <MapClickHandler onPointAnalyzed={onPointAnalyzed} onLocationSelect={onLocationSelect} />

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
                <span>{zone.lastAssessedAt ? new Date(zone.lastAssessedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live"}</span>
              </div>
            </div>
          );

          return (
            <div key={zone.zoneId || `${zone.lat}-${zone.lng}`}>
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
                  key={`poly-${zone.zoneId || zone.lat}`}
                  positions={coords}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.45 : zone.zoneColor === "RED" ? 0.35 : 0.22,
                    weight: isSelected ? 3.5 : 2,
                    dashArray: zone.zoneColor === "YELLOW" ? "6, 6" : undefined,
                  }}
                  eventHandlers={{ click: () => onLocationSelect(zone) }}
                >
                  <Popup>{popupContent}</Popup>
                </Polygon>
              ) : (
                <Circle
                  key={`circle-${zone.zoneId || zone.lat}`}
                  center={[zone.lat, zone.lng]}
                  radius={2500}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: 0.25,
                    weight: 2,
                    dashArray: "6, 6",
                  }}
                  eventHandlers={{ click: () => onLocationSelect(zone) }}
                >
                  <Popup>{popupContent}</Popup>
                </Circle>
              )}

              {/* Glowing Sphere Pin Marker (Preserved at each location) */}
              <Marker
                position={[zone.lat, zone.lng]}
                icon={createPinIcon(color)}
                eventHandlers={{ click: () => onLocationSelect(zone) }}
              >
                <Popup>{popupContent}</Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
