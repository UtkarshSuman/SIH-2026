/**
 * data-service.ts
 *
 * Unified Data Service — ALL queries use Supabase REST API (HTTPS/443).
 * PRIMARY:  Supabase REST (zones, classifications, relocation, analytics, alerts)
 * FALLBACK: central-fallback-store.ts (when Supabase is offline)
 * ML WRITE-BACK: new predictions are inserted into zone_classifications
 */
import { getZoneBoundary } from "@/lib/zone-boundaries";
import {
  fetchAllZonesFromSupabase,
  fetchZoneByIdFromSupabase,
  fetchZoneHistoryFromSupabase,
  fetchAllRelocationSites,
  fetchAllRelocationPlans,
  fetchAllZoneAnalytics,
  fetchZoneAnalytics,
  fetchRecentAlertLog,
  recordMLPredictionToSupabase,
  updateRelocationSiteInDB,
  updateZoneClassification,
  supabaseZoneToFrontend,
  supabaseSiteToFrontend,
  supabasePlanToFrontend,
  type SupabaseZoneAnalytics,
} from "@/lib/supabase-client";
import {
  centralFallbackStore,
  FALLBACK_WARNING_MESSAGE,
  FallbackZone,
  FallbackRelocationSite,
  FallbackRelocationPlan,
  FallbackHazardHistory,
} from "@/lib/central-fallback-store";

export interface ZoneData extends FallbackZone {
  boundaryCoordinates?: [number, number][];
  isLiveAnalyzed?: boolean;
}

export type RelocationSiteData = FallbackRelocationSite;
export type RelocationZonePlanData = FallbackRelocationPlan;
export type HazardHistoryData = FallbackHazardHistory;

export interface QueryResultWithFallback<T> {
  data: T;
  isFallback: boolean;
  warning?: string;
  source: "DATABASE" | "CENTRAL_FALLBACK_STORE";
}

const asNumberRecord = (value: unknown): Record<string, number> =>
  value && typeof value === "object"
    ? (Object.fromEntries(
        Object.entries(value as Record<string, unknown>).filter(
          (entry): entry is [string, number] => typeof entry[1] === "number"
        )
      ) as Record<string, number>)
    : {};

function toZoneData(zone: any): ZoneData | null {
  if (!zone) return null;
  return {
    zoneId: zone.zoneId,
    name: zone.name,
    state: zone.state,
    district: zone.district,
    lat: zone.lat,
    lng: zone.lng,
    minLon: zone.minLon,
    minLat: zone.minLat,
    maxLon: zone.maxLon,
    maxLat: zone.maxLat,
    population: zone.population,
    elevationM: zone.elevationM,
    slopeClass: zone.slopeClass,
    zoneColor: zone.zoneColor,
    worstHazard: zone.worstHazard,
    worstScore: zone.worstScore,
    priority: zone.priority,
    priorityScore: zone.priorityScore,
    hazardScores: {
      FLOOD: zone.floodScore,
      LANDSLIDE: zone.landslideScore,
      EROSION: zone.erosionScore,
      CLOUDBURST: zone.cloudburstScore,
    },
    metrics: {
      rainfall_24h_mm: 50,
      rainfall_72h_mm: 80,
      river_discharge_m3s: 20,
      soil_saturation_pct: 60,
      slope_deg: 20,
    },
    lastAssessedAt:
      zone.lastAssessedAt instanceof Date
        ? zone.lastAssessedAt.toISOString()
        : zone.lastAssessedAt ?? new Date().toISOString(),
    isStale: zone.isStale ?? false,
    baselineFloodScore: zone.baselineFloodScore ?? 0.18,
    baselineLandslideScore: zone.baselineLandslideScore ?? 0.22,
    baselineErosionScore: zone.baselineErosionScore ?? 0.08,
    baselineCloudburstScore: zone.baselineCloudburstScore ?? 0.12,
    criticalThreshold: zone.criticalThreshold ?? 0.70,
    warningThreshold: zone.warningThreshold ?? 0.40,
    modelName: zone.modelName ?? "Multi-Hazard Ensemble RF-v4.2",
    modelVersion: zone.modelVersion ?? "v4.2.1-prod",
    confidenceScore: zone.confidenceScore ?? 0.91,
    sensorNodeCount: zone.sensorNodeCount ?? 16,
    riskVelocity: zone.riskVelocity ?? 0.0,
    evacuationReadinessPct: zone.evacuationReadinessPct ?? 85.0,
  };
}

/**
 * 1. ZONES QUERY — Uses Supabase REST API (HTTPS) as primary source
 *    Falls back to central store only if REST API is also unreachable.
 */
export async function getRecentZonesWithStatus(): Promise<QueryResultWithFallback<ZoneData[]>> {
  // PRIMARY: Supabase REST API (port 443, always reachable)
  try {
    const supabaseZones = await fetchAllZonesFromSupabase();
    if (supabaseZones && supabaseZones.length > 0) {
      const baseZones = supabaseZones.map((z) => supabaseZoneToFrontend(z));
      // Sort by priority score descending (RED zones first)
      baseZones.sort((a, b) => b.priorityScore - a.priorityScore);
      // Enrich with boundaries
      const zonesWithBoundaries = baseZones.map((zone) => ({
        ...zone,
        boundaryCoordinates: getZoneBoundary(zone),
      }));
      return {
        data: zonesWithBoundaries as ZoneData[],
        isFallback: false,
        source: "DATABASE",
      };
    }
  } catch (err) {
    console.warn("[DataService] Supabase REST zones query failed, falling back to central store:", err);
  }

  // FALLBACK: Central Fallback Store
  const fallback = centralFallbackStore.getZones();
  const zonesWithBoundaries = fallback.zones.map((z) => ({
    ...z,
    boundaryCoordinates: getZoneBoundary(z),
  }));

  return {
    data: zonesWithBoundaries,
    isFallback: true,
    warning: FALLBACK_WARNING_MESSAGE,
    source: "CENTRAL_FALLBACK_STORE",
  };
}

export async function getRecentZones(): Promise<ZoneData[]> {
  const result = await getRecentZonesWithStatus();
  return result.data;
}

/**
 * 2. SINGLE ZONE QUERY — Supabase REST API primary
 */
export async function getZoneByIdWithStatus(zoneId: string): Promise<QueryResultWithFallback<ZoneData | null>> {
  try {
    const supabaseZone = await fetchZoneByIdFromSupabase(zoneId);
    if (supabaseZone) {
      const baseZone = supabaseZoneToFrontend(supabaseZone);
      return {
        data: { ...baseZone, boundaryCoordinates: getZoneBoundary(baseZone) } as ZoneData,
        isFallback: false,
        source: "DATABASE",
      };
    }
  } catch (err) {
    console.warn("[DataService] Supabase REST zoneById failed:", err);
  }

  const fallback = centralFallbackStore.getZone(zoneId);
  const z = fallback.zone ? { ...fallback.zone, boundaryCoordinates: getZoneBoundary(fallback.zone) } : null;
  return {
    data: z,
    isFallback: true,
    warning: FALLBACK_WARNING_MESSAGE,
    source: "CENTRAL_FALLBACK_STORE",
  };
}

export async function getZoneById(zoneId: string): Promise<ZoneData | null> {
  const result = await getZoneByIdWithStatus(zoneId);
  return result.data;
}

/**
 * 3. RELOCATION SITES QUERY — Supabase REST primary
 */
export async function getRecentRelocationSitesWithStatus(): Promise<QueryResultWithFallback<RelocationSiteData[]>> {
  try {
    const sites = await fetchAllRelocationSites();
    if (sites && sites.length > 0) {
      const formatted = sites.map((s) => supabaseSiteToFrontend(s));
      return { data: formatted, isFallback: false, source: "DATABASE" };
    }
  } catch (err) {
    console.warn("[DataService] Supabase REST relocation sites failed:", err);
  }

  const fallback = centralFallbackStore.getRelocationSites();
  return {
    data: fallback.sites,
    isFallback: true,
    warning: FALLBACK_WARNING_MESSAGE,
    source: "CENTRAL_FALLBACK_STORE",
  };
}

export async function getRecentRelocationSites(): Promise<RelocationSiteData[]> {
  const result = await getRecentRelocationSitesWithStatus();
  return result.data;
}

/**
 * 4. RELOCATION PLANS QUERY — Supabase REST primary
 */
export async function getRecentRelocationPlanWithStatus(): Promise<QueryResultWithFallback<RelocationZonePlanData[]>> {
  try {
    const plans = await fetchAllRelocationPlans();
    if (plans && plans.length > 0) {
      // Enrich with latest classification for zone color
      const allZones = await fetchAllZonesFromSupabase().catch(() => []);
      const clsByZone = new Map(
        allZones.map((z) => [z.zone_id, z.classification])
      );
      const formatted = plans.map((plan) => {
        const cls = clsByZone.get(plan.zone_id);
        const base = supabasePlanToFrontend(plan);
        return {
          ...base,
          worstStatus: (cls?.zone_color === "RED" ? "RED" : "YELLOW") as "RED" | "YELLOW",
          hazardType: cls?.worst_hazard ?? "FLOOD",
          priorityScore: cls?.priority_score ?? 0,
        };
      });
      return { data: formatted, isFallback: false, source: "DATABASE" };
    }
  } catch (err) {
    console.warn("[DataService] Supabase REST relocation plans failed:", err);
  }

  const fallback = centralFallbackStore.getRelocationPlans();
  return {
    data: fallback.plans,
    isFallback: true,
    warning: FALLBACK_WARNING_MESSAGE,
    source: "CENTRAL_FALLBACK_STORE",
  };
}

export async function getRecentRelocationPlan(): Promise<RelocationZonePlanData[]> {
  const result = await getRecentRelocationPlanWithStatus();
  return result.data;
}

/**
 * 5. HAZARD HISTORY QUERY — Uses zone_classifications history from Supabase REST
 */
export async function getHistoricalHazardTrendsWithStatus(
  zoneId: string,
  limitDays?: number
): Promise<QueryResultWithFallback<HazardHistoryData[]>> {
  try {
    const classifications = await fetchZoneHistoryFromSupabase(zoneId, limitDays);
    if (classifications && classifications.length > 0) {
      const formatted = classifications.map((row) => {
        const scores = typeof row.hazard_scores === "string"
          ? JSON.parse(row.hazard_scores)
          : row.hazard_scores ?? {};
        const worstScore = Math.max(...Object.values(scores).map(Number), 0);
        const classifiedAt = new Date(row.classified_at);
        return {
          id: row.id,
          zoneId: row.zone_id,
          recordedAt: row.classified_at,
          period: classifiedAt.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
          }),
          floodScore: (scores.FLOOD ?? 0) as number,
          landslideScore: (scores.LANDSLIDE ?? 0) as number,
          erosionScore: (scores.EROSION ?? 0) as number,
          cloudburstScore: (scores.CLOUDBURST ?? 0) as number,
          worstScore,
          zoneColor: row.zone_color,
          rainfallMm: null,
          riverLevelM: null,
          soilSaturationPct: null,
          temperatureC: null,
          dischargeCumecs: null,
          humidityPct: null,
          windSpeedKmh: null,
          confidence: null,
        } as HazardHistoryData;
      });
      return {
        data: formatted,
        isFallback: false,
        source: "DATABASE",
      };
    }
  } catch (err) {
    console.warn("[DataService] Supabase REST history query failed:", err);
  }

  const fallback = centralFallbackStore.getHazardHistory(zoneId, limitDays);
  return {
    data: fallback.history,
    isFallback: true,
    warning: FALLBACK_WARNING_MESSAGE,
    source: "CENTRAL_FALLBACK_STORE",
  };
}

export async function getHistoricalHazardTrends(
  zoneId: string,
  limitDays?: number
): Promise<HazardHistoryData[]> {
  const result = await getHistoricalHazardTrendsWithStatus(zoneId, limitDays);
  return result.data;
}

/**
 * 6. VERSION QUERY — Uses latest classification timestamp from Supabase
 */
export async function getDatabaseVersion(): Promise<{
  version: number;
  lastUpdated: string;
  isFallback: boolean;
}> {
  try {
    const classifications = await fetchZoneHistoryFromSupabase("", 1).catch(() => null);
    // Fetch the latest classification across all zones
    const res = await fetch(
      "https://jxitjpimiompwifxguch.supabase.co/rest/v1/zone_classifications?order=classified_at.desc&limit=1",
      {
        headers: {
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXRqcGltaW9tcHdpZnhndWNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1MTYzNCwiZXhwIjoyMTA1ODI3NjM0fQ.QT7Lrxy1VHySl8hLiU33ORGBwCfEuhJmDNh4Y_5I9Ao",
          Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXRqcGltaW9tcHdpZnhndWNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1MTYzNCwiZXhwIjoyMTA1ODI3NjM0fQ.QT7Lrxy1VHySl8hLiU33ORGBwCfEuhJmDNh4Y_5I9Ao",
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.[0]?.classified_at) {
        const ts = new Date(data[0].classified_at);
        return { version: ts.getTime(), lastUpdated: ts.toISOString(), isFallback: false };
      }
    }
  } catch {}

  const fallbackInfo = centralFallbackStore.getVersionInfo();
  return {
    version: fallbackInfo.version,
    lastUpdated: fallbackInfo.lastUpdated,
    isFallback: true,
  };
}

/**
 * 7. UPDATE RELOCATION CAPACITY — writes to Supabase REST
 */
export async function updateRelocationSiteCapacity(
  siteId: string,
  updates: Partial<RelocationSiteData>
) {
  // Always update fallback store so offline changes persist
  centralFallbackStore.updateRelocationSite(siteId, updates);

  try {
    const usableAreaSqm = updates.usableAreaSqm;
    const capacity = updates.capacity;
    const currentOccupancy = updates.currentOccupancy;
    const remainingCapacity =
      capacity != null && currentOccupancy != null
        ? Math.max(0, capacity - currentOccupancy)
        : undefined;
    const status =
      updates.status ?? (remainingCapacity != null && remainingCapacity <= 0 ? "FULL" : undefined);

    const dbPatch: Record<string, unknown> = {};
    if (usableAreaSqm != null) dbPatch.usable_area_sqm = usableAreaSqm;
    if (capacity != null) dbPatch.sphere_capacity = capacity;
    if (currentOccupancy != null) dbPatch.current_occupancy = currentOccupancy;
    if (remainingCapacity != null) dbPatch.remaining_capacity = remainingCapacity;
    if (status) dbPatch.status = status;
    if (updates.waterSourceType != null) dbPatch.water_source_type = updates.waterSourceType;
    if (updates.roadConnectivityRating != null) dbPatch.road_connectivity_rating = updates.roadConnectivityRating;
    dbPatch.updated_at = new Date().toISOString();

    const updated = await updateRelocationSiteInDB(siteId, dbPatch as any);
    if (updated) {
      return {
        ...supabaseSiteToFrontend(updated),
      };
    }
  } catch (err) {
    console.warn("[DataService] Supabase REST relocation site update failed:", err);
  }

  const fb = centralFallbackStore.getRelocationSites().sites.find((s) => s.id === siteId || s.siteCode === siteId);
  return fb!;
}

/**
 * 8. RECORD ML PREDICTION — writes to Supabase zone_classifications
 *    Called by the Python ML pipeline bridge via /api/ml/predict
 */
export async function recordMLPrediction(payload: {
  zoneId: string;
  hazardScores: Record<"FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST", number>;
  metrics?: unknown;
  source: string;
}) {
  // Always update fallback store so offline reads reflect latest prediction
  centralFallbackStore.recordMLPrediction({
    zoneId: payload.zoneId,
    hazardScores: payload.hazardScores,
    metrics: payload.metrics,
  });

  // PRIMARY: Write to Supabase REST (insert new classification row)
  const result = await recordMLPredictionToSupabase({
    zoneId: payload.zoneId,
    hazardScores: payload.hazardScores,
    source: payload.source,
  });

  if (result) {
    console.log(`[DataService] ML prediction written to Supabase for ${payload.zoneId}`);
    // Return zone from Supabase
    const zone = await fetchZoneByIdFromSupabase(payload.zoneId).catch(() => null);
    if (zone) return supabaseZoneToFrontend(zone);
  }
  return null;
}

/**
 * 9. UPDATE ZONE ADMIN STATUS — writes new classification to Supabase
 */
export async function updateZoneAdminStatus(
  zoneId: string,
  updates: {
    name?: string;
    population?: number;
    isRedZone?: boolean;
    zoneColor?: "RED" | "YELLOW" | "GREEN";
    worstHazard?: "FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST";
    worstScore?: number;
    priority?: "IMMEDIATE" | "SHORT_TERM" | "MEDIUM_TERM" | "NONE";
  }
) {
  centralFallbackStore.updateZone(zoneId, updates);

  try {
    // Determine values from updates or fetch current
    const currentZone = await fetchZoneByIdFromSupabase(zoneId);
    const cls = currentZone?.classification;

    const zoneColor = updates.zoneColor ?? (cls?.zone_color ?? "GREEN");
    const worstHazard = updates.worstHazard ?? (cls?.worst_hazard ?? "FLOOD");
    const worstScore = updates.worstScore ?? (cls?.priority_score ?? 0);
    const priority = updates.priority ?? (cls?.priority ?? "NONE");
    const priorityScore = zoneColor === "GREEN" ? 0 : worstScore;

    // Zone metadata patch (name, population)
    const zonePatches: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name) zonePatches.name = updates.name;
    if (updates.population != null) zonePatches.population = updates.population;
    if (updates.isRedZone != null) zonePatches.is_red_zone = updates.isRedZone;
    if (Object.keys(zonePatches).length > 1) {
      // PATCH zones table
      await fetch(
        `https://jxitjpimiompwifxguch.supabase.co/rest/v1/zones?zone_id=eq.${zoneId}`,
        {
          method: "PATCH",
          headers: {
            apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXRqcGltaW9tcHdpZnhndWNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1MTYzNCwiZXhwIjoyMTA1ODI3NjM0fQ.QT7Lrxy1VHySl8hLiU33ORGBwCfEuhJmDNh4Y_5I9Ao",
            Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXRqcGltaW9tcHdpZnhndWNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1MTYzNCwiZXhwIjoyMTA1ODI3NjM0fQ.QT7Lrxy1VHySl8hLiU33ORGBwCfEuhJmDNh4Y_5I9Ao",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(zonePatches),
        }
      );
    }

    // Insert new classification record (immutable audit trail)
    const newCls = await updateZoneClassification(zoneId, {
      zone_color: zoneColor as "RED" | "YELLOW" | "GREEN",
      worst_hazard: worstHazard,
      hazard_scores: {
        FLOOD: worstHazard === "FLOOD" ? worstScore : cls ? JSON.parse(typeof cls.hazard_scores === "string" ? cls.hazard_scores : JSON.stringify(cls.hazard_scores)).FLOOD ?? 0 : 0,
        LANDSLIDE: worstHazard === "LANDSLIDE" ? worstScore : 0,
        EROSION: worstHazard === "EROSION" ? worstScore : 0,
        CLOUDBURST: worstHazard === "CLOUDBURST" ? worstScore : 0,
      },
      priority: priority as string,
      priority_score: priorityScore,
    });

    // Return fresh zone from Supabase
    const updatedZone = await fetchZoneByIdFromSupabase(zoneId);
    if (updatedZone) {
      const zoneData = supabaseZoneToFrontend(updatedZone);
      return { ...zoneData, boundaryCoordinates: getZoneBoundary(zoneData) };
    }
  } catch (err) {
    console.warn("[DataService] Supabase zone admin update failed:", err);
  }

  const fbZone = centralFallbackStore.getZone(zoneId).zone;
  if (!fbZone) return null;
  return { ...fbZone, boundaryCoordinates: getZoneBoundary(fbZone) };
}

/**
 * 10. GET ZONE ANALYTICS — Supabase REST primary
 */
export async function getZoneAnalyticsData(zoneId?: string): Promise<SupabaseZoneAnalytics[]> {
  try {
    if (zoneId) {
      const single = await fetchZoneAnalytics(zoneId);
      return single ? [single] : [];
    }
    return await fetchAllZoneAnalytics();
  } catch (err) {
    console.warn("[DataService] Zone analytics fetch failed:", err);
    return [];
  }
}

/**
 * 11. GET ALERT LOG — Supabase REST primary
 */
export async function getAlertLogData(limit = 50) {
  try {
    return await fetchRecentAlertLog(limit);
  } catch (err) {
    console.warn("[DataService] Alert log fetch failed:", err);
    return [];
  }
}
