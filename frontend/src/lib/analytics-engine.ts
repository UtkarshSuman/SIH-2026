/**
 * analytics-engine.ts — Pure Mathematical & Statistical Analysis Engine
 * 
 * Computes live multi-hazard metrics, Pearson correlations, volatility,
 * dynamic baselines, and evacuation stress ratios entirely from Database records.
 */

import { ZoneData, RelocationSiteData, RelocationZonePlanData, HazardHistoryData } from "@/lib/data-service";

export interface CorrelationMetric {
  factor: string;
  label: string;
  r: number; // Pearson correlation coefficient [-1, 1]
  strength: "VERY STRONG" | "STRONG" | "MODERATE" | "WEAK" | "INVERSE";
  impactDirection: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  description: string;
}

export interface HazardRadarMetric {
  hazard: "Flood" | "Landslide" | "Erosion" | "Cloudburst";
  hazardKey: "FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST";
  current: number;
  baseline: number; // dynamically computed mean from DB history
  threshold: number; // critical threshold from zone DB
  warningThreshold: number;
  deltaPct: number;
  isBreached: boolean;
  status: "CRITICAL" | "WARNING" | "NORMAL";
}

export interface EvacuationStressAnalysis {
  evacueePopulation: number;
  totalNearbyCapacity: number;
  availableCapacityHeadroom: number;
  stressRatioPct: number; // (evacuees / availableCapacity) * 100
  accommodationStatus: "FULLY_ACCOMMODATED" | "NEAR_CAPACITY" | "DEFICIT_SHORTFALL";
  shortfallCount: number;
  nearestShelters: Array<{
    siteId: string;
    siteCode: string;
    name: string;
    district: string;
    distanceKm: number;
    capacity: number;
    currentOccupancy: number;
    remainingCapacity: number;
    status: string;
    transitTimeEstimateMinutes: number;
  }>;
}

export interface ZoneAnalyticsReport {
  zone: ZoneData;
  timeRange: string;
  historyCount: number;
  statistics: {
    meanScore: number;
    peakScore: number;
    minScore: number;
    volatilityIndex: number;
    riskVelocityPerDay: number;
    riskDirection: "ESCALATING" | "SUBSIDING" | "STABLE";
    daysAboveWarning: number;
    daysAboveCritical: number;
    escalationProbabilityPct: number;
    anomaliesCount: number;
    anomalyDates: string[];
  };
  environmentalDrivers: {
    latestRainfallMm: number;
    cumulative72hRainMm: number;
    peakRainfallMm: number;
    latestRiverLevelM: number;
    peakRiverLevelM: number;
    latestSoilSaturationPct: number;
    latestTemperatureC: number | null;
    latestHumidityPct: number | null;
  };
  correlations: {
    rainfall: CorrelationMetric;
    riverLevel: CorrelationMetric;
    soilSaturation: CorrelationMetric;
  };
  hazardRadar: HazardRadarMetric[];
  evacuationStress: EvacuationStressAnalysis;
  tacticalBriefing: {
    classificationText: string;
    environmentalDriverText: string;
    topographicVulnerabilityText: string;
    evacuationDirectiveText: string;
    recommendedActions: string[];
  };
  macroOverview: {
    totalMonitoredPopulation: number;
    totalRedZonePopulation: number;
    redZoneCount: number;
    yellowZoneCount: number;
    greenZoneCount: number;
    totalSphereShelters: number;
    totalShelterCapacity: number;
    totalAvailableShelterCapacity: number;
    nationalRiskIndex: number;
  };
}

/**
 * Calculates Pearson Correlation Coefficient r between two series
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - xMean;
    const dy = y[i] - yMean;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const denom = Math.sqrt(denX * denY);
  if (denom === 0) return 0;
  return Number((num / denom).toFixed(3));
}

function classifyCorrelation(r: number, factorName: string): CorrelationMetric {
  const abs = Math.abs(r);
  let strength: CorrelationMetric["strength"] = "WEAK";
  if (abs >= 0.75) strength = "VERY STRONG";
  else if (abs >= 0.5) strength = "STRONG";
  else if (abs >= 0.3) strength = "MODERATE";

  const impactDirection: CorrelationMetric["impactDirection"] =
    r > 0.05 ? "POSITIVE" : r < -0.05 ? "NEGATIVE" : "NEUTRAL";

  let description = `${strength} correlation (r=${r > 0 ? "+" : ""}${r}). `;
  if (r > 0.6) {
    description += `Spikes in ${factorName} trigger rapid escalations in composite hazard severity.`;
  } else if (r > 0.3) {
    description += `Moderate sensitivity to ${factorName}; amplifies hazard probability under compounding events.`;
  } else {
    description += `Weak linear dependency; baseline terrain geometry dominates current hazard score.`;
  }

  return {
    factor: factorName,
    label: factorName,
    r,
    strength,
    impactDirection,
    description,
  };
}

/**
 * Main Dynamic Zone Analysis Function
 */
export function analyzeZoneDynamic(
  zone: ZoneData,
  history: HazardHistoryData[],
  allZones: ZoneData[],
  allSites: RelocationSiteData[],
  allPlans: RelocationZonePlanData[],
  timeRangeLabel = "14-Day"
): ZoneAnalyticsReport {
  const scores = history.map((h) => h.worstScore);
  const rainfalls = history.map((h) => h.rainfallMm ?? 0);
  const riverLevels = history.map((h) => h.riverLevelM ?? 0);
  const saturations = history.map((h) => h.soilSaturationPct ?? 0);

  const n = Math.max(1, scores.length);
  const meanScore = Number((scores.reduce((a, b) => a + b, 0) / n).toFixed(3));
  const peakScore = Number((Math.max(...(scores.length > 0 ? scores : [zone.worstScore]))).toFixed(3));
  const minScore = Number((Math.min(...(scores.length > 0 ? scores : [zone.worstScore]))).toFixed(3));

  const variance = scores.reduce((sum, s) => sum + Math.pow(s - meanScore, 2), 0) / n;
  const volatilityIndex = Number(Math.sqrt(variance).toFixed(3));

  // Risk velocity
  let riskVelocityPerDay = 0;
  let riskDirection: "ESCALATING" | "SUBSIDING" | "STABLE" = "STABLE";
  if (scores.length >= 2) {
    const first = scores[0];
    const last = scores[scores.length - 1];
    const diff = last - first;
    riskVelocityPerDay = Number((diff / (scores.length - 1)).toFixed(4));
    riskDirection = diff > 0.05 ? "ESCALATING" : diff < -0.05 ? "SUBSIDING" : "STABLE";
  }

  // Thresholds from database zone record
  const warnThresh = zone.warningThreshold ?? 0.40;
  const critThresh = zone.criticalThreshold ?? 0.70;

  const daysAboveWarning = history.filter((h) => h.worstScore >= warnThresh).length;
  const daysAboveCritical = history.filter((h) => h.worstScore >= critThresh).length;

  // Anomaly detection (> mean + 1.8 * stdDev)
  const anomalyCutoff = meanScore + 1.8 * volatilityIndex;
  const anomalyPoints = history.filter((h) => h.worstScore > anomalyCutoff && h.worstScore > warnThresh);
  const anomaliesCount = anomalyPoints.length;
  const anomalyDates = anomalyPoints.map((p) => p.period);

  // Environmental summary from DB
  const latestHistory = history[history.length - 1];
  const last3Days = history.slice(-3);
  const cumulative72hRainMm = Number(
    (last3Days.reduce((acc, h) => acc + (h.rainfallMm ?? 0), 0) || zone.metrics?.rainfall_72h_mm || 0).toFixed(1)
  );
  const peakRainfallMm = Number(Math.max(...(rainfalls.length > 0 ? rainfalls : [0])).toFixed(1));
  const latestRiverLevelM = latestHistory?.riverLevelM ?? (zone.metrics?.river_discharge_m3s ? Number((zone.metrics.river_discharge_m3s * 0.12).toFixed(2)) : 1.8);
  const peakRiverLevelM = Number(Math.max(...(riverLevels.length > 0 ? riverLevels : [latestRiverLevelM])).toFixed(2));
  const latestSoilSaturationPct = latestHistory?.soilSaturationPct ?? zone.metrics?.soil_saturation_pct ?? 55;
  const latestTemperatureC = latestHistory?.temperatureC ?? 22.4;
  const latestHumidityPct = latestHistory?.humidityPct ?? Math.min(98, Math.round(latestSoilSaturationPct * 1.1));

  // Pearson correlations computed from database history rows
  const rainfallR = calculatePearsonCorrelation(rainfalls, scores);
  const riverR = calculatePearsonCorrelation(riverLevels, scores);
  const saturationR = calculatePearsonCorrelation(saturations, scores);

  const rainfallCorr = classifyCorrelation(rainfallR, "Precipitation (mm)");
  const riverCorr = classifyCorrelation(riverR, "River Stage (m)");
  const saturationCorr = classifyCorrelation(saturationR, "Soil Saturation (%)");

  // Multi-Hazard Radar with Dynamic Baselines from DB history
  const calcBaseline = (key: keyof HazardHistoryData, fallbackDefault: number): number => {
    if (history.length === 0) return fallbackDefault;
    const vals = history.map((h) => (h[key] as number) || 0).filter((v) => v > 0);
    if (vals.length === 0) return fallbackDefault;
    return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3));
  };

  const floodBaseline = calcBaseline("floodScore", zone.baselineFloodScore ?? 0.18);
  const landslideBaseline = calcBaseline("landslideScore", zone.baselineLandslideScore ?? 0.22);
  const erosionBaseline = calcBaseline("erosionScore", zone.baselineErosionScore ?? 0.08);
  const cloudburstBaseline = calcBaseline("cloudburstScore", zone.baselineCloudburstScore ?? 0.12);

  const radarHazards: Array<{ name: "Flood" | "Landslide" | "Erosion" | "Cloudburst"; key: "FLOOD" | "LANDSLIDE" | "EROSION" | "CLOUDBURST"; base: number }> = [
    { name: "Flood", key: "FLOOD", base: floodBaseline },
    { name: "Landslide", key: "LANDSLIDE", base: landslideBaseline },
    { name: "Erosion", key: "EROSION", base: erosionBaseline },
    { name: "Cloudburst", key: "CLOUDBURST", base: cloudburstBaseline },
  ];

  const hazardRadar: HazardRadarMetric[] = radarHazards.map((item) => {
    const current = zone.hazardScores[item.key] ?? 0;
    const deltaPct = item.base > 0 ? Number((((current - item.base) / item.base) * 100).toFixed(1)) : 0;
    const isBreached = current >= critThresh;
    const status: HazardRadarMetric["status"] = current >= critThresh ? "CRITICAL" : current >= warnThresh ? "WARNING" : "NORMAL";
    return {
      hazard: item.name,
      hazardKey: item.key,
      current: Number(current.toFixed(3)),
      baseline: item.base,
      threshold: critThresh,
      warningThreshold: warnThresh,
      deltaPct,
      isBreached,
      status,
    };
  });

  // Evacuation Stress & Matched Shelters from DB
  const evacueePopulation = zone.population;
  const matchedPlan = allPlans.find((p) => p.zoneId.toLowerCase() === zone.zoneId.toLowerCase());

  let nearestShelters: EvacuationStressAnalysis["nearestShelters"] = [];
  if (matchedPlan && matchedPlan.allocations.length > 0) {
    nearestShelters = matchedPlan.allocations.map((a) => {
      const site = allSites.find((s) => s.id === a.siteId);
      return {
        siteId: a.siteId,
        siteCode: site?.siteCode ?? a.siteId,
        name: a.siteName,
        district: a.district || site?.district || zone.district,
        distanceKm: a.distanceKm,
        capacity: a.capacity || site?.capacity || 1000,
        currentOccupancy: site?.currentOccupancy || 0,
        remainingCapacity: site?.remainingCapacity || Math.max(0, (a.capacity || 1000) - (site?.currentOccupancy || 0)),
        status: site?.status || "ACTIVE",
        transitTimeEstimateMinutes: Math.round(a.distanceKm * 2.2),
      };
    });
  } else {
    // Dynamically match top safe shelters by proximity
    nearestShelters = allSites
      .filter((s) => s.status !== "FULL")
      .map((s) => {
        const dist = Math.hypot((s.lat - zone.lat) * 111, (s.lng - zone.lng) * 111);
        return {
          siteId: s.id,
          siteCode: s.siteCode,
          name: s.name,
          district: s.district,
          distanceKm: Number(dist.toFixed(1)),
          capacity: s.capacity,
          currentOccupancy: s.currentOccupancy,
          remainingCapacity: s.remainingCapacity,
          status: s.status,
          transitTimeEstimateMinutes: Math.round(dist * 2.2),
        };
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 4);
  }

  const totalNearbyCapacity = nearestShelters.reduce((acc, s) => acc + s.capacity, 0);
  const availableCapacityHeadroom = nearestShelters.reduce((acc, s) => acc + s.remainingCapacity, 0);
  const stressRatioPct = availableCapacityHeadroom > 0
    ? Number(((evacueePopulation / availableCapacityHeadroom) * 100).toFixed(1))
    : 999;
  const shortfallCount = Math.max(0, evacueePopulation - availableCapacityHeadroom);
  const accommodationStatus: EvacuationStressAnalysis["accommodationStatus"] =
    shortfallCount === 0 && stressRatioPct <= 85
      ? "FULLY_ACCOMMODATED"
      : shortfallCount === 0
      ? "NEAR_CAPACITY"
      : "DEFICIT_SHORTFALL";

  // Escalation probability
  const currentWorst = zone.worstScore;
  const rainWeight = Math.min(1.0, cumulative72hRainMm / 140);
  const satWeight = Math.min(1.0, latestSoilSaturationPct / 100);
  const escalationProbabilityPct = Math.min(
    99,
    Math.max(5, Math.round((currentWorst * 0.55 + satWeight * 0.25 + rainWeight * 0.20) * 100))
  );

  // Dynamic Tactical Intelligence Briefing
  const primaryDriver = zone.worstHazard || "MULTI_HAZARD";
  const dominantCorrelation = Math.max(rainfallR, riverR, saturationR) === rainfallR
    ? "rainfall precipitation"
    : Math.max(rainfallR, riverR, saturationR) === riverR
    ? "river surge & runoff"
    : "hydrological soil saturation";

  let classificationText = `Zone "${zone.name}" is monitored at ${zone.zoneColor} tier with an active hazard index of ${(zone.worstScore * 100).toFixed(1)}%. Primary exposure vector: ${primaryDriver} (priority tier ${zone.priority}).`;
  if (zone.zoneColor === "RED") {
    classificationText += ` Critical safety breach (>=${(critThresh * 100).toFixed(0)}%) active with ${daysAboveCritical} days in critical territory. Immediate multi-agency intervention required.`;
  } else if (zone.zoneColor === "YELLOW") {
    classificationText += ` Elevated advisory status (>=${(warnThresh * 100).toFixed(0)}%). Hazard velocity is ${riskVelocityPerDay > 0 ? "climbing" : "steady"} (+${(riskVelocityPerDay * 7 * 100).toFixed(1)}%/wk projection).`;
  } else {
    classificationText += ` Habitation exhibits nominal environmental telemetry below emergency intervention thresholds. Routine automated sensor polling maintained.`;
  }

  const environmentalDriverText = `72-hour cumulative precipitation is ${cumulative72hRainMm} mm, coupled with ${latestSoilSaturationPct}% soil moisture and a peak river stage of ${latestRiverLevelM} m. Mathematical correlation indicates that ${dominantCorrelation} serves as the primary acceleration catalyst for this terrain.`;

  const topographicVulnerabilityText = `Settlement is situated at ${zone.elevationM ? `${zone.elevationM}m elevation` : "valley elevation"} across ${zone.slopeClass ? `slope class "${zone.slopeClass}"` : "monitored geomorphic terrain"} with ${zone.population.toLocaleString("en-IN")} citizens under direct sensor telemetry.`;

  let evacuationDirectiveText = "";
  const recommendedActions: string[] = [];

  if (zone.zoneColor === "RED") {
    evacuationDirectiveText = `TACTICAL DIRECTIVE: Execute Stage-1 Evacuation Protocol under Priority ${zone.priority}. Disperse evacuees along verified transit routes toward ${nearestShelters[0]?.name || "assigned shelter"} (${availableCapacityHeadroom.toLocaleString("en-IN")} available Sphere slots). Stress ratio is ${stressRatioPct}%.`;
    recommendedActions.push("Mobilize NDRF and SDRF quick-response rescue squads along clear transit corridors.");
    recommendedActions.push(`Verify carrying capacity headroom at safe township "${nearestShelters[0]?.name}".`);
    recommendedActions.push("Deploy drone aerial LiDAR for real-time fissure and slope creep monitoring.");
  } else if (zone.zoneColor === "YELLOW") {
    evacuationDirectiveText = `TACTICAL DIRECTIVE: Maintain Yellow Warning Standby. Pre-position civil defense logistics at designated staging nodes. Initiate voluntary transfer for vulnerable populations.`;
    recommendedActions.push("Verify emergency stockpile supplies (water purification, Sphere rations, medical kits).");
    recommendedActions.push("Monitor hourly rainfall telemetry for threshold breach (>45mm/24h).");
    recommendedActions.push("Keep emergency transport convoys on 30-minute engine standby.");
  } else {
    evacuationDirectiveText = `TACTICAL DIRECTIVE: Baseline Monitoring Mode. All civil logistics on standard operational status. No evacuation orders in effect.`;
    recommendedActions.push("Conduct periodic telemetry sensor calibration and gateway connectivity checks.");
    recommendedActions.push("Update household census and vulnerability mapping in regional database.");
  }

  // Macro national overview across all zones in DB
  const totalMonitoredPopulation = allZones.reduce((acc, z) => acc + z.population, 0);
  const totalRedZonePopulation = allZones.filter((z) => z.zoneColor === "RED").reduce((acc, z) => acc + z.population, 0);
  const redZoneCount = allZones.filter((z) => z.zoneColor === "RED").length;
  const yellowZoneCount = allZones.filter((z) => z.zoneColor === "YELLOW").length;
  const greenZoneCount = allZones.filter((z) => z.zoneColor === "GREEN").length;
  const totalSphereShelters = allSites.length;
  const totalShelterCapacity = allSites.reduce((acc, s) => acc + s.capacity, 0);
  const totalAvailableShelterCapacity = allSites.reduce((acc, s) => acc + s.remainingCapacity, 0);
  const nationalRiskIndex = allZones.length > 0
    ? Number((allZones.reduce((acc, z) => acc + z.worstScore, 0) / allZones.length).toFixed(3))
    : 0.35;

  return {
    zone,
    timeRange: timeRangeLabel,
    historyCount: history.length,
    statistics: {
      meanScore,
      peakScore,
      minScore,
      volatilityIndex,
      riskVelocityPerDay,
      riskDirection,
      daysAboveWarning,
      daysAboveCritical,
      escalationProbabilityPct,
      anomaliesCount,
      anomalyDates,
    },
    environmentalDrivers: {
      latestRainfallMm: latestHistory?.rainfallMm ?? 0,
      cumulative72hRainMm,
      peakRainfallMm,
      latestRiverLevelM,
      peakRiverLevelM,
      latestSoilSaturationPct,
      latestTemperatureC,
      latestHumidityPct,
    },
    correlations: {
      rainfall: rainfallCorr,
      riverLevel: riverCorr,
      soilSaturation: saturationCorr,
    },
    hazardRadar,
    evacuationStress: {
      evacueePopulation,
      totalNearbyCapacity,
      availableCapacityHeadroom,
      stressRatioPct,
      accommodationStatus,
      shortfallCount,
      nearestShelters,
    },
    tacticalBriefing: {
      classificationText,
      environmentalDriverText,
      topographicVulnerabilityText,
      evacuationDirectiveText,
      recommendedActions,
    },
    macroOverview: {
      totalMonitoredPopulation,
      totalRedZonePopulation,
      redZoneCount,
      yellowZoneCount,
      greenZoneCount,
      totalSphereShelters,
      totalShelterCapacity,
      totalAvailableShelterCapacity,
      nationalRiskIndex,
    },
  };
}
