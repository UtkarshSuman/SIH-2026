/**
 * FEATURE: The public zone map page - no login required. Loads existing
 * zone data on open, "Refresh" button triggers a fresh pipeline run.
 * ZoneMap is dynamically imported with ssr:false because Leaflet reads
 * `window`, which doesn't exist during server-side rendering.
 * INSTALLATION: none beyond zone-map.tsx and use-zone-refresh.ts.
 */
"use client";

import dynamic from "next/dynamic";
import { useZoneRefresh } from "@/hooks/use-zone-refresh";

const ZoneMap = dynamic(() => import("@/components/map/zone-map").then((m) => m.ZoneMap), {
  ssr: false,
  loading: () => <div>Loading map....</div>,
});

export default function ZonesPage() {
  const { geojson, refresh, isRefreshing, cooldownRemaining } = useZoneRefresh();

  return (
    <main className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h1 className="text-lg font-semibold">Hazard Zone Map - Wayanad</h1>
        <button
          onClick={refresh}
          disabled={isRefreshing || cooldownRemaining > 0}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          {isRefreshing
            ? "Refreshing..."
            : cooldownRemaining > 0
              ? `Refresh available in ${cooldownRemaining}s`
              : "Refresh"}
        </button>
      </div>
      <div className="flex-1">
        <ZoneMap geojson={geojson} />
      </div>
    </main>
  );
}