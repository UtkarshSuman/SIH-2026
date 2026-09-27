const { prisma } = require('@sih/database');

async function main() {
  console.log('Connecting to database...');
  try {
    const dbInfo = await prisma.$queryRawUnsafe('SELECT current_database(), now()');
    console.log('Database connected successfully:', dbInfo);

    const columnsToAdd = [
      'ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "baselineFloodScore" DOUBLE PRECISION DEFAULT 0.18',
      'ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "baselineLandslideScore" DOUBLE PRECISION DEFAULT 0.22',
      'ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "baselineErosionScore" DOUBLE PRECISION DEFAULT 0.08',
      'ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "baselineCloudburstScore" DOUBLE PRECISION DEFAULT 0.12',
      'ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "criticalThreshold" DOUBLE PRECISION DEFAULT 0.70',
      'ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "warningThreshold" DOUBLE PRECISION DEFAULT 0.40',
      'ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "modelName" TEXT DEFAULT \'Multi-Hazard Ensemble RF-v4.2\'',
      'ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "modelVersion" TEXT DEFAULT \'v4.2.1-prod\'',
      'ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "confidenceScore" DOUBLE PRECISION DEFAULT 0.91',
      'ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "sensorNodeCount" INT DEFAULT 16',
      'ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "riskVelocity" DOUBLE PRECISION DEFAULT 0.0',
      'ALTER TABLE "Zone" ADD COLUMN IF NOT EXISTS "evacuationReadinessPct" DOUBLE PRECISION DEFAULT 85.0',
    ];

    for (const sql of columnsToAdd) {
      console.log('Executing:', sql);
      await prisma.$executeRawUnsafe(sql);
    }
    console.log('ALL MISSING COLUMNS SUCCESSFULLY ADDED TO "Zone" TABLE IN SUPABASE!');

    // Also check ZoneAnalytics table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public."ZoneAnalytics" (
        id TEXT PRIMARY KEY,
        "zoneId" TEXT UNIQUE NOT NULL REFERENCES public."Zone"("zoneId") ON DELETE CASCADE,
        "meanWorstScore" DOUBLE PRECISION DEFAULT 0.0,
        "peakWorstScore" DOUBLE PRECISION DEFAULT 0.0,
        "volatilityIndex" DOUBLE PRECISION DEFAULT 0.0,
        "rainfallCorrelation" DOUBLE PRECISION DEFAULT 0.0,
        "riverCorrelation" DOUBLE PRECISION DEFAULT 0.0,
        "saturationCorrelation" DOUBLE PRECISION DEFAULT 0.0,
        "primaryHazardDriver" "HazardType",
        "secondaryHazardDriver" "HazardType",
        "escalationProbabilityPct" DOUBLE PRECISION DEFAULT 0.0,
        "daysAboveWarning" INT DEFAULT 0,
        "daysAboveCritical" INT DEFAULT 0,
        "anomaliesDetectedCount" INT DEFAULT 0,
        "recommendedShelters" JSONB,
        "generatedBriefing" TEXT,
        "updatedAt" TIMESTAMPTZ DEFAULT now()
      )
    `);
    console.log('ZoneAnalytics table checked/created!');

    // Test zone query
    const zones = await prisma.zone.findMany({ take: 3 });
    console.log('Successfully queried zones from database! Count:', zones.length);
  } catch (err) {
    console.error('Error executing database migration:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
