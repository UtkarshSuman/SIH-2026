"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polygon,
  Popup,
  ZoomControl,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const riskColors = {
  High: "#ef4444",
  Moderate: "#f59e0b",
  Low: "#22c55e",
};

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
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ZoomControl position="topright" />

        {/* =========================
            RISK ZONES
        ========================== */}

        {zones.map((zone) => {
          const color =
            riskColors[zone.riskLevel] ||
            "#64748b";

          return (
            <Polygon
              key={zone.id}
              positions={zone.coordinates}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.35,
                weight: 2,
              }}
            >

              <Popup>

                <div className="min-w-[190px]">

                  <h3 className="font-bold text-slate-900">
                    {zone.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {zone.district}, {zone.state}
                  </p>

                  <div className="mt-3 space-y-1 text-sm">

                    <p>
                      Hazard:{" "}
                      <strong>
                        {zone.hazardType}
                      </strong>
                    </p>

                    <p>
                      Risk:{" "}
                      <strong
                        style={{
                          color: color,
                        }}
                      >
                        {zone.riskLevel}
                      </strong>
                    </p>

                    <p>
                      People affected:{" "}
                      <strong>
                        {zone.affectedPeople?.toLocaleString() || 0}
                      </strong>
                    </p>

                  </div>

                </div>

              </Popup>

            </Polygon>
          );
        })}

        {/* =========================
            AFFECTED LOCATIONS
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

          const isSelected =
            selectedLocation?.id === location.id;

          return (
            <CircleMarker
              key={location.id}
              center={[
                location.latitude,
                location.longitude,
              ]}
              radius={
                isSelected ? 11 : 8
              }
              pathOptions={{
                color: "#ffffff",
                weight: 3,
                fillColor: color,
                fillOpacity: 1,
              }}
              eventHandlers={{
                click: () => {
                  onLocationSelect?.(
                    location
                  );
                },
              }}
            >

              <Popup>

                <div className="min-w-[190px]">

                  <h3 className="font-bold text-slate-900">
                    {location.name}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {location.district},{" "}
                    {location.state}
                  </p>

                  <div className="mt-3 space-y-1 text-sm">

                    <p>
                      Hazard:{" "}
                      <strong>
                        {location.hazardType}
                      </strong>
                    </p>

                    <p>
                      Risk:{" "}
                      <strong
                        style={{
                          color: color,
                        }}
                      >
                        {location.riskLevel}
                      </strong>
                    </p>

                    <p>
                      People affected:{" "}
                      <strong>
                        {location.peopleAffected?.toLocaleString() || 0}
                      </strong>
                    </p>

                  </div>

                  <button
                    onClick={() =>
                      onLocationSelect?.(
                        location
                      )
                    }
                    className="mt-3 w-full rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800"
                  >
                    View Details
                  </button>

                </div>

              </Popup>

            </CircleMarker>
          );
        })}

      </MapContainer>

      {/* =========================
          MAP LEGEND
      ========================== */}

      <div className="absolute bottom-5 left-5 z-[1000] rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">

        <h4 className="mb-3 text-sm font-bold text-[#0b1838]">
          Risk Zones
        </h4>

        <div className="space-y-2">

          <div className="flex items-center gap-2 text-xs text-slate-600">

            <span className="h-3 w-3 rounded-full bg-red-500" />

            High Risk

          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">

            <span className="h-3 w-3 rounded-full bg-yellow-500" />

            Moderate Risk

          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">

            <span className="h-3 w-3 rounded-full bg-green-500" />

            Low Risk

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