/**
 * central-fallback-store.ts
 *
 * UNIFIED AUTHORITATIVE FALLBACK STORE FOR ALL SERVICES:
 * - Zones & Multi-Hazard Scoring
 * - Relocation Sites, Capacities & Allocations
 * - Hazard History Time-Series & Correlations
 * - Alert Service Subscriptions & Presets
 *
 * Used exclusively when the PostgreSQL database or backend API is offline or unreachable.
 * When fallback data is returned, `isFallback: true` and a standardized warning message are attached.
 */

import fs from "fs";
import path from "path";

export const FALLBACK_WARNING_MESSAGE =
  "Database or backend offline using internal latest data.";

export interface FallbackMeta {
  isFallback: boolean;
  source: "DATABASE" | "CENTRAL_FALLBACK_STORE";
  warningMessage?: string;
  timestamp: string;
}

export interface FallbackZone {
  zoneId: string;
  name: string;
  state: string;
  district: string;
  lat: number;
  lng: number;
  minLon: number | null;
  minLat: number | null;
  maxLon: number | null;
  maxLat: number | null;
  population: number;
  elevationM: number | null;
  slopeClass: string | null;
  isRedZone?: boolean;
  zoneColor: "RED" | "YELLOW" | "GREEN";
  worstHazard: "FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST";
  worstScore: number;
  priority: "IMMEDIATE" | "SHORT_TERM" | "MEDIUM_TERM" | "NONE";
  priorityScore: number;
  hazardScores: {
    FLOOD: number;
    LANDSLIDE: number;
    EROSION: number;
    CLOUDBURST: number;
  };
  metrics: {
    rainfall_24h_mm: number;
    rainfall_72h_mm: number;
    river_discharge_m3s: number;
    soil_saturation_pct: number;
    slope_deg: number;
  };
  baselineFloodScore?: number;
  baselineLandslideScore?: number;
  baselineErosionScore?: number;
  baselineCloudburstScore?: number;
  criticalThreshold?: number;
  warningThreshold?: number;
  modelName?: string;
  modelVersion?: string;
  confidenceScore?: number;
  sensorNodeCount?: number;
  riskVelocity?: number;
  evacuationReadinessPct?: number;
  lastAssessedAt: string;
  isStale: boolean;
}

export interface FallbackRelocationSite {
  id: string;
  siteCode: string;
  name: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  totalAreaSqm: number;
  usableAreaSqm: number;
  sphereStandardSqmPerPerson: number;
  capacity: number;
  currentOccupancy: number;
  remainingCapacity: number;
  occupancyPct: number;
  waterSourceType: string | null;
  roadConnectivityRating: number;
  hospitalDistanceKm: number | null;
  powerGridStatus: boolean;
  status: "ACTIVE" | "PLANNED" | "FULL" | "MAINTENANCE";
  updatedAt: string;
}

export interface FallbackRelocationPlan {
  zoneId: string;
  zoneName: string;
  lat: number;
  lng: number;
  worstStatus: "RED" | "YELLOW";
  hazardType: string;
  population: number;
  totalCapacityUsed: number;
  isFullyAccommodated: boolean;
  shortfall: number;
  timeline: string;
  priorityScore: number;
  allocations: Array<{
    siteId: string;
    siteName: string;
    district: string;
    distanceKm: number;
    capacity: number;
    contribution: number;
    timeline: string;
    roadRouteCoordinates?: [number, number][];
  }>;
}

export interface FallbackHazardHistory {
  id: string;
  zoneId: string;
  recordedAt: string;
  period: string;
  floodScore: number;
  landslideScore: number;
  erosionScore: number;
  cloudburstScore: number;
  worstScore: number;
  zoneColor: "RED" | "YELLOW" | "GREEN";
  rainfallMm: number | null;
  riverLevelM: number | null;
  soilSaturationPct: number | null;
  temperatureC?: number | null;
  dischargeCumecs?: number | null;
  humidityPct?: number | null;
  windSpeedKmh?: number | null;
  confidence?: number | null;
}

export interface FallbackAlertZone {
  zone_id: string;
  name: string;
  hazard: string;
  color?: string;
  district?: string;
  state?: string;
}

export interface FallbackAlertHistoryItem {
  id: string;
  zone_id: string;
  severity: string;
  from_color: string;
  to_color: string;
  sent_at: string;
  recipients_targeted: number;
  recipients_delivered: number;
}

export interface CentralFallbackDataState {
  version: number;
  lastUpdated: string;
  zones: FallbackZone[];
  relocationSites: FallbackRelocationSite[];
  relocationPlans: FallbackRelocationPlan[];
  hazardHistory: FallbackHazardHistory[];
  alertHistory?: FallbackAlertHistoryItem[];
}

function resolveDbPath(): string {
  const candidate1 = path.join(process.cwd(), "frontend", "data", "rescue_arc_database.json");
  if (fs.existsSync(candidate1)) return candidate1;
  const candidate2 = path.join(process.cwd(), "data", "rescue_arc_database.json");
  if (fs.existsSync(candidate2)) return candidate2;
  if (fs.existsSync(path.join(process.cwd(), "frontend"))) return candidate1;
  return candidate2;
}

const FALLBACK_FILE = resolveDbPath();

class CentralFallbackStore {
  private cache: CentralFallbackDataState | null = null;

  private load(): CentralFallbackDataState {
    if (this.cache) return this.cache;

    try {
      if (fs.existsSync(FALLBACK_FILE)) {
        const content = fs.readFileSync(FALLBACK_FILE, "utf-8");
        this.cache = JSON.parse(content);
        return this.cache!;
      }
    } catch (e) {
      console.warn("[CentralFallbackStore] Read failed, initializing defaults:", e);
    }

    this.cache = this.createDefaultSeed();
    return this.cache;
  }

  private save(): void {
    if (!this.cache) return;
    try {
      this.cache.version = Date.now();
      this.cache.lastUpdated = new Date().toISOString();
      const dir = path.dirname(FALLBACK_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(FALLBACK_FILE, JSON.stringify(this.cache, null, 2), "utf-8");
    } catch (e) {
      console.warn("[CentralFallbackStore] Write failed:", e);
    }
  }

  // 1. ZONES FALLBACK
  public getZones(): { zones: FallbackZone[]; isFallback: true; warning: string } {
    const state = this.load();
    return {
      zones: state.zones,
      isFallback: true,
      warning: FALLBACK_WARNING_MESSAGE,
    };
  }

  public getZone(zoneId: string): { zone: FallbackZone | null; isFallback: true; warning: string } {
    const state = this.load();
    const zone = state.zones.find((z) => z.zoneId.toLowerCase() === zoneId.toLowerCase()) || null;
    return {
      zone,
      isFallback: true,
      warning: FALLBACK_WARNING_MESSAGE,
    };
  }

  // 2. RELOCATION SITES FALLBACK
  public getRelocationSites(): { sites: FallbackRelocationSite[]; isFallback: true; warning: string } {
    const state = this.load();
    return {
      sites: state.relocationSites,
      isFallback: true,
      warning: FALLBACK_WARNING_MESSAGE,
    };
  }

  // 3. RELOCATION PLANS FALLBACK
  public getRelocationPlans(): { plans: FallbackRelocationPlan[]; isFallback: true; warning: string } {
    const state = this.load();
    return {
      plans: state.relocationPlans,
      isFallback: true,
      warning: FALLBACK_WARNING_MESSAGE,
    };
  }

  // 4. HAZARD HISTORY FALLBACK
  public getHazardHistory(
    zoneId: string,
    limitDays?: number
  ): { history: FallbackHazardHistory[]; isFallback: true; warning: string } {
    const state = this.load();
    let records = state.hazardHistory
      .filter((h) => h.zoneId.toLowerCase() === zoneId.toLowerCase())
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

    if (limitDays && limitDays > 0) {
      records = records.slice(-limitDays);
    }

    return {
      history: records,
      isFallback: true,
      warning: FALLBACK_WARNING_MESSAGE,
    };
  }

  // 5. ALERT SERVICE ZONES FALLBACK
  public getAlertZones(): { zones: FallbackAlertZone[]; isFallback: true; warning: string } {
    const state = this.load();
    const alertZones: FallbackAlertZone[] = state.zones.map((z) => ({
      zone_id: z.zoneId,
      name: z.name,
      hazard: z.worstHazard || "LANDSLIDE",
      color: z.zoneColor,
      district: z.district,
      state: z.state,
    }));

    return {
      zones: alertZones,
      isFallback: true,
      warning: FALLBACK_WARNING_MESSAGE,
    };
  }

  // 5b. ALERT HISTORY FALLBACK
  public getFallbackAlertHistory(): { alerts: FallbackAlertHistoryItem[]; isFallback: true; warning: string } {
    const state = this.load();
    const alerts =
      state.alertHistory && state.alertHistory.length > 0
        ? state.alertHistory
        : [
            {
              id: "fb-alert-1",
              zone_id: "Z-KERALA-WAYANAD-01",
              severity: "alert",
              from_color: "GREEN",
              to_color: "RED",
              sent_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              recipients_targeted: 14,
              recipients_delivered: 14,
            },
            {
              id: "fb-alert-2",
              zone_id: "Z-UTTARAKHAND-JOSHIMATH-01",
              severity: "warning",
              from_color: "GREEN",
              to_color: "YELLOW",
              sent_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
              recipients_targeted: 9,
              recipients_delivered: 8,
            },
            {
              id: "fb-alert-3",
              zone_id: "Z-ODISHA-PURI-01",
              severity: "alert",
              from_color: "YELLOW",
              to_color: "RED",
              sent_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
              recipients_targeted: 28,
              recipients_delivered: 27,
            },
          ];

    return {
      alerts,
      isFallback: true,
      warning: FALLBACK_WARNING_MESSAGE,
    };
  }

  // 6. UPDATE RELOCATION CAPACITY IN FALLBACK CACHE
  public updateRelocationSite(
    siteId: string,
    updates: Partial<FallbackRelocationSite>
  ): FallbackRelocationSite | null {
    const state = this.load();
    const site = state.relocationSites.find((s) => s.id === siteId || s.siteCode === siteId);
    if (!site) return null;

    if (updates.capacity !== undefined) site.capacity = updates.capacity;
    if (updates.usableAreaSqm !== undefined) site.usableAreaSqm = updates.usableAreaSqm;
    if (updates.currentOccupancy !== undefined) site.currentOccupancy = updates.currentOccupancy;
    if (updates.status !== undefined) site.status = updates.status;
    if (updates.waterSourceType !== undefined) site.waterSourceType = updates.waterSourceType;
    if (updates.roadConnectivityRating !== undefined) site.roadConnectivityRating = updates.roadConnectivityRating;

    site.remainingCapacity = Math.max(0, site.capacity - site.currentOccupancy);
    site.occupancyPct = Math.round((site.currentOccupancy / (site.capacity || 1)) * 100);
    if (site.remainingCapacity <= 0) site.status = "FULL";
    site.updatedAt = new Date().toISOString();

    state.relocationPlans.forEach((p) => {
      p.allocations.forEach((a) => {
        if (a.siteId === site.id) a.capacity = site.capacity;
      });
    });

    this.save();
    return site;
  }

  public getVersionInfo(): { version: number; lastUpdated: string } {
    const state = this.load();
    return {
      version: state.version || 1790500000000,
      lastUpdated: state.lastUpdated || new Date(1790500000000).toISOString(),
    };
  }

  public updateZone(
    zoneId: string,
    updates: Partial<FallbackZone>
  ): FallbackZone | null {
    const state = this.load();
    const zone = state.zones.find((z) => z.zoneId.toLowerCase() === zoneId.toLowerCase());
    if (!zone) return null;

    if (updates.population !== undefined) zone.population = updates.population;
    if (updates.isRedZone !== undefined) zone.isRedZone = updates.isRedZone;
    if (updates.zoneColor !== undefined) zone.zoneColor = updates.zoneColor;
    if (updates.worstHazard !== undefined) zone.worstHazard = updates.worstHazard;
    if (updates.worstScore !== undefined) zone.worstScore = updates.worstScore;
    if (updates.priority !== undefined) zone.priority = updates.priority;
    if (updates.priorityScore !== undefined) zone.priorityScore = updates.priorityScore;

    zone.lastAssessedAt = new Date().toISOString();
    this.save();
    return zone;
  }

  public updateAllocationRoute(
    siteId: string,
    updates: { routeStatus?: string; timeline?: string }
  ): boolean {
    const state = this.load();
    let updated = false;
    state.relocationPlans.forEach((p) => {
      p.allocations.forEach((a) => {
        if (a.siteId === siteId) {
          if (updates.routeStatus) a.timeline = updates.routeStatus;
          updated = true;
        }
      });
    });
    if (updated) this.save();
    return updated;
  }

  // 7. RECORD ML PREDICTION IN FALLBACK CACHE
  public recordMLPrediction(payload: {
    zoneId: string;
    hazardScores: { FLOOD: number; LANDSLIDE: number; EROSION: number; CLOUDBURST: number };
    metrics?: any;
  }): FallbackZone | null {
    const state = this.load();
    const zone = state.zones.find((z) => z.zoneId.toLowerCase() === payload.zoneId.toLowerCase());
    if (!zone) return null;

    const scores = payload.hazardScores;
    const worstScore = Math.max(scores.FLOOD, scores.LANDSLIDE, scores.EROSION, scores.CLOUDBURST);
    let worstHazard: FallbackZone["worstHazard"] = "FLOOD";
    if (scores.LANDSLIDE === worstScore) worstHazard = "LANDSLIDE";
    else if (scores.EROSION === worstScore) worstHazard = "EROSION";
    else if (scores.CLOUDBURST === worstScore) worstHazard = "CLOUDBURST";

    const zoneColor: FallbackZone["zoneColor"] =
      worstScore >= 0.7 ? "RED" : worstScore >= 0.4 ? "YELLOW" : "GREEN";

    zone.hazardScores = scores;
    zone.worstScore = Number(worstScore.toFixed(3));
    zone.worstHazard = worstHazard;
    zone.zoneColor = zoneColor;
    zone.lastAssessedAt = new Date().toISOString();

    const newHist: FallbackHazardHistory = {
      id: `hist-${zone.zoneId}-${Date.now()}`,
      zoneId: zone.zoneId,
      recordedAt: new Date().toISOString(),
      period: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      floodScore: scores.FLOOD,
      landslideScore: scores.LANDSLIDE,
      erosionScore: scores.EROSION,
      cloudburstScore: scores.CLOUDBURST,
      worstScore,
      zoneColor,
      rainfallMm: payload.metrics?.rainfall_72h_mm ?? 50,
      riverLevelM: 2.1,
      soilSaturationPct: payload.metrics?.soil_saturation_pct ?? 60,
    };
    state.hazardHistory.push(newHist);

    this.save();
    return zone;
  }

  private createDefaultSeed(): CentralFallbackDataState {
    const now = new Date().toISOString();
    return {
      version: Date.now(),
      lastUpdated: now,
      zones: [
        {
          zoneId: "Z-UTTARAKHAND-JOSHIMATH-01",
          name: "Joshimath Town & Ravine Valley, Uttarakhand",
          state: "Uttarakhand",
          district: "Chamoli",
          lat: 30.5551,
          lng: 79.5641,
          minLon: 79.5391,
          minLat: 30.5301,
          maxLon: 79.5891,
          maxLat: 30.5801,
          population: 21500,
          elevationM: 1890,
          slopeClass: "Steep Valley (>30 deg)",
          zoneColor: "RED",
          worstHazard: "CLOUDBURST",
          worstScore: 0.945,
          priority: "IMMEDIATE",
          priorityScore: 0.898,
          hazardScores: { FLOOD: 0.846, LANDSLIDE: 0.665, EROSION: 0.689, CLOUDBURST: 0.945 },
          metrics: { rainfall_24h_mm: 92.5, rainfall_72h_mm: 114.3, river_discharge_m3s: 36.88, soil_saturation_pct: 90.7, slope_deg: 32 },
          baselineFloodScore: 0.18,
          baselineLandslideScore: 0.22,
          baselineErosionScore: 0.08,
          baselineCloudburstScore: 0.12,
          criticalThreshold: 0.70,
          warningThreshold: 0.40,
          modelName: "Multi-Hazard Ensemble RF-v4.2",
          modelVersion: "v4.2.1-prod",
          confidenceScore: 0.94,
          sensorNodeCount: 18,
          riskVelocity: 0.042,
          evacuationReadinessPct: 92.0,
          lastAssessedAt: now,
          isStale: false,
        },
        {
          zoneId: "Z-KERALA-WAYANAD-01",
          name: "Meppadi Chooralmala Sector, Wayanad",
          state: "Kerala",
          district: "Wayanad",
          lat: 11.5367,
          lng: 76.1311,
          minLon: 76.1067,
          minLat: 11.5117,
          maxLon: 76.1567,
          maxLat: 11.5617,
          population: 18200,
          elevationM: 980,
          slopeClass: "Escarpment Slopes (>35 deg)",
          zoneColor: "RED",
          worstHazard: "LANDSLIDE",
          worstScore: 0.884,
          priority: "IMMEDIATE",
          priorityScore: 0.865,
          hazardScores: { FLOOD: 0.72, LANDSLIDE: 0.884, EROSION: 0.54, CLOUDBURST: 0.79 },
          metrics: { rainfall_24h_mm: 112.0, rainfall_72h_mm: 158.4, river_discharge_m3s: 29.4, soil_saturation_pct: 94.2, slope_deg: 38 },
          baselineFloodScore: 0.20,
          baselineLandslideScore: 0.24,
          baselineErosionScore: 0.10,
          baselineCloudburstScore: 0.15,
          criticalThreshold: 0.70,
          warningThreshold: 0.40,
          modelName: "Multi-Hazard Ensemble RF-v4.2",
          modelVersion: "v4.2.1-prod",
          confidenceScore: 0.93,
          sensorNodeCount: 16,
          riskVelocity: 0.038,
          evacuationReadinessPct: 89.0,
          lastAssessedAt: now,
          isStale: false,
        },
        {
          zoneId: "Z-BIHAR-PATNA-01",
          name: "Patna Central Lowlands & Ganga Basin, Bihar",
          state: "Bihar",
          district: "Patna",
          lat: 25.5941,
          lng: 85.1376,
          minLon: 25.5691,
          minLat: 85.1126,
          maxLon: 25.6191,
          maxLat: 85.1626,
          population: 45000,
          elevationM: 53,
          slopeClass: "Flat Plain (<5 deg)",
          zoneColor: "YELLOW",
          worstHazard: "FLOOD",
          worstScore: 0.686,
          priority: "SHORT_TERM",
          priorityScore: 0.65,
          hazardScores: { FLOOD: 0.686, LANDSLIDE: 0.12, EROSION: 0.61, CLOUDBURST: 0.32 },
          metrics: { rainfall_24h_mm: 45.0, rainfall_72h_mm: 68.2, river_discharge_m3s: 58.2, soil_saturation_pct: 72.0, slope_deg: 3 },
          baselineFloodScore: 0.22,
          baselineLandslideScore: 0.05,
          baselineErosionScore: 0.15,
          baselineCloudburstScore: 0.10,
          criticalThreshold: 0.70,
          warningThreshold: 0.40,
          modelName: "Multi-Hazard Ensemble RF-v4.2",
          modelVersion: "v4.2.1-prod",
          confidenceScore: 0.91,
          sensorNodeCount: 14,
          riskVelocity: 0.015,
          evacuationReadinessPct: 82.0,
          lastAssessedAt: now,
          isStale: false,
        },
        {
          zoneId: "Z-ASSAM-GUWAHATI-01",
          name: "Guwahati Brahmaputra Floodplain, Assam",
          state: "Assam",
          district: "Kamrup Metropolitan",
          lat: 26.1445,
          lng: 91.7362,
          minLon: 26.1195,
          minLat: 91.7112,
          maxLon: 26.1695,
          maxLat: 91.7612,
          population: 32000,
          elevationM: 55,
          slopeClass: "Riverine Valley (<8 deg)",
          zoneColor: "YELLOW",
          worstHazard: "FLOOD",
          worstScore: 0.582,
          priority: "SHORT_TERM",
          priorityScore: 0.55,
          hazardScores: { FLOOD: 0.582, LANDSLIDE: 0.28, EROSION: 0.49, CLOUDBURST: 0.35 },
          metrics: { rainfall_24h_mm: 38.0, rainfall_72h_mm: 52.1, river_discharge_m3s: 82.5, soil_saturation_pct: 68.5, slope_deg: 6 },
          baselineFloodScore: 0.25,
          baselineLandslideScore: 0.10,
          baselineErosionScore: 0.18,
          baselineCloudburstScore: 0.12,
          criticalThreshold: 0.70,
          warningThreshold: 0.40,
          modelName: "Multi-Hazard Ensemble RF-v4.2",
          modelVersion: "v4.2.1-prod",
          confidenceScore: 0.90,
          sensorNodeCount: 12,
          riskVelocity: 0.008,
          evacuationReadinessPct: 80.0,
          lastAssessedAt: now,
          isStale: false,
        },
        {
          zoneId: "Z-ODISHA-PURI-01",
          name: "Puri Coastal Littoral Zone, Odisha",
          state: "Odisha",
          district: "Puri",
          lat: 19.8135,
          lng: 85.8312,
          minLon: 19.7885,
          minLat: 85.8062,
          maxLon: 19.8385,
          maxLat: 85.8562,
          population: 28000,
          elevationM: 10,
          slopeClass: "Coastal Beach (<3 deg)",
          zoneColor: "GREEN",
          worstHazard: "EROSION",
          worstScore: 0.315,
          priority: "NONE",
          priorityScore: 0.0,
          hazardScores: { FLOOD: 0.24, LANDSLIDE: 0.05, EROSION: 0.315, CLOUDBURST: 0.18 },
          metrics: { rainfall_24h_mm: 12.0, rainfall_72h_mm: 18.4, river_discharge_m3s: 14.1, soil_saturation_pct: 44.0, slope_deg: 2 },
          baselineFloodScore: 0.15,
          baselineLandslideScore: 0.02,
          baselineErosionScore: 0.20,
          baselineCloudburstScore: 0.08,
          criticalThreshold: 0.70,
          warningThreshold: 0.40,
          modelName: "Multi-Hazard Ensemble RF-v4.2",
          modelVersion: "v4.2.1-prod",
          confidenceScore: 0.95,
          sensorNodeCount: 10,
          riskVelocity: -0.012,
          evacuationReadinessPct: 95.0,
          lastAssessedAt: now,
          isStale: false,
        },
      ],
      relocationSites: [
        {
          id: "RS-UK-PIPALKOTI-01",
          siteCode: "RS-PIPALKOTI-01",
          name: "Pipalkoti Safe Valley Township",
          district: "Chamoli",
          state: "Uttarakhand",
          lat: 30.4308,
          lng: 79.4312,
          totalAreaSqm: 450000,
          usableAreaSqm: 380000,
          sphereStandardSqmPerPerson: 45,
          capacity: 8444,
          currentOccupancy: 2100,
          remainingCapacity: 6344,
          occupancyPct: 25,
          waterSourceType: "Gravity Fed Perennial Aquifer",
          roadConnectivityRating: 5,
          hospitalDistanceKm: 3.2,
          powerGridStatus: true,
          status: "ACTIVE",
          updatedAt: now,
        },
        {
          id: "RS-UK-GAUCHAR-01",
          siteCode: "RS-GAUCHAR-01",
          name: "Gauchar Airstrip Emergency Settlement",
          district: "Chamoli",
          state: "Uttarakhand",
          lat: 30.2883,
          lng: 79.1558,
          totalAreaSqm: 680000,
          usableAreaSqm: 560000,
          sphereStandardSqmPerPerson: 45,
          capacity: 12444,
          currentOccupancy: 3400,
          remainingCapacity: 9044,
          occupancyPct: 27,
          waterSourceType: "Municipal Filtration + River Intake",
          roadConnectivityRating: 5,
          hospitalDistanceKm: 1.5,
          powerGridStatus: true,
          status: "ACTIVE",
          updatedAt: now,
        },
        {
          id: "RS-KL-KALPETTA-01",
          siteCode: "RS-KALPETTA-01",
          name: "Kalpetta South Resettlement Enclave",
          district: "Wayanad",
          state: "Kerala",
          lat: 11.605,
          lng: 76.083,
          totalAreaSqm: 520000,
          usableAreaSqm: 440000,
          sphereStandardSqmPerPerson: 45,
          capacity: 9777,
          currentOccupancy: 4200,
          remainingCapacity: 5577,
          occupancyPct: 43,
          waterSourceType: "Borewell Grid + Rainwater Reservoir",
          roadConnectivityRating: 5,
          hospitalDistanceKm: 2.1,
          powerGridStatus: true,
          status: "ACTIVE",
          updatedAt: now,
        },
        {
          id: "RS-BH-DANAPUR-01",
          siteCode: "RS-DANAPUR-01",
          name: "Danapur High Ground Shelter Complex",
          district: "Patna",
          state: "Bihar",
          lat: 25.6333,
          lng: 85.05,
          totalAreaSqm: 720000,
          usableAreaSqm: 600000,
          sphereStandardSqmPerPerson: 45,
          capacity: 13333,
          currentOccupancy: 5100,
          remainingCapacity: 8233,
          occupancyPct: 38,
          waterSourceType: "Deep Tube Wells",
          roadConnectivityRating: 4,
          hospitalDistanceKm: 4.0,
          powerGridStatus: true,
          status: "ACTIVE",
          updatedAt: now,
        },
      ],
      relocationPlans: [
        {
          zoneId: "Z-UTTARAKHAND-JOSHIMATH-01",
          zoneName: "Joshimath Town & Ravine Valley, Uttarakhand",
          lat: 30.5551,
          lng: 79.5641,
          worstStatus: "RED",
          hazardType: "CLOUDBURST",
          population: 21500,
          totalCapacityUsed: 15388,
          isFullyAccommodated: true,
          shortfall: 0,
          timeline: "IMMEDIATE (48h Protocol)",
          priorityScore: 0.898,
          allocations: [
            {
              siteId: "RS-UK-PIPALKOTI-01",
              siteName: "Pipalkoti Safe Valley Township",
              district: "Chamoli",
              distanceKm: 31.5,
              capacity: 8444,
              contribution: 6344,
              timeline: "CLEAR",
              roadRouteCoordinates: [
                [30.5551, 79.5641],
                [30.512, 79.521],
                [30.478, 79.489],
                [30.4308, 79.4312],
              ],
            },
            {
              siteId: "RS-UK-GAUCHAR-01",
              siteName: "Gauchar Airstrip Emergency Settlement",
              district: "Chamoli",
              distanceKm: 62.4,
              capacity: 12444,
              contribution: 9044,
              timeline: "CLEAR",
              roadRouteCoordinates: [
                [30.4308, 79.4312],
                [30.38, 79.35],
                [30.31, 79.22],
                [30.2883, 79.1558],
              ],
            },
          ],
        },
        {
          zoneId: "Z-KERALA-WAYANAD-01",
          zoneName: "Meppadi Chooralmala Sector, Wayanad",
          lat: 11.5367,
          lng: 76.1311,
          worstStatus: "RED",
          hazardType: "LANDSLIDE",
          population: 18200,
          totalCapacityUsed: 9777,
          isFullyAccommodated: false,
          shortfall: 8423,
          timeline: "IMMEDIATE (24h Protocol)",
          priorityScore: 0.865,
          allocations: [
            {
              siteId: "RS-KL-KALPETTA-01",
              siteName: "Kalpetta South Resettlement Enclave",
              district: "Wayanad",
              distanceKm: 14.8,
              capacity: 9777,
              contribution: 5577,
              timeline: "CLEAR",
              roadRouteCoordinates: [
                [11.5367, 76.1311],
                [11.57, 76.105],
                [11.605, 76.083],
              ],
            },
          ],
        },
      ],
      hazardHistory: [],
    };
  }
}

// Global Singleton with hot-reload prototype preservation
export const centralFallbackStore = new CentralFallbackStore();
const globalForFallback = globalThis as unknown as { centralFallbackStore?: CentralFallbackStore };
globalForFallback.centralFallbackStore = centralFallbackStore;
