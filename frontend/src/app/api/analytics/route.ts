import { NextResponse } from "next/server";
import {
  getHistoricalHazardTrendsWithStatus,
  getRecentZonesWithStatus,
  getRecentRelocationSitesWithStatus,
  getRecentRelocationPlanWithStatus,
} from "@/lib/data-service";
import { analyzeZoneDynamic } from "@/lib/analytics-engine";
import { FALLBACK_WARNING_MESSAGE } from "@/lib/central-fallback-store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zoneIdParam = searchParams.get("zoneId");
    const timeRangeParam = (searchParams.get("timeRange") || "14d").toLowerCase();

    // 1. Fetch live data with central fallback status
    const [zonesRes, sitesRes, plansRes] = await Promise.all([
      getRecentZonesWithStatus(),
      getRecentRelocationSitesWithStatus(),
      getRecentRelocationPlanWithStatus(),
    ]);

    const zones = zonesRes.data;
    const sites = sitesRes.data;
    const plans = plansRes.data;

    if (!zones || zones.length === 0) {
      return NextResponse.json(
        { error: "No monitored zones found" },
        { status: 404 }
      );
    }

    // 2. Identify target zone
    const targetZone =
      (zoneIdParam &&
        zones.find((z) => z.zoneId.toLowerCase() === zoneIdParam.toLowerCase())) ||
      zones[0];

    // 3. Fetch historical telemetry with fallback status
    const historyRes = await getHistoricalHazardTrendsWithStatus(targetZone.zoneId);
    const fullHistory = historyRes.data;

    // 4. Slicing according to selected timeRange filter
    let historySlice = fullHistory;
    let timeRangeLabel = "14-Day";

    if (timeRangeParam === "7d") {
      historySlice = fullHistory.slice(-7);
      timeRangeLabel = "7-Day";
    } else if (timeRangeParam === "14d") {
      historySlice = fullHistory.slice(-14);
      timeRangeLabel = "14-Day";
    } else if (timeRangeParam === "30d") {
      historySlice = fullHistory.slice(-30);
      timeRangeLabel = "30-Day";
    } else if (timeRangeParam === "all") {
      historySlice = fullHistory;
      timeRangeLabel = `Full History (${fullHistory.length} Days)`;
    } else {
      historySlice = fullHistory.slice(-14);
      timeRangeLabel = "14-Day";
    }

    // 5. Run Live Dynamic Mathematical & Statistical Analytics
    const report = analyzeZoneDynamic(
      targetZone,
      historySlice,
      zones,
      sites,
      plans,
      timeRangeLabel
    );

    const isFallback =
      zonesRes.isFallback || sitesRes.isFallback || plansRes.isFallback || historyRes.isFallback;

    // 6. Return dynamic payload with transparent fallback status
    return NextResponse.json({
      zone: targetZone,
      availableZones: zones.map((z) => ({
        zoneId: z.zoneId,
        name: z.name,
        color: z.zoneColor,
        worstHazard: z.worstHazard,
        worstScore: z.worstScore,
        state: z.state,
        district: z.district,
        population: z.population,
        priority: z.priority,
      })),
      history: historySlice,
      hazardRadar: report.hazardRadar,
      correlations: report.correlations,
      statistics: report.statistics,
      environmentalDrivers: report.environmentalDrivers,
      evacuationStress: report.evacuationStress,
      tacticalBriefing: report.tacticalBriefing,
      overview: report.macroOverview,
      timeRange: timeRangeLabel,
      totalHistoryDaysAvailable: fullHistory.length,
      isFallback,
      warning: isFallback ? FALLBACK_WARNING_MESSAGE : undefined,
    });
  } catch (error: any) {
    console.error("[API/Analytics] Dynamic query failed:", error);
    return NextResponse.json(
      {
        error: "ANALYTICS_FAILED",
        message: "Failed to generate analytics data",
        details: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}
