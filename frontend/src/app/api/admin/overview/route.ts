import { NextResponse } from "next/server";
import {
  getRecentZonesWithStatus,
  getRecentRelocationSitesWithStatus,
} from "@/lib/data-service";
import { centralFallbackStore } from "@/lib/central-fallback-store";

export async function GET() {
  try {
    const [zonesRes, sitesRes] = await Promise.all([
      getRecentZonesWithStatus(),
      getRecentRelocationSitesWithStatus(),
    ]);

    const zones = zonesRes.data;
    const sites = sitesRes.data;

    // Calculate aggregated statistics
    const highRisk = zones.filter((z) => z.zoneColor === "RED").length;
    const moderateRisk = zones.filter((z) => z.zoneColor === "YELLOW").length;
    const lowRisk = zones.filter((z) => z.zoneColor === "GREEN").length;
    const affectedPeople = zones
      .filter((z) => z.zoneColor === "RED" || z.zoneColor === "YELLOW")
      .reduce((sum, z) => sum + (z.population || 0), 0);
    const totalShelterCapacity = sites.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const totalCurrentOccupancy = sites.reduce((sum, s) => sum + (s.currentOccupancy || 0), 0);

    const stats = {
      totalZones: zones.length,
      highRiskZones: highRisk,
      moderateRiskZones: moderateRisk,
      lowRiskZones: lowRisk,
      affectedPeople,
      totalShelterCapacity,
      totalCurrentOccupancy,
      availableShelterCapacity: Math.max(0, totalShelterCapacity - totalCurrentOccupancy),
    };

    const isFallback = Boolean(zonesRes.isFallback || sitesRes.isFallback);

    return NextResponse.json({
      zones,
      sites,
      stats,
      isFallback,
      source: isFallback ? "CENTRAL_FALLBACK_STORE" : "DATABASE",
      warning: isFallback ? "Database or backend offline using internal latest data." : undefined,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[API Admin Overview] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load admin overview" },
      { status: 500 }
    );
  }
}
