import { NextResponse } from "next/server";
import { getHistoricalHazardTrends, getRecentZones, getRecentRelocationSites } from "@/lib/data-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zoneId = searchParams.get("zoneId") || "Z-UTTARAKHAND-JOSHIMATH-01";

  const zones = await getRecentZones();
  const sites = await getRecentRelocationSites();
  const targetZone = zones.find((z) => z.zoneId === zoneId) || zones[0];
  const history = getHistoricalHazardTrends(targetZone.zoneId);

  // Summary analytics
  const totalMonitoredPopulation = zones.reduce((acc, z) => acc + z.population, 0);
  const totalRedZonePopulation = zones
    .filter((z) => z.zoneColor === "RED")
    .reduce((acc, z) => acc + z.population, 0);
  const totalSphereCapacity = sites.reduce((acc, s) => acc + s.capacity, 0);
  const totalAvailableCapacity = sites.reduce((acc, s) => acc + s.remainingCapacity, 0);

  // Multi-hazard breakdown for the target zone
  const hazardRadar = [
    { hazard: "Flood", current: targetZone.hazardScores.FLOOD, baseline: 0.25, threshold: 0.7 },
    { hazard: "Landslide", current: targetZone.hazardScores.LANDSLIDE, baseline: 0.35, threshold: 0.7 },
    { hazard: "Erosion", current: targetZone.hazardScores.EROSION, baseline: 0.1, threshold: 0.7 },
    { hazard: "Cloudburst", current: targetZone.hazardScores.CLOUDBURST, baseline: 0.2, threshold: 0.7 },
  ];

  return NextResponse.json({
    zone: targetZone,
    availableZones: zones.map((z) => ({ zoneId: z.zoneId, name: z.name, color: z.zoneColor, state: z.state })),
    history,
    hazardRadar,
    overview: {
      totalMonitoredPopulation,
      totalRedZonePopulation,
      totalSphereCapacity,
      totalAvailableCapacity,
      redZoneCount: zones.filter((z) => z.zoneColor === "RED").length,
      yellowZoneCount: zones.filter((z) => z.zoneColor === "YELLOW").length,
      greenZoneCount: zones.filter((z) => z.zoneColor === "GREEN").length,
      shelterCount: sites.length,
    },
  });
}
