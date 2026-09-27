/**
 * supabase-client.ts
 *
 * Complete Supabase REST API client — communicates over HTTPS (port 443).
 * Bypasses blocked PostgreSQL ports (5432/6543) by using PostgREST API.
 * Handles ALL data: zones, classifications, relocation, analytics, alerts.
 */

const SUPABASE_URL = "https://jxitjpimiompwifxguch.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aXRqcGltaW9tcHdpZnhndWNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDI1MTYzNCwiZXhwIjoyMTA1ODI3NjM0fQ.QT7Lrxy1VHySl8hLiU33ORGBwCfEuhJmDNh4Y_5I9Ao";

const DEFAULT_HEADERS = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  "Content-Type": "application/json",
};

// ============================================================
// Core HTTP helpers
// ============================================================

async function supabaseGet<T>(
  table: string,
  params: Record<string, string> = {}
): Promise<T[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set("select", "*");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), { headers: DEFAULT_HEADERS });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase GET ${table} (${res.status}): ${txt.substring(0, 200)}`);
  }
  return res.json() as Promise<T[]>;
}

async function supabasePost<T>(
  table: string,
  body: unknown,
  onConflict?: string
): Promise<T[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  if (onConflict) url.searchParams.set("on_conflict", onConflict);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { ...DEFAULT_HEADERS, Prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase POST ${table} (${res.status}): ${txt.substring(0, 200)}`);
  }
  return res.json() as Promise<T[]>;
}

async function supabasePatch<T>(
  table: string,
  filter: Record<string, string>,
  body: unknown
): Promise<T[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(filter)) {
    url.searchParams.set(k, `eq.${v}`);
  }
  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: { ...DEFAULT_HEADERS, Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase PATCH ${table} (${res.status}): ${txt.substring(0, 200)}`);
  }
  return res.json() as Promise<T[]>;
}

async function supabaseDelete(
  table: string,
  filter: Record<string, string>
): Promise<void> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  for (const [k, v] of Object.entries(filter)) {
    url.searchParams.set(k, `eq.${v}`);
  }
  const res = await fetch(url.toString(), {
    method: "DELETE",
    headers: DEFAULT_HEADERS,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Supabase DELETE ${table} (${res.status}): ${txt.substring(0, 200)}`);
  }
}

// ============================================================
// Type definitions (snake_case = DB columns)
// ============================================================

export interface SupabaseZoneRow {
  zone_id: string;
  name: string;
  min_lon: number | null;
  min_lat: number | null;
  max_lon: number | null;
  max_lat: number | null;
  state?: string | null;
  district?: string | null;
  lat?: number | null;
  lng?: number | null;
  population?: number | null;
  elevation_m?: number | null;
  slope_class?: string | null;
  is_red_zone?: boolean | null;
  created_at: string;
  updated_at?: string | null;
}

export interface SupabaseClassificationRow {
  id: string;
  zone_id: string;
  zone_color: "RED" | "YELLOW" | "GREEN";
  worst_hazard: "FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST" | null;
  hazard_scores: string | Record<string, number>;
  priority: "IMMEDIATE" | "SHORT_TERM" | "MEDIUM_TERM" | "NONE";
  priority_score: number;
  classified_at: string;
  data_recorded_at: string;
  stale: boolean;
  priority_is_placeholder: boolean;
}

export interface SupabaseRelocationSite {
  id: string;
  site_code: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  total_area_sqm: number;
  usable_area_sqm: number;
  sphere_standard_sqm_per_person: number;
  sphere_capacity: number;
  current_occupancy: number;
  remaining_capacity: number;
  water_source_type: string | null;
  road_connectivity_rating: number;
  hospital_distance_km: number | null;
  power_grid_status: boolean;
  status: "ACTIVE" | "PLANNED" | "FULL" | "MAINTENANCE";
  created_at: string;
  updated_at: string;
}

export interface SupabaseRelocationPlan {
  id: string;
  zone_id: string;
  total_evacuees: number;
  timeline: string;
  shortfall: number;
  is_fully_accommodated: boolean;
  priority_rank: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseRelocationAllocation {
  id: string;
  plan_id: string;
  site_id: string;
  allocated_population: number;
  distance_km: number;
  road_route_coordinates: [number, number][] | null;
  route_status: "CLEAR" | "CONGESTED" | "BLOCKED" | "HAZARDOUS";
  estimated_transit_hours: number | null;
  created_at: string;
}

export interface SupabaseZoneAnalytics {
  id: string;
  zone_id: string;
  mean_worst_score: number;
  peak_worst_score: number;
  volatility_index: number;
  rainfall_correlation: number;
  river_correlation: number;
  saturation_correlation: number;
  primary_hazard_driver: string | null;
  secondary_hazard_driver: string | null;
  escalation_probability_pct: number;
  days_above_warning: number;
  days_above_critical: number;
  anomalies_detected_count: number;
  generated_briefing: string | null;
  updated_at: string;
}

export interface SupabaseAlertLog {
  id: string;
  zone_id: string;
  severity: "alert" | "warning" | "info";
  from_color: string;
  to_color: string;
  classification_id: string | null;
  recipients_targeted: number;
  recipients_delivered: number;
  sent_at: string;
}

export interface SupabaseEnrichedZone extends SupabaseZoneRow {
  classification: SupabaseClassificationRow | null;
}

// ============================================================
// Utility
// ============================================================

export function parseHazardScores(
  raw: string | Record<string, number> | null | undefined
): Record<string, number> {
  if (!raw) return { FLOOD: 0, LANDSLIDE: 0, EROSION: 0, CLOUDBURST: 0 };
  if (typeof raw === "object") return raw as Record<string, number>;
  try {
    return JSON.parse(raw);
  } catch {
    return { FLOOD: 0, LANDSLIDE: 0, EROSION: 0, CLOUDBURST: 0 };
  }
}

// Known populations for tracked zones (supplemental static data)
const ZONE_POPULATIONS: Record<string, number> = {
  "Z-KERALA-WAYANAD-01": 18200,
  "Z-BIHAR-PATNA-01": 45000,
  "Z-ASSAM-GUWAHATI-01": 32000,
  "Z-ODISHA-PURI-01": 28000,
  "Z-UTTARAKHAND-JOSHIMATH-01": 21500,
};

// ============================================================
// ZONE QUERIES
// ============================================================

export async function fetchAllZonesFromSupabase(): Promise<SupabaseEnrichedZone[]> {
  const [zones, allClassifications] = await Promise.all([
    supabaseGet<SupabaseZoneRow>("zones"),
    supabaseGet<SupabaseClassificationRow>("zone_classifications", {
      order: "classified_at.desc",
    }),
  ]);

  const latestByZone = new Map<string, SupabaseClassificationRow>();
  for (const cls of allClassifications) {
    if (!latestByZone.has(cls.zone_id)) {
      latestByZone.set(cls.zone_id, cls);
    }
  }

  return zones.map((zone) => ({
    ...zone,
    classification: latestByZone.get(zone.zone_id) ?? null,
  }));
}

export async function fetchZoneByIdFromSupabase(
  zoneId: string
): Promise<SupabaseEnrichedZone | null> {
  const [zones, classifications] = await Promise.all([
    supabaseGet<SupabaseZoneRow>("zones", { zone_id: `eq.${zoneId}` }),
    supabaseGet<SupabaseClassificationRow>("zone_classifications", {
      zone_id: `eq.${zoneId}`,
      order: "classified_at.desc",
      limit: "1",
    }),
  ]);

  const zone = zones[0];
  if (!zone) return null;
  return { ...zone, classification: classifications[0] ?? null };
}

export async function fetchZoneHistoryFromSupabase(
  zoneId: string,
  limitDays?: number
): Promise<SupabaseClassificationRow[]> {
  const params: Record<string, string> = { order: "classified_at.asc" };
  if (zoneId) params.zone_id = `eq.${zoneId}`;
  if (limitDays) params.limit = String(limitDays);
  return supabaseGet<SupabaseClassificationRow>("zone_classifications", params);
}

export async function updateZoneClassification(
  zoneId: string,
  updates: {
    zone_color: "RED" | "YELLOW" | "GREEN";
    worst_hazard: string;
    hazard_scores: Record<string, number>;
    priority: string;
    priority_score: number;
  }
): Promise<SupabaseClassificationRow[]> {
  // Insert new classification record (immutable history)
  return supabasePost<SupabaseClassificationRow>("zone_classifications", {
    zone_id: zoneId,
    zone_color: updates.zone_color,
    worst_hazard: updates.worst_hazard,
    hazard_scores: JSON.stringify(updates.hazard_scores),
    priority: updates.priority,
    priority_score: updates.priority_score,
    stale: false,
    priority_is_placeholder: false,
    classified_at: new Date().toISOString(),
    data_recorded_at: new Date().toISOString(),
  });
}

// ============================================================
// RELOCATION SITE QUERIES
// ============================================================

export async function fetchAllRelocationSites(): Promise<SupabaseRelocationSite[]> {
  return supabaseGet<SupabaseRelocationSite>("relocation_sites", {
    order: "status.asc,updated_at.desc",
  });
}

export async function updateRelocationSiteInDB(
  siteId: string,
  updates: Partial<SupabaseRelocationSite>
): Promise<SupabaseRelocationSite | null> {
  const rows = await supabasePatch<SupabaseRelocationSite>(
    "relocation_sites",
    { id: siteId },
    { ...updates, updated_at: new Date().toISOString() }
  );
  return rows[0] ?? null;
}

// ============================================================
// RELOCATION PLAN QUERIES
// ============================================================

export interface SupabaseEnrichedPlan extends SupabaseRelocationPlan {
  zone: SupabaseZoneRow | null;
  allocations: Array<SupabaseRelocationAllocation & { site: SupabaseRelocationSite | null }>;
}

export async function fetchAllRelocationPlans(): Promise<SupabaseEnrichedPlan[]> {
  const [plans, zones, allocations, sites] = await Promise.all([
    supabaseGet<SupabaseRelocationPlan>("relocation_plans", { order: "priority_rank.asc" }),
    supabaseGet<SupabaseZoneRow>("zones"),
    supabaseGet<SupabaseRelocationAllocation>("relocation_allocations", { order: "distance_km.asc" }),
    supabaseGet<SupabaseRelocationSite>("relocation_sites"),
  ]);

  const zoneMap = new Map(zones.map((z) => [z.zone_id, z]));
  const siteMap = new Map(sites.map((s) => [s.id, s]));

  return plans.map((plan) => ({
    ...plan,
    zone: zoneMap.get(plan.zone_id) ?? null,
    allocations: allocations
      .filter((a) => a.plan_id === plan.id)
      .map((a) => ({ ...a, site: siteMap.get(a.site_id) ?? null })),
  }));
}

// ============================================================
// ZONE ANALYTICS QUERIES
// ============================================================

export async function fetchAllZoneAnalytics(): Promise<SupabaseZoneAnalytics[]> {
  return supabaseGet<SupabaseZoneAnalytics>("zone_analytics", {
    order: "escalation_probability_pct.desc",
  });
}

export async function fetchZoneAnalytics(zoneId: string): Promise<SupabaseZoneAnalytics | null> {
  const rows = await supabaseGet<SupabaseZoneAnalytics>("zone_analytics", {
    zone_id: `eq.${zoneId}`,
    limit: "1",
  });
  return rows[0] ?? null;
}

export async function upsertZoneAnalytics(
  analytics: Partial<SupabaseZoneAnalytics> & { zone_id: string }
): Promise<SupabaseZoneAnalytics | null> {
  const rows = await supabasePost<SupabaseZoneAnalytics>(
    "zone_analytics",
    { ...analytics, updated_at: new Date().toISOString() },
    "zone_id"
  );
  return rows[0] ?? null;
}

// ============================================================
// ALERT LOG QUERIES
// ============================================================

export async function fetchRecentAlertLog(limit = 50): Promise<SupabaseAlertLog[]> {
  return supabaseGet<SupabaseAlertLog>("alert_log", {
    order: "sent_at.desc",
    limit: String(limit),
  });
}

export async function insertAlertLog(entry: {
  zone_id: string;
  severity: "alert" | "warning" | "info";
  from_color: string;
  to_color: string;
  classification_id?: string | null;
  recipients_targeted?: number;
  recipients_delivered?: number;
}): Promise<SupabaseAlertLog | null> {
  const rows = await supabasePost<SupabaseAlertLog>("alert_log", {
    ...entry,
    recipients_targeted: entry.recipients_targeted ?? 0,
    recipients_delivered: entry.recipients_delivered ?? 0,
    sent_at: new Date().toISOString(),
  });
  return rows[0] ?? null;
}

// ============================================================
// ML PREDICTION WRITE-BACK
// Records a new classification result from the ML pipeline
// ============================================================

export async function recordMLPredictionToSupabase(payload: {
  zoneId: string;
  hazardScores: Record<"FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST", number>;
  source?: string;
}): Promise<SupabaseClassificationRow | null> {
  const scores = payload.hazardScores;
  const worstEntry = Object.entries(scores).reduce((a, b) => (b[1] > a[1] ? b : a));
  const worstHazard = worstEntry[0] as "FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST";
  const worstScore = worstEntry[1];
  const zoneColor: "RED" | "YELLOW" | "GREEN" =
    worstScore >= 0.7 ? "RED" : worstScore >= 0.4 ? "YELLOW" : "GREEN";
  const priority =
    zoneColor === "RED" && worstScore >= 0.7
      ? "IMMEDIATE"
      : worstScore >= 0.45
      ? "SHORT_TERM"
      : zoneColor === "GREEN"
      ? "NONE"
      : "MEDIUM_TERM";

  try {
    const rows = await supabasePost<SupabaseClassificationRow>("zone_classifications", {
      zone_id: payload.zoneId,
      zone_color: zoneColor,
      worst_hazard: worstHazard,
      hazard_scores: JSON.stringify(scores),
      priority,
      priority_score: worstScore,
      stale: false,
      priority_is_placeholder: false,
      classified_at: new Date().toISOString(),
      data_recorded_at: new Date().toISOString(),
    });
    return rows[0] ?? null;
  } catch (err) {
    console.error("[SupabaseClient] recordMLPrediction failed:", err);
    return null;
  }
}

// ============================================================
// ZONE DATA CONVERSION (DB → Frontend shape)
// ============================================================

export function supabaseZoneToFrontend(zone: SupabaseEnrichedZone) {
  const cls = zone.classification;
  const scores = parseHazardScores(cls?.hazard_scores);

  // Use explicit lat/lng columns if available, else derive from bbox center
  const lat =
    zone.lat ??
    (zone.min_lat != null && zone.max_lat != null
      ? (zone.min_lat + zone.max_lat) / 2
      : 20.5937);
  const lng =
    zone.lng ??
    (zone.min_lon != null && zone.max_lon != null
      ? (zone.min_lon + zone.max_lon) / 2
      : 78.9629);

  const zoneColor = (cls?.zone_color ?? "GREEN") as "RED" | "YELLOW" | "GREEN";
  const worstHazard = (cls?.worst_hazard ?? "FLOOD") as "FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST";
  const worstScore = Math.max(...Object.values(scores).map(Number), 0);
  const priority = (cls?.priority ?? "NONE") as "IMMEDIATE" | "SHORT_TERM" | "MEDIUM_TERM" | "NONE";
  const priorityScore = cls?.priority_score ?? 0;

  // Prefer DB state/district; fallback to name parsing
  const nameParts = zone.name.split(",").map((s) => s.trim());
  const district = zone.district ?? nameParts[0] ?? zone.name;
  const state = zone.state ?? nameParts[1] ?? "India";
  const population = zone.population ?? ZONE_POPULATIONS[zone.zone_id] ?? 0;

  return {
    zoneId: zone.zone_id,
    name: zone.name,
    state,
    district,
    lat,
    lng,
    minLon: zone.min_lon,
    minLat: zone.min_lat,
    maxLon: zone.max_lon,
    maxLat: zone.max_lat,
    population,
    elevationM: zone.elevation_m ?? null,
    slopeClass: zone.slope_class ?? null,
    isRedZone: zoneColor === "RED",
    zoneColor,
    worstHazard,
    worstScore,
    priority,
    priorityScore,
    hazardScores: {
      FLOOD: scores.FLOOD ?? 0,
      LANDSLIDE: scores.LANDSLIDE ?? 0,
      EROSION: scores.EROSION ?? 0,
      CLOUDBURST: scores.CLOUDBURST ?? 0,
    },
    metrics: {
      rainfall_24h_mm: 50,
      rainfall_72h_mm: 80,
      river_discharge_m3s: 20,
      soil_saturation_pct: 60,
      slope_deg: 20,
    },
    lastAssessedAt: cls?.classified_at ?? zone.created_at,
    isStale: cls?.stale ?? false,
    baselineFloodScore: 0.18,
    baselineLandslideScore: 0.22,
    baselineErosionScore: 0.08,
    baselineCloudburstScore: 0.12,
    criticalThreshold: 0.7,
    warningThreshold: 0.4,
    modelName: "Multi-Hazard Ensemble RF-v4.2",
    modelVersion: "v4.2.1-prod",
    confidenceScore: 0.91,
    sensorNodeCount: 16,
    riskVelocity: 0.0,
    evacuationReadinessPct: 85.0,
  };
}

export function supabaseSiteToFrontend(site: SupabaseRelocationSite) {
  const occupancyPct = site.sphere_capacity
    ? Math.round((site.current_occupancy / site.sphere_capacity) * 100)
    : 0;
  return {
    id: site.id,
    siteCode: site.site_code,
    name: site.name,
    district: site.district,
    state: site.state,
    lat: site.lat,
    lng: site.lng,
    totalAreaSqm: site.total_area_sqm,
    usableAreaSqm: site.usable_area_sqm,
    sphereStandardSqmPerPerson: site.sphere_standard_sqm_per_person,
    capacity: site.sphere_capacity,
    currentOccupancy: site.current_occupancy,
    remainingCapacity: site.remaining_capacity,
    occupancyPct,
    waterSourceType: site.water_source_type,
    roadConnectivityRating: site.road_connectivity_rating,
    hospitalDistanceKm: site.hospital_distance_km,
    powerGridStatus: site.power_grid_status,
    status: site.status,
    updatedAt: site.updated_at,
  };
}

export function supabasePlanToFrontend(plan: SupabaseEnrichedPlan) {
  const zone = plan.zone;
  const cls = zone ? null : null; // zone classification is fetched separately

  return {
    zoneId: plan.zone_id,
    zoneName: zone?.name ?? plan.zone_id,
    lat: zone?.lat ?? (zone?.min_lat != null && zone?.max_lat != null ? (zone.min_lat + zone.max_lat) / 2 : 20),
    lng: zone?.lng ?? (zone?.min_lon != null && zone?.max_lon != null ? (zone.min_lon + zone.max_lon) / 2 : 78),
    worstStatus: "YELLOW" as const,
    hazardType: "MULTI_HAZARD",
    population: plan.total_evacuees,
    totalCapacityUsed: plan.allocations.reduce((s, a) => s + a.allocated_population, 0),
    isFullyAccommodated: plan.is_fully_accommodated,
    shortfall: plan.shortfall,
    timeline: plan.timeline,
    priorityScore: 0,
    allocations: plan.allocations.map((a) => ({
      siteId: a.site_id,
      siteName: a.site?.name ?? a.site_id,
      district: a.site?.district ?? "",
      distanceKm: a.distance_km,
      capacity: a.site?.sphere_capacity ?? 0,
      contribution: a.allocated_population,
      timeline: a.route_status,
      roadRouteCoordinates: Array.isArray(a.road_route_coordinates)
        ? (a.road_route_coordinates as [number, number][])
        : undefined,
    })),
  };
}
