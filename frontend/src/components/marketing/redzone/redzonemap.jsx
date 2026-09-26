"use client";

import { useEffect } from "react";
import { Circle, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const colors = { RED: "#dc2626", YELLOW: "#d97706", GREEN: "#16a34a" };

function MapFocus({ zone }) {
  const map = useMap();
  useEffect(() => {
    if (zone) map.flyTo([zone.lat, zone.lng], 11, { duration: 0.8 });
  }, [map, zone]);
  return null;
}

function radiusFor(zone) {
  if (zone.minLat != null && zone.maxLat != null && zone.minLon != null && zone.maxLon != null) {
    const latSpan = Math.abs(zone.maxLat - zone.minLat) * 111000;
    const lngSpan = Math.abs(zone.maxLon - zone.minLon) * 111000 * Math.cos((zone.lat * Math.PI) / 180);
    return Math.max(800, Math.min(12000, Math.max(latSpan, lngSpan) / 2));
  }
  return 2500;
}

export default function RedZoneMap({ zones, selectedZone, onLocationSelect }) {
  const center = selectedZone ? [selectedZone.lat, selectedZone.lng] : zones[0] ? [zones[0].lat, zones[0].lng] : [20.5937, 78.9629];

  return (
    <div className="relative h-[600px] w-full">
      <MapContainer center={center} zoom={selectedZone ? 11 : 5} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapFocus zone={selectedZone} />
        {zones.map((zone) => {
          const color = colors[zone.zoneColor] || colors.GREEN;
          return (
            <Circle
              key={zone.zoneId}
              center={[zone.lat, zone.lng]}
              radius={radiusFor(zone)}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.3, weight: zone.zoneId === selectedZone?.zoneId ? 4 : 2 }}
              eventHandlers={{ click: () => onLocationSelect(zone) }}
            >
              <Popup>
                <div className="min-w-52 text-sm">
                  <p className="font-semibold text-slate-900">{zone.name}</p>
                  <p className="mt-1 font-medium" style={{ color }}>{zone.zoneColor} ZONE</p>
                  <p className="mt-1 text-slate-600">{zone.worstHazard || "MULTI-HAZARD"}: {(zone.worstScore * 100).toFixed(0)}% risk</p>
                  <p className="text-slate-600">Population: {zone.population.toLocaleString()}</p>
                  <p className="text-slate-500">Assessed: {zone.lastAssessedAt ? new Date(zone.lastAssessedAt).toLocaleString() : "Pending"}</p>
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}
