"use client";

import {
  MapContainer,
  TileLayer,
  Polygon,
  CircleMarker,
  Popup,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

const redZoneCoordinates = [
  [30.565, 79.555],
  [30.57, 79.57],
  [30.558, 79.58],
  [30.548, 79.568],
];

const yellowZoneCoordinates = [
  [30.575, 79.545],
  [30.585, 79.565],
  [30.575, 79.585],
  [30.56, 79.59],
];

const greenZoneCoordinates = [
  [30.59, 79.54],
  [30.6, 79.57],
  [30.59, 79.6],
  [30.575, 79.595],
];

const locations = [
  {
    name: "Joshimath",
    position: [30.556, 79.564],
    risk: "High Risk",
    color: "red",
  },
  {
    name: "Auli",
    position: [30.529, 79.27],
    risk: "Moderate Risk",
    color: "yellow",
  },
];

export default function RedZoneMap({ selectedLocation, onLocationSelect }) {
  const center = selectedLocation?.coordinates || [30.556, 79.564];

  return (
    <div className="relative h-[600px] w-full">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Polygon
          positions={redZoneCoordinates}
          pathOptions={{
            color: "#ef4444",
            fillColor: "#ef4444",
            fillOpacity: 0.35,
            weight: 2,
          }}
        >
          <Popup>
            <strong>High Risk Zone</strong>
            <br />
            Immediate attention required.
          </Popup>
        </Polygon>

        <Polygon
          positions={yellowZoneCoordinates}
          pathOptions={{
            color: "#f59e0b",
            fillColor: "#f59e0b",
            fillOpacity: 0.25,
            weight: 2,
          }}
        >
          <Popup>
            <strong>Moderate Risk Zone</strong>
            <br />
            Monitoring recommended.
          </Popup>
        </Polygon>

        <Polygon
          positions={greenZoneCoordinates}
          pathOptions={{
            color: "#22c55e",
            fillColor: "#22c55e",
            fillOpacity: 0.2,
            weight: 2,
          }}
        >
          <Popup>
            <strong>Low Risk Zone</strong>
            <br />
            Current risk is relatively low.
          </Popup>
        </Polygon>

        {locations.map((location) => (
          <CircleMarker
            key={location.name}
            center={location.position}
            radius={9}
            pathOptions={{
              color: location.color === "red" ? "#ef4444" : "#f59e0b",
              fillColor: location.color === "red" ? "#ef4444" : "#f59e0b",
              fillOpacity: 1,
              weight: 3,
            }}
            eventHandlers={{
              click: () => {
                onLocationSelect({
                  name: location.name,
                  coordinates: location.position,
                  risk: location.risk,
                });
              },
            }}
          >
            <Popup>
              <strong>{location.name}</strong>
              <br />
              {location.risk}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}