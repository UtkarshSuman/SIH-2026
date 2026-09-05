/**
 * FEATURE: Relocation routes page - map + cards, both fully live from
 * the backend. Only zones currently RED/YELLOW appear at all.
 * INSTALLATION: none beyond use-relocation-plan.ts and relocation-route-map.tsx.
 */
"use client";

import dynamic from "next/dynamic";
import { useRelocationPlan } from "@/hooks/use-relocation-plan";

const RelocationRouteMap = dynamic(
  () => import("@/components/map/relocation-route-map").then((m) => m.RelocationRouteMap),
  { ssr: false }
);

export default function RelocationPage() {
  const { plans, isLoading } = useRelocationPlan();

  return (
    <main className="flex min-h-screen flex-col">
      <div className="border-b border-border p-4">
        <h1 className="text-lg font-semibold">Relocation Routes</h1>
        <p className="text-sm text-foreground/60">
          Live from the hazard model - only red/yellow zones are shown, with routes to their allocated
          relocation sites.
        </p>
      </div>

      <div className="h-[60vh]">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-foreground/60">Loading zones...</div>
        ) : (
          <RelocationRouteMap plans={plans} />
        )}
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {!isLoading && plans.length === 0 && (
          <p className="text-sm text-foreground/60">No red or yellow zones right now.</p>
        )}
        {plans.map((plan) => (
          <div key={plan.zoneId} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <p className={`font-semibold ${plan.worstStatus === "RED" ? "text-destructive" : "text-yellow-600"}`}>
                {plan.zoneName}
              </p>
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">{plan.worstStatus}</span>
            </div>
            <p className="mt-1 text-xs text-foreground/60">Population: {plan.population}</p>
            <ul className="mt-2 space-y-1 text-sm">
              {plan.allocations.map((a) => (
                <li key={a.siteId}>
                  {a.siteName} — {a.distanceKm} km ({a.contribution} people)
                </li>
              ))}
            </ul>
            {!plan.isFullyAccommodated && (
              <p className="mt-2 text-xs font-medium text-destructive">Shortfall: {plan.shortfall} people</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}