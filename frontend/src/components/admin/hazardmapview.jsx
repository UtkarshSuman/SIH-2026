"use client";

import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  GeoJSON,
  Circle,
  Polygon,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { getZoneBoundary, getZoneBoundaryFeature, hasRealBoundary } from "@/lib/zone-boundaries";
import "leaflet/dist/leaflet.css";

function MapFocus({ selectedLocation }) {
  const map = useMap();
  const lastIdRef = useRef(null);

  useEffect(() => {
    if (!selectedLocation) return;
    const lat = selectedLocation.latitude ?? selectedLocation.lat;
    const lng = selectedLocation.longitude ?? selectedLocation.lng;
    if (typeof lat !== "number" || typeof lng !== "number") return;

    const currentId = selectedLocation.id || selectedLocation.zoneId || `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (lastIdRef.current !== currentId) {
      lastIdRef.current = currentId;
      map.flyTo([lat, lng], 10, { duration: 1.0 });
    }
  }, [map, selectedLocation]);

  return null;
}

const riskColors = {
  High: "#ef4444",
  Moderate: "#f59e0b",
  Low: "#22c55e",
  RED: "#ef4444",
  YELLOW: "#f59e0b",
  GREEN: "#22c55e",
};

function createPinIcon(colorHex) {
  if (typeof window === "undefined" || !L.divIcon) return undefined;
  return L.divIcon({
    className: "custom-pin",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="
          width: 20px;
          height: 20px;
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
          opacity: 0.35;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

const indiaBounds = [
  [8.0, 68.0],
  [37.0, 98.0],
];

export default function Hazardmapview({
  locations = [],
  zones = [],
  selectedLocation,
  onLocationSelect,
}) {
  return (
    <div className="relative h-[680px] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <MapContainer
        bounds={indiaBounds}
        maxBounds={indiaBounds}
        maxBoundsViscosity={1.0}
        minZoom={4}
        maxZoom={12}
        zoomControl={false}
        className="h-full w-full"
      >
        {/* =========================
            BASE MAP
        ========================== */}
        <TileLayer
          attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
        />

        <ZoomControl position="topright" />
        <MapFocus selectedLocation={selectedLocation} />

        {/* =========================
            REAL RISK ZONES (OSM Administrative Boundaries)
        ========================== */}
        {zones.map((zone) => {
          const color =
            riskColors[zone.riskLevel] ||
            riskColors[zone.zoneColor] ||
            "#64748b";

          const boundaryFeature = getZoneBoundaryFeature(zone);
          const isReal = hasRealBoundary(zone);
          const coords = zone.coordinates || getZoneBoundary(zone);

          return (
            <div key={zone.id || zone.zoneId}>
              {boundaryFeature ? (
                <GeoJSON
                  key={`geojson-${zone.id || zone.zoneId}`}
                  data={boundaryFeature}
                  style={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.35,
                    weight: 2.5,
                  }}
                >
                  <Popup>
                    <div className="min-w-[210px] p-0.5">
                      <div className="flex items-center justify-between border-b pb-1">
                        <h3 className="font-bold text-slate-900">{zone.name}</h3>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          OSM Boundary
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {zone.district}, {zone.state}
                      </p>
                      <div className="mt-2 space-y-1 text-xs">
                        <p>
                          Hazard: <strong>{zone.hazardType || zone.worstHazard}</strong>
                        </p>
                        <p>
                          Risk: <strong style={{ color }}>{zone.riskLevel || zone.zoneColor}</strong>
                        </p>
                        <p>
                          People affected:{" "}
                          <strong>
                            {(zone.affectedPeople || zone.population || 0).toLocaleString()}
                          </strong>
                        </p>
                      </div>
                    </div>
                  </Popup>
                </GeoJSON>
              ) : isReal || (coords && coords.length >= 3) ? (
                <Polygon
                  key={`poly-${zone.id || zone.zoneId}`}
                  positions={coords}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.35,
                    weight: 2.5,
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px]">
                      <h3 className="font-bold text-slate-900">{zone.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {zone.district}, {zone.state}
                      </p>
                      <div className="mt-2 space-y-1 text-xs">
                        <p>
                          Hazard: <strong>{zone.hazardType || zone.worstHazard}</strong>
                        </p>
                        <p>
                          Risk: <strong style={{ color }}>{zone.riskLevel || zone.zoneColor}</strong>
                        </p>
                        <p>
                          People affected:{" "}
                          <strong>
                            {(zone.affectedPeople || zone.population || 0).toLocaleString()}
                          </strong>
                        </p>
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              ) : (
                /* Honest Fallback Circle for arbitrary locations without boundary */
                zone.lat && zone.lng && (
                  <Circle
                    key={`circle-${zone.id || zone.zoneId}`}
                    center={[zone.lat, zone.lng]}
                    radius={2500}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.25,
                      weight: 2,
                      dashArray: "6, 6",
                    }}
                  >
                    <Popup>
                      <div className="min-w-[190px]">
                        <h3 className="font-bold text-slate-900">{zone.name}</h3>
                        <p className="text-[10px] text-amber-700">Approximate assessment zone (~2.5km)</p>
                      </div>
                    </Popup>
                  </Circle>
                )
              )}

              {/* Glowing sphere marker at zone center if lat/lng available */}
              {zone.lat && zone.lng && (
                <Marker
                  position={[zone.lat, zone.lng]}
                  icon={createPinIcon(color)}
                >
                  <Popup>
                    <div className="min-w-[190px]">
                      <h3 className="font-bold text-slate-900">{zone.name}</h3>
                      <p className="text-xs text-slate-500">{zone.district}, {zone.state}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </div>
          );
        })}

        {/* =========================
            AFFECTED LOCATIONS (With Glowing Sphere Marker)
        ========================== */}
        {locations.map((location) => {
          if (
            typeof location.latitude !== "number" ||
            typeof location.longitude !== "number"
          ) {
            return null;
          }

          const color =
            riskColors[location.riskLevel] ||
            "#64748b";

          return (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={createPinIcon(color)}
              eventHandlers={{
                click: () => {
                  onLocationSelect?.(location);
                },
              }}
            >
              <Popup>
                <div className="min-w-[190px]">
                  <h3 className="font-bold text-slate-900">{location.name}</h3>
                  <p className="text-sm text-slate-500">
                    {location.district}, {location.state}
                  </p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p>
                      Hazard: <strong>{location.hazardType}</strong>
                    </p>
                    <p>
                      Risk: <strong style={{ color }}>{location.riskLevel}</strong>
                    </p>
                    <p>
                      People affected:{" "}
                      <strong>
                        {location.peopleAffected?.toLocaleString() || 0}
                      </strong>
                    </p>
                  </div>
                  <button
                    onClick={() => onLocationSelect?.(location)}
                    className="mt-3 w-full rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* =========================
          MAP LEGEND
      ========================== */}
      <div className="absolute bottom-5 left-5 z-[1000] rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <h4 className="mb-3 text-sm font-bold text-[#0b1838]">Risk Zones & Boundaries</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            High Risk (Red Zone)
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            Moderate Risk (Yellow Zone)
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            Low Risk (Green Zone)
          </div>
          <div className="pt-1.5 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-block w-3 h-0.5 bg-emerald-600" />
            <span>Real OSM Administrative Boundary</span>
          </div>
        </div>
      </div>

      {/* =========================
          LOCATION COUNT
      ========================== */}
      <div className="absolute right-5 top-5 z-[1000] rounded-lg border border-slate-200 bg-white/95 px-4 py-2 text-sm font-medium text-slate-700 shadow-md">
        {locations.length} affected locations
      </div>
    </div>
  );
}