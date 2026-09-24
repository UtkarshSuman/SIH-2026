/**
 * FEATURE: Fetches the current relocation plan from the backend - every
 * RED/YELLOW zone with its population and multi-site allocation.
 */
import { useEffect, useState } from "react";
import { env } from "@/lib/env";

export interface RelocationAllocation {
  siteId: string;
  siteName: string;
  district?: string;
  distanceKm: number;
  capacity: number;
  contribution: number;
  timeline?: string;
  roadRouteCoordinates?: [number, number][];
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
  timeline?: string;
  priorityScore?: number;
}

export function useRelocationPlan() {
  const [plans, setPlans] = useState<RelocationZonePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Query internal resilient API route
    fetch("/api/v1/relocation/plan")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.zones) setPlans(data.zones);
      })
      .catch((err) => console.warn("Failed fetching relocation plan:", err))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { plans, isLoading };
}