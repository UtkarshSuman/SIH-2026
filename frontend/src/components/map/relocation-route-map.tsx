/**
 * FEATURE: Map showing ONLY red/yellow zones (via `plans` prop), all
 * candidate relocation sites, and real road routes from each at-risk
 * zone to EVERY site it was allocated (not just the nearest one - a
 * zone needing multiple sites shows a route to each).
 * INSTALLATION: none beyond what's already installed.
 */
"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from "react-leaflet";
import { fetchRoadRoute } from "@/lib/routing";
import type { RelocationZonePlan } from "@/hooks/use-relocation-plan";
import { env } from "@/lib/env";

const WAYANAD_CENTER: [number, number] = [11.6, 76.1];
const STATUS_COLORS: Record<string, string> = { RED: "#dc2626", YELLOW: "#eab308" };

interface SiteInfo {
  id: string;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
}

export function RelocationRouteMap({ plans }: { plans: RelocationZonePlan[] }) {
  const [sites, setSites] = useState<SiteInfo[]>([]);
  const [routes, setRoutes] = useState<Record<string, [number, number][]>>({});

  useEffect(() => {
    fetch(`${env.NEXT_PUBLIC_ML_SERVICE_URL}/api/v1/relocation/sites`)
      .then((res) => res.json())
      .then((data) => setSites(data.sites));
  }, []);

  useEffect(() => {
    if (sites.length === 0 || plans.length === 0) return;
    let cancelled = false;

    async function loadRoutes() {
      const entries: [string, [number, number][]][] = [];
      for (const plan of plans) {
        for (const alloc of plan.allocations) {
          const site = sites.find((s) => s.id === alloc.siteId);
          if (!site) continue;
          try {
            const path = await fetchRoadRoute({ lat: plan.lat, lng: plan.lng }, { lat: site.lat, lng: site.lng });
            entries.push([`${plan.zoneId}-${site.id}`, path]);
          } catch {
            // skip this one route on failure, don't break the map
          }
        }
      }
      if (!cancelled) setRoutes(Object.fromEntries(entries));
    }
    loadRoutes();
    return () => {
      cancelled = true;
    };
  }, [plans, sites]);

  return (
    <MapContainer center={WAYANAD_CENTER} zoom={11} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />

      {plans.map((plan) => (
        <CircleMarker
          key={plan.zoneId}
          center={[plan.lat, plan.lng]}
          radius={10}
          pathOptions={{ color: STATUS_COLORS[plan.worstStatus], fillColor: STATUS_COLORS[plan.worstStatus], fillOpacity: 0.7 }}
        >
          <Popup>
            {plan.zoneName} ({plan.worstStatus}) — population {plan.population}
          </Popup>
        </CircleMarker>
      ))}

      {sites.map((site) => (
        <CircleMarker
          key={site.id}
          center={[site.lat, site.lng]}
          radius={8}
          pathOptions={{ color: "#16a34a", fillColor: "#16a34a", fillOpacity: 0.6 }}
        >
          <Popup>
            {site.name} — capacity {site.capacity}
          </Popup>
        </CircleMarker>
      ))}

      {Object.entries(routes).map(([key, path]) => (
        <Polyline key={key} positions={path} pathOptions={{ color: "#2563eb", weight: 3 }} />
      ))}
    </MapContainer>
  );
}