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

export interface SiteInfo {
  id: string;
  siteCode?: string;
  name: string;
  district?: string;
  state?: string;
  lat: number;
  lng: number;
  capacity: number;
  currentOccupancy?: number;
  remainingCapacity?: number;
  totalAreaSqm?: number;
  usableAreaSqm?: number;
  waterSourceType?: string | null;
  status?: string;
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

function isSiteFullyOccupied(site: SiteInfo): boolean {
  if (site.status === "FULL") return true;
  if (site.remainingCapacity !== undefined && site.remainingCapacity <= 0) return true;
  if (
    site.currentOccupancy !== undefined &&
    site.capacity !== undefined &&
    site.currentOccupancy >= site.capacity
  ) {
    return true;
  }
  return false;
}

export function RelocationRouteMap({
  plans,
  sites: propSites,
  activeZoneId,
  onSelectZone,
}: {
  plans: RelocationZonePlan[];
  sites?: SiteInfo[];
  activeZoneId?: string;
  onSelectZone?: (zoneId: string) => void;
}) {
  const [internalSites, setInternalSites] = useState<SiteInfo[]>([]);
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});

  // Use props if provided from parent (relocation page with real-time poll), otherwise fallback to internal fetch
  const sites = useMemo(() => {
    return propSites && propSites.length > 0 ? propSites : internalSites;
  }, [propSites, internalSites]);

  // Fetch sites from internal API (resilient database read) if prop not passed
  useEffect(() => {
    if (propSites && propSites.length > 0) return;
    let cancelled = false;
    fetch("/api/v1/relocation/sites")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.sites) setInternalSites(data.sites);
      })
      .catch((err) => console.warn("Failed to load relocation sites:", err));

    return () => {
      cancelled = true;
    };
  }, [propSites]);

  // Compute or load road routes — automatically hides routes to fully occupied sites!
  useEffect(() => {
    if (sites.length === 0 || plans.length === 0) return;
    let cancelled = false;

    async function loadRoutes() {
      const entries: [string, [number, number][]][] = [];

      for (const plan of plans) {
        for (const alloc of plan.allocations) {
          const site = sites.find((s) => s.id === alloc.siteId || (s.siteCode && s.siteCode === alloc.siteId));
          if (!site) continue;

          // When a relocation site is fully occupied, its evacuation path disappears from the frontend
          if (isSiteFullyOccupied(site)) {
            continue;
          }

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
          attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
        />

        <MapBoundsRecenter plans={plans} sites={sites} activeZoneId={activeZoneId} />

        {/* Road Polyline Corridors (Only to sites with remaining capacity) */}
        {Object.entries(routes).map(([key, path]) => {
          const targetSite = sites.find(
            (s) => key.endsWith(`-${s.id}`) || (s.siteCode && key.endsWith(`-${s.siteCode}`))
          );
          if (targetSite && isSiteFullyOccupied(targetSite)) {
            return null; // Route is closed/disappeared because destination is full
          }

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
          const isFull = isSiteFullyOccupied(site);
          const markerColor = isFull ? "#dc2626" : "#16a34a";
          const fillColor = isFull ? "#f87171" : "#22c55e";

          return (
            <CircleMarker
              key={site.id}
              center={[site.lat, site.lng]}
              radius={isFull ? 8 : 10}
              pathOptions={{
                color: markerColor,
                fillColor: fillColor,
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <div className={`flex items-center gap-1.5 font-bold ${isFull ? "text-red-700" : "text-emerald-700"}`}>
                    <span className={`h-2 w-2 rounded-full ${isFull ? "bg-red-600" : "bg-emerald-600"}`} />
                    {isFull ? "SITE FULLY OCCUPIED (0 CAPACITY LEFT)" : "SAFE RELOCATION TOWNSHIP"}
                  </div>
                  <strong className="mt-0.5 block text-sm text-slate-900">{site.name}</strong>
                  <p className="mt-1 text-slate-600">
                    Sphere Capacity: <span className="font-semibold text-slate-900">{site.capacity.toLocaleString()}</span>
                  </p>
                  <p className="text-slate-600">
                    Current Occupancy: <span className="font-semibold text-slate-900">{(site.currentOccupancy ?? 0).toLocaleString()}</span>
                  </p>
                  <p className="text-slate-600">
                    Remaining Headroom:{" "}
                    <span className={`font-semibold ${isFull ? "text-red-600 font-bold" : "text-emerald-700"}`}>
                      {site.remainingCapacity !== undefined
                        ? site.remainingCapacity.toLocaleString()
                        : Math.max(0, site.capacity - (site.currentOccupancy || 0)).toLocaleString()}{" "}
                      {isFull ? "beds (FULL)" : "beds available"}
                    </span>
                  </p>
                  {isFull && (
                    <div className="mt-1.5 rounded bg-red-50 p-1.5 text-[11px] font-semibold text-red-700 border border-red-200">
                      ⚠️ Evacuation corridor closed. New evacuees routed to alternate facilities.
                    </div>
                  )}
                  {site.usableAreaSqm && (
                    <p className="text-slate-500 mt-1">
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
          Red Zone
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          Available Safe Site
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          Fully Occupied Site
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-blue-600" />
          Active Evacuation Route (Hidden if site is full)
        </span>
      </div>
    </div>
  );
}