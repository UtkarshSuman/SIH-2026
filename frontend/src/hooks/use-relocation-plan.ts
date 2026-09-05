/**
 * FEATURE: Fetches the current relocation plan from the backend - every
 * RED/YELLOW zone with its population and multi-site allocation. This
 * is what makes the pages dynamic: whenever the hazard pipeline updates
 * zone statuses (scheduled every 30 min, or via manual refresh on
 * /zones), the next time this hook runs it reflects the change
 * automatically - nothing hardcoded on the frontend anymore.
 */
import { useEffect, useState } from "react";
import { env } from "@/lib/env";

export interface RelocationAllocation {
  siteId: string;
  siteName: string;
  distanceKm: number;
  capacity: number;
  contribution: number;
}

export interface RelocationZonePlan {
  zoneId: string;
  zoneName: string;
  lat: number;
  lng: number;
  worstStatus: "RED" | "YELLOW";
  hazardType: string;
  population: number;
  allocations: RelocationAllocation[];
  totalCapacityUsed: number;
  isFullyAccommodated: boolean;
  shortfall: number;
}

export function useRelocationPlan() {
  const [plans, setPlans] = useState<RelocationZonePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${env.NEXT_PUBLIC_ML_SERVICE_URL}/api/v1/relocation/plan`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPlans(data.zones);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, isLoading };
}