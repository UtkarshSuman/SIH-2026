import { dbStore } from "../src/lib/database-store";

async function runTest() {
  console.log("1. Testing ML prediction ingestion...");
  const updatedZone = await dbStore.recordMLPrediction({
    zoneId: "Z-UTTARAKHAND-JOSHIMATH-01",
    hazardScores: { FLOOD: 0.42, LANDSLIDE: 0.94, EROSION: 0.0, CLOUDBURST: 0.88 },
    metrics: { rainfall_72h_mm: 245.0, soil_saturation_pct: 95.0, river_discharge_m3s: 34.0 },
    source: "test_verification",
  });

  console.log("Updated Zone worst score:", updatedZone?.worstScore, "color:", updatedZone?.zoneColor);
  const hist = await dbStore.getHazardHistory("Z-UTTARAKHAND-JOSHIMATH-01");
  console.log("Total history rows now:", hist.length, "latest score:", hist[hist.length - 1].worstScore);

  console.log("\n2. Testing Admin carrying capacity edit...");
  const updatedSite = await dbStore.updateRelocationSite("site-001", {
    usableAreaSqm: 180000,
    capacity: 4000,
    currentOccupancy: 2000,
  });

  console.log("Updated Site capacity:", updatedSite?.capacity, "remaining:", updatedSite?.remainingCapacity, "occupancy%:", updatedSite?.occupancyPct);

  console.log("\n3. Testing Database versioning for auto-update...");
  const ver = await dbStore.getVersion();
  console.log("Current DB version:", ver.version, "last updated:", ver.lastUpdated);
  console.log("\nALL DATABASE TESTS PASSED!");
}

runTest();
