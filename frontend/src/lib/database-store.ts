/**
 * database-store.ts — Backwards Compatibility Facade
 * 
 * NOTE: All data fallback logic and authoritative mock states have been
 * consolidated into a SINGLE maintenance file:
 * @see "@/lib/central-fallback-store.ts"
 *
 * This file delegates all operations directly to `centralFallbackStore`.
 */

import {
  centralFallbackStore,
  FallbackZone as ZoneRecord,
  FallbackRelocationSite as RelocationSiteRecord,
  FallbackRelocationPlan as RelocationPlanRecord,
  FallbackHazardHistory as HazardHistoryRecord,
} from "./central-fallback-store";

export type { ZoneRecord, RelocationSiteRecord, RelocationPlanRecord, HazardHistoryRecord };

export interface RelocationAllocationRecord {
  siteId: string;
  siteName: string;
  district?: string;
  distanceKm: number;
  capacity: number;
  contribution: number;
  timeline?: string;
  roadRouteCoordinates?: [number, number][];
}

class DatabaseStoreFacade {
  public async getZones(): Promise<ZoneRecord[]> {
    return centralFallbackStore.getZones().zones;
  }

  public async getZone(zoneId: string): Promise<ZoneRecord | null> {
    return centralFallbackStore.getZone(zoneId).zone;
  }

  public async getRelocationSites(): Promise<RelocationSiteRecord[]> {
    return centralFallbackStore.getRelocationSites().sites;
  }

  public async getRelocationPlans(): Promise<RelocationPlanRecord[]> {
    return centralFallbackStore.getRelocationPlans().plans;
  }

  public async getHazardHistory(zoneId: string, limitDays?: number): Promise<HazardHistoryRecord[]> {
    return centralFallbackStore.getHazardHistory(zoneId, limitDays).history;
  }

  public async updateRelocationSite(
    siteId: string,
    updates: Partial<RelocationSiteRecord>
  ): Promise<RelocationSiteRecord | null> {
    return centralFallbackStore.updateRelocationSite(siteId, updates);
  }

  public async recordMLPrediction(payload: {
    zoneId: string;
    hazardScores: { FLOOD: number; LANDSLIDE: number; EROSION: number; CLOUDBURST: number };
    metrics?: any;
    source?: string;
  }): Promise<ZoneRecord | null> {
    return centralFallbackStore.recordMLPrediction(payload);
  }

  public async getVersion(): Promise<{ version: number; lastUpdated: string }> {
    return {
      version: Date.now(),
      lastUpdated: new Date().toISOString(),
    };
  }
}

export const dbStore = new DatabaseStoreFacade();
