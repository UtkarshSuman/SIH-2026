/**
 * FEATURE: Supabase-backed read models for the public maps and admin tools.
 * INSTALLATION: Run `pnpm db:generate` after Prisma schema changes.
 */
import { prisma } from "@sih/database";

export interface ZoneData {
  zoneId: string; name: string; state: string; district: string; lat: number; lng: number;
  minLon: number | null; minLat: number | null; maxLon: number | null; maxLat: number | null;
  population: number; elevationM: number | null; slopeClass: string | null;
  zoneColor: "RED" | "YELLOW" | "GREEN"; worstHazard: "FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST" | null;
  worstScore: number; priority: "IMMEDIATE" | "SHORT_TERM" | "MEDIUM_TERM" | "NONE"; priorityScore: number;
  hazardScores: Record<"FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST", number>;
  metrics: Record<string, number>; lastAssessedAt: string | null; isStale: boolean;
}

export interface RelocationSiteData {
  id: string; siteCode: string; name: string; district: string; state: string; lat: number; lng: number;
  totalAreaSqm: number; usableAreaSqm: number; sphereStandardSqmPerPerson: number; capacity: number;
  currentOccupancy: number; remainingCapacity: number; occupancyPct: number; waterSourceType: string | null;
  roadConnectivityRating: number; hospitalDistanceKm: number | null; powerGridStatus: boolean;
  status: "ACTIVE" | "PLANNED" | "FULL" | "MAINTENANCE"; updatedAt: string;
}

export interface RelocationZonePlanData {
  zoneId: string; zoneName: string; lat: number; lng: number; worstStatus: "RED" | "YELLOW";
  hazardType: string; population: number; totalCapacityUsed: number; isFullyAccommodated: boolean;
  shortfall: number; timeline: string; priorityScore: number;
  allocations: Array<{ siteId: string; siteName: string; district: string; distanceKm: number; capacity: number; contribution: number; timeline: string; roadRouteCoordinates?: [number, number][] }>;
}

export interface HazardHistoryData {
  id: string; zoneId: string; recordedAt: string; period: string; floodScore: number; landslideScore: number;
  erosionScore: number; cloudburstScore: number; worstScore: number; zoneColor: "RED" | "YELLOW" | "GREEN";
  rainfallMm: number | null; riverLevelM: number | null; soilSaturationPct: number | null;
}

const asNumberRecord = (value: unknown): Record<string, number> =>
  value && typeof value === "object"
    ? (Object.fromEntries(
        Object.entries(value as Record<string, unknown>).filter(
          (entry): entry is [string, number] => typeof entry[1] === "number"
        )
      ) as Record<string, number>)
    : {};

function toZoneData(zone: Awaited<ReturnType<typeof prisma.zone.findFirst>>): ZoneData | null {
  if (!zone) return null;
  return {
    zoneId: zone.zoneId, name: zone.name, state: zone.state, district: zone.district, lat: zone.lat, lng: zone.lng,
    minLon: zone.minLon, minLat: zone.minLat, maxLon: zone.maxLon, maxLat: zone.maxLat, population: zone.population,
    elevationM: zone.elevationM, slopeClass: zone.slopeClass, zoneColor: zone.zoneColor, worstHazard: zone.worstHazard,
    worstScore: zone.worstScore, priority: zone.priority, priorityScore: zone.priorityScore,
    hazardScores: { FLOOD: zone.floodScore, LANDSLIDE: zone.landslideScore, EROSION: zone.erosionScore, CLOUDBURST: zone.cloudburstScore },
    metrics: {}, lastAssessedAt: zone.lastAssessedAt?.toISOString() ?? null, isStale: zone.isStale,
  };
}

export async function getRecentZones(): Promise<ZoneData[]> {
  const zones = await prisma.zone.findMany({ orderBy: [{ priorityScore: "desc" }, { updatedAt: "desc" }] });
  return Promise.all(zones.map(async (zone) => {
    const record = toZoneData(zone)!;
    const readings = await prisma.hazardReading.findMany({ where: { zoneId: zone.zoneId }, orderBy: { recordedAt: "desc" }, take: 4 });
    record.metrics = Object.assign({}, ...readings.reverse().map((reading) => asNumberRecord(reading.parameters)));
    return record;
  }));
}

export async function getZoneById(zoneId: string): Promise<ZoneData | null> {
  const zone = toZoneData(await prisma.zone.findUnique({ where: { zoneId } }));
  if (!zone) return null;
  const readings = await prisma.hazardReading.findMany({ where: { zoneId }, orderBy: { recordedAt: "desc" }, take: 4 });
  zone.metrics = Object.assign({}, ...readings.reverse().map((reading) => asNumberRecord(reading.parameters)));
  return zone;
}

export async function getRecentRelocationSites(): Promise<RelocationSiteData[]> {
  const sites = await prisma.relocationSite.findMany({ orderBy: [{ status: "asc" }, { updatedAt: "desc" }] });
  return sites.map((site) => ({ ...site, capacity: site.sphereCapacity,
    occupancyPct: site.sphereCapacity ? Math.round((site.currentOccupancy / site.sphereCapacity) * 100) : 0,
    updatedAt: site.updatedAt.toISOString() }));
}

export async function getRecentRelocationPlan(): Promise<RelocationZonePlanData[]> {
  const plans = await prisma.relocationPlan.findMany({
    include: { zone: true, allocations: { include: { site: true }, orderBy: { distanceKm: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return plans.map((plan) => ({
    zoneId: plan.zoneId, zoneName: plan.zone.name, lat: plan.zone.lat, lng: plan.zone.lng,
    worstStatus: plan.zone.zoneColor === "RED" ? "RED" : "YELLOW", hazardType: plan.zone.worstHazard ?? "MULTI_HAZARD",
    population: plan.totalEvacuees, totalCapacityUsed: plan.allocations.reduce((total, allocation) => total + allocation.allocatedPopulation, 0),
    isFullyAccommodated: plan.isFullyAccommodated, shortfall: plan.shortfall, timeline: plan.timeline, priorityScore: plan.zone.priorityScore,
    allocations: plan.allocations.map((allocation) => ({
      siteId: allocation.siteId, siteName: allocation.site.name, district: allocation.site.district,
      distanceKm: allocation.distanceKm, capacity: allocation.site.sphereCapacity, contribution: allocation.allocatedPopulation,
      timeline: allocation.routeStatus,
      roadRouteCoordinates: Array.isArray(allocation.roadRouteCoordinates) ? allocation.roadRouteCoordinates as [number, number][] : undefined,
    })),
  }));
}

export async function getHistoricalHazardTrends(zoneId: string): Promise<HazardHistoryData[]> {
  const history = await prisma.hazardHistory.findMany({ where: { zoneId }, orderBy: { recordedAt: "asc" } });
  return history.map((row) => ({ ...row, recordedAt: row.recordedAt.toISOString(),
    period: row.recordedAt.toLocaleDateString("en-IN", { month: "short", day: "numeric" }) }));
}

export async function getDatabaseVersion(): Promise<{ version: number; lastUpdated: string }> {
  try {
    const latest = await prisma.zone.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } });
    const lastUpdated = latest?.updatedAt ?? new Date(0);
    return { version: lastUpdated.getTime(), lastUpdated: lastUpdated.toISOString() };
  } catch {
    const fallbackTime = new Date(0);
    return { version: fallbackTime.getTime(), lastUpdated: fallbackTime.toISOString() };
  }
}

export async function updateRelocationSiteCapacity(siteId: string, updates: Partial<RelocationSiteData>) {
  const current = await prisma.relocationSite.findUnique({ where: { id: siteId } });
  if (!current) return null;
  const usableAreaSqm = updates.usableAreaSqm ?? current.usableAreaSqm;
  const capacity = updates.capacity ?? Math.floor(usableAreaSqm / current.sphereStandardSqmPerPerson);
  const currentOccupancy = updates.currentOccupancy ?? current.currentOccupancy;
  return prisma.relocationSite.update({ where: { id: siteId }, data: {
    usableAreaSqm, sphereCapacity: capacity, currentOccupancy, remainingCapacity: Math.max(0, capacity - currentOccupancy),
    status: updates.status, waterSourceType: updates.waterSourceType, roadConnectivityRating: updates.roadConnectivityRating,
  }});
}

export async function recordMLPrediction(payload: { zoneId: string; hazardScores: Record<"FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST", number>; metrics?: unknown; source: string }) {
  const scores = payload.hazardScores;
  const [worstHazard, worstScore] = Object.entries(scores).reduce((highest, current) => current[1] > highest[1] ? current : highest) as [keyof typeof scores, number];
  const zoneColor = worstScore >= 0.7 ? "RED" : worstScore >= 0.4 ? "YELLOW" : "GREEN";
  const priorityScore = zoneColor === "GREEN" ? 0 : worstScore;
  const priority = zoneColor === "RED" && priorityScore >= 0.7 ? "IMMEDIATE" : priorityScore >= 0.45 ? "SHORT_TERM" : zoneColor === "GREEN" ? "NONE" : "MEDIUM_TERM";
  const metrics = asNumberRecord(payload.metrics);
  return prisma.$transaction(async (tx) => {
    const zone = await tx.zone.update({ where: { zoneId: payload.zoneId }, data: {
      floodScore: scores.FLOOD, landslideScore: scores.LANDSLIDE, erosionScore: scores.EROSION, cloudburstScore: scores.CLOUDBURST,
      worstHazard, worstScore, zoneColor, isRedZone: zoneColor === "RED", priority, priorityScore, isStale: false, lastAssessedAt: new Date(),
    }});
    await tx.hazardHistory.create({ data: { zoneId: zone.zoneId, floodScore: scores.FLOOD, landslideScore: scores.LANDSLIDE,
      erosionScore: scores.EROSION, cloudburstScore: scores.CLOUDBURST, worstScore, zoneColor,
      rainfallMm: metrics.rainfall_24h_mm ?? null, riverLevelM: metrics.river_level_m ?? null, soilSaturationPct: metrics.soil_saturation_pct ?? null }});
    return toZoneData(zone);
  });
}
