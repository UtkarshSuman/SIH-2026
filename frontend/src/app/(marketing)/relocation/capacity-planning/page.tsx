/**
 * FEATURE: Population-vs-capacity breakdown, live from the backend.
 * Server component - fetches at request time, always fresh.
 */
import { env } from "@/lib/env";
import type { RelocationZonePlan } from "@/hooks/use-relocation-plan";

async function getPlan(): Promise<RelocationZonePlan[]> {
  const res = await fetch(`${env.NEXT_PUBLIC_ML_SERVICE_URL}/api/v1/relocation/plan`, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()).zones;
}

export default async function CapacityPlanningPage() {
  const plans = await getPlan();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-lg font-semibold">Relocation Capacity Planning</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Live from the hazard model - for each current red/yellow zone, the nearest relocation sites are
        combined until the at-risk population is fully accommodated.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {plans.length === 0 && <p className="text-sm text-foreground/60">No red or yellow zones right now.</p>}
        {plans.map((plan) => (
          <div key={plan.zoneId} className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <p className={`font-semibold ${plan.worstStatus === "RED" ? "text-destructive" : "text-yellow-600"}`}>
                {plan.zoneName}
              </p>
              <p className="text-sm text-foreground/60">Population: {plan.population}</p>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {plan.allocations.map((a) => (
                <li key={a.siteId}>
                  {a.siteName} — {a.contribution} people ({a.distanceKm} km away)
                </li>
              ))}
            </ul>
            <p
              className={`mt-3 text-xs font-medium ${plan.isFullyAccommodated ? "text-green-600" : "text-destructive"}`}
            >
              {plan.isFullyAccommodated
                ? `Fully accommodated (${plan.totalCapacityUsed}/${plan.population})`
                : `Shortfall: ${plan.shortfall} people still need placement`}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}