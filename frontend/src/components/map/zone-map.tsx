/**
 * FEATURE: The Leaflet map itself - renders each zone as a colored
 * circle (worst status across hazard types), clicking one shows a
 * popup with the per-hazard breakdown. Uses react-leaflet so the
 * MapContainer never remounts on refresh - only the circle layer's data
 * changes, keeping the user's zoom/pan position intact and never
 * "breaking" the map visually.
 * INSTALLATION: npm install leaflet react-leaflet
 *   npm install -D @types/leaflet
 * (already added to frontend/package.json above)
 *
 * IMPORTANT: Leaflet needs its CSS imported once, globally - see the
 * import added to globals.css below this component.
 */
"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";

const STATUS_COLORS: Record<string, string> = {
  GREEN: "#22c55e",
  YELLOW: "#eab308",
  RED: "#dc2626",
};

const WAYANAD_CENTER: [number, number] = [11.65, 76.1];

export function ZoneMap({ geojson }: { geojson: GeoJSON.FeatureCollection | null }) {
  return (
    <MapContainer center={WAYANAD_CENTER} zoom={11} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {geojson?.features.map((feature) => {
        const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates;
        const props = feature.properties as {
          zoneId: string;
          name: string;
          radiusMeters: number;
          worstStatus: string;
          hazards: Record<string, { status: string; riskScore: number; updatedAt: string }>;
        };

        return (
          <Circle
            key={props.zoneId}
            center={[lat, lng]}
            radius={props.radiusMeters}
            pathOptions={{
              color: STATUS_COLORS[props.worstStatus],
              fillColor: STATUS_COLORS[props.worstStatus],
              fillOpacity: 0.35,
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{props.name}</p>
                {Object.entries(props.hazards).map(([hazard, info]) => (
                  <p key={hazard}>
                    {hazard}: <span className="font-medium">{info.status}</span> (score{" "}
                    {info.riskScore.toFixed(2)})
                  </p>
                ))}
              </div>
            </Popup>
          </Circle>
        );
      })}
    </MapContainer>
  );
}