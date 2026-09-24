"use client";

import { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import { fetchRoadRoute } from "@/lib/routing";
import type { RelocationZonePlan } from "@/hooks/use-relocation-plan";

interface SiteInfo {
  id: string;
  siteCode?: string;
  name: string;
  district?: string;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy?: number;
  remainingCapacity?: number;
  totalAreaSqm?: number;
  usableAreaSqm?: number;
  waterSourceType?: string;
}

function MapBoundsRecenter({
  plans,
  sites,
  activeZoneId,
}: {
  plans: RelocationZonePlan[];
  sites: SiteInfo[];
  activeZoneId?: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (activeZoneId) {
      const activePlan = plans.find((p) => p.zoneId === activeZoneId);
      if (activePlan) {
        // Collect coordinates of this zone and its assigned sites
        const pts: [number, number][] = [[activePlan.lat, activePlan.lng]];
        activePlan.allocations.forEach((alloc) => {
          const site = sites.find((s) => s.id === alloc.siteId);
          if (site) pts.push([site.lat, site.lng]);
        });

        if (pts.length === 1) {
          map.flyTo(pts[0], 10, { duration: 1.2 });
        } else {
          map.flyToBounds(pts, { padding: [50, 50], duration: 1.2 });
        }
        return;
      }
    }

    // Default: Fit all points
    const allCoords: [number, number][] = [
      ...plans.map((p) => [p.lat, p.lng] as [number, number]),
      ...sites.map((s) => [s.lat, s.lng] as [number, number]),
    ];
    if (allCoords.length > 0) {
      map.flyToBounds(allCoords, { padding: [40, 40], duration: 1.0 });
    }
  }, [map, plans, sites, activeZoneId]);

  return null;
}

export function RelocationRouteMap({
  plans,
  activeZoneId,
  onSelectZone,
}: {
  plans: RelocationZonePlan[];
  activeZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
}) {
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});

  // Fetch sites from internal API (resilient database read)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/relocation/sites")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.sites) setSites(data.sites);
      })
      .catch((err) => console.warn("Failed to load relocation sites:", err));

    return () => {
      cancelled = true;
    };
  }, []);

  // Compute or load road routes
  useEffect(() => {
    if (sites.length === 0 || plans.length === 0) return;
    let cancelled = false;

    async function loadRoutes() {
      const entries: [string, [number, number][]][] = [];

      for (const plan of plans) {
        for (const alloc of plan.allocations) {
          const site = sites.find((s) => s.id === alloc.siteId);
          if (!site) continue;
          const key = `${plan.zoneId}-${site.id}`;

          // If pre-computed road coordinates exist on the allocation, use them immediately
          const precomputed = (alloc as any).roadRouteCoordinates;
          if (Array.isArray(precomputed) && precomputed.length > 1) {
            entries.push([key, precomputed]);
            continue;
          }

          // Otherwise fetch via OSRM
          try {
            const path = await fetchRoadRoute(
              { lat: plan.lat, lng: plan.lng },
              { lat: site.lat, lng: site.lng }
            );
            entries.push([key, path]);
          } catch {
            // Fallback straight-line segment if external router fails
            entries.push([key, [[plan.lat, plan.lng], [site.lat, site.lng]]]);
          }
        }
      }

      if (!cancelled) {
        setRoutes(Object.fromEntries(entries));
      }
    }

    loadRoutes();
    return () => {
      cancelled = true;
    };
  }, [plans, sites]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <MapContainer
        center={[20.5937, 78.9629]} // India overview center
        zoom={5}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsRecenter plans={plans} sites={sites} activeZoneId={activeZoneId} />

        {/* Road Polyline Corridors */}
        {Object.entries(routes).map(([key, path]) => {
          const [zoneId] = key.split("-SITE-").length > 1
            ? [key.split("-SITE-")[0]]
            : key.split(/-(?=site-)/);
          const isHighlighted = !activeZoneId || key.startsWith(activeZoneId);

          return (
            <Polyline
              key={key}
              positions={path}
              pathOptions={{
                color: isHighlighted ? "#2563eb" : "#94a3b8",
                weight: isHighlighted ? 4 : 2,
                opacity: isHighlighted ? 0.9 : 0.4,
                dashArray: isHighlighted ? undefined : "6, 6",
              }}
            >
              <Popup>
                <div className="text-xs">
                  <strong className="text-blue-700">Evacuation Road Corridor</strong>
                  <p className="text-slate-600">Active emergency transit route</p>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Red & Yellow At-Risk Habitats */}
        {plans.map((plan) => {
          const isSelected = plan.zoneId === activeZoneId;
          const isRed = plan.worstStatus === "RED";
          const colorHex = isRed ? "#dc2626" : "#eab308";

          return (
            <CircleMarker
              key={plan.zoneId}
              center={[plan.lat, plan.lng]}
              radius={isSelected ? 14 : 10}
              pathOptions={{
                color: colorHex,
                fillColor: colorHex,
                fillOpacity: 0.85,
                weight: isSelected ? 4 : 2,
              }}
              eventHandlers={{
                click: () => onSelectZone?.(plan.zoneId),
              }}
            >
              <Popup>
                <div className="p-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                    <span className="h-2 w-2 rounded-full bg-red-600" />
                    {plan.worstStatus} ZONE — {plan.hazardType}
                  </div>
                  <strong className="mt-0.5 block text-sm text-slate-900">{plan.zoneName}</strong>
                  <p className="mt-1 text-xs text-slate-600">
                    Evacuee Population: <span className="font-semibold text-slate-900">{plan.population.toLocaleString()}</span>
                  </p>
                  <p className="text-xs text-slate-600">
                    Allocated Sites: {plan.allocations.length} safe destinations
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Safe Relocation Destination Sites */}
        {sites.map((site) => {
          return (
            <CircleMarker
              key={site.id}
              center={[site.lat, site.lng]}
              radius={9}
              pathOptions={{
                color: "#16a34a",
                fillColor: "#22c55e",
                fillOpacity: 0.85,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    SAFE RELOCATION TOWNSHIP
                  </div>
                  <strong className="mt-0.5 block text-sm text-slate-900">{site.name}</strong>
                  <p className="mt-1 text-slate-600">
                    Sphere Capacity (45 m²/person):{" "}
                    <span className="font-semibold text-slate-900">{site.capacity.toLocaleString()}</span>
                  </p>
                  {site.remainingCapacity !== undefined && (
                    <p className="text-slate-600">
                      Remaining Headroom:{" "}
                      <span className="font-semibold text-emerald-700">
                        {site.remainingCapacity.toLocaleString()} available
                      </span>
                    </p>
                  )}
                  {site.usableAreaSqm && (
                    <p className="text-slate-500">
                      Usable Area: {site.usableAreaSqm.toLocaleString()} m²
                    </p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-[11px] font-medium text-slate-700 shadow-md backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
          Red Zone Habitation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          Safe Relocation Site
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-blue-600" />
          Evacuation Road Route
        </span>
      </div>
    </div>
  );
}