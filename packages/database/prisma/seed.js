const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Rescue Arc PostgreSQL Database on Supabase...\n");

  // 1. Seed Zones
  const zonesData = [
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
      isRedZone: true,
      zoneColor: "RED",
      worstHazard: "LANDSLIDE",
      worstScore: 0.884,
      priority: "IMMEDIATE",
      priorityScore: 0.865,
      floodScore: 0.32,
      landslideScore: 0.884,
      erosionScore: 0.0,
      cloudburstScore: 0.742,
      lastAssessedAt: new Date(),
    },
    {
      zoneId: "Z-KERALA-WAYANAD-01",
      name: "Meppadi Chooralmala Sector, Wayanad",
      state: "Kerala",
      district: "Wayanad",
      lat: 11.6854,
      lng: 76.1319,
      minLon: 76.1069,
      minLat: 11.6604,
      maxLon: 76.1569,
      maxLat: 11.7104,
      population: 16800,
      elevationM: 840,
      slopeClass: "Escarpment (>25 deg)",
      isRedZone: true,
      zoneColor: "RED",
      worstHazard: "LANDSLIDE",
      worstScore: 0.845,
      priority: "IMMEDIATE",
      priorityScore: 0.812,
      floodScore: 0.612,
      landslideScore: 0.845,
      erosionScore: 0.0,
      cloudburstScore: 0.589,
      lastAssessedAt: new Date(),
    },
    {
      zoneId: "Z-BIHAR-PATNA-01",
      name: "Patna Central Lowlands & Ganga Basin, Bihar",
      state: "Bihar",
      district: "Patna",
      lat: 25.5941,
      lng: 85.1376,
      minLon: 85.1126,
      minLat: 25.5691,
      maxLon: 85.1626,
      maxLat: 25.6191,
      population: 48500,
      elevationM: 55,
      slopeClass: "Gentle Plains (0-3 deg)",
      isRedZone: false,
      zoneColor: "YELLOW",
      worstHazard: "FLOOD",
      worstScore: 0.584,
      priority: "SHORT_TERM",
      priorityScore: 0.542,
      floodScore: 0.584,
      landslideScore: 0.12,
      erosionScore: 0.0,
      cloudburstScore: 0.31,
      lastAssessedAt: new Date(),
    },
    {
      zoneId: "Z-ASSAM-GUWAHATI-01",
      name: "Guwahati Brahmaputra Floodplain, Assam",
      state: "Assam",
      district: "Kamrup Metropolitan",
      lat: 26.1445,
      lng: 91.7362,
      minLon: 91.7112,
      minLat: 26.1195,
      maxLon: 91.7612,
      maxLat: 26.1695,
      population: 34200,
      elevationM: 52,
      slopeClass: "River Basin (0-4 deg)",
      isRedZone: false,
      zoneColor: "YELLOW",
      worstHazard: "FLOOD",
      worstScore: 0.638,
      priority: "SHORT_TERM",
      priorityScore: 0.605,
      floodScore: 0.638,
      landslideScore: 0.41,
      erosionScore: 0.28,
      cloudburstScore: 0.39,
      lastAssessedAt: new Date(),
    },
    {
      zoneId: "Z-ODISHA-PURI-01",
      name: "Puri Coastal Littoral Zone, Odisha",
      state: "Odisha",
      district: "Puri",
      lat: 19.8135,
      lng: 85.8312,
      minLon: 85.8062,
      minLat: 19.7885,
      maxLon: 85.8562,
      maxLat: 19.8385,
      population: 28000,
      elevationM: 14,
      slopeClass: "Coastal Berm (0-2 deg)",
      isRedZone: false,
      zoneColor: "GREEN",
      worstHazard: "EROSION",
      worstScore: 0.382,
      priority: "NONE",
      priorityScore: 0.0,
      floodScore: 0.28,
      landslideScore: 0.05,
      erosionScore: 0.382,
      cloudburstScore: 0.19,
      lastAssessedAt: new Date(),
    },
  ];

  for (const z of zonesData) {
    await prisma.zone.upsert({
      where: { zoneId: z.zoneId },
      update: z,
      create: z,
    });
    console.log(`✓ Seeded Zone: ${z.name}`);
  }

  // 2. Seed Relocation Sites
  const sitesData = [
    {
      siteCode: "SITE-CHAMOLI-PIPALKOTI-01",
      name: "Pipalkoti Elevated Resettlement Township",
      district: "Chamoli",
      state: "Uttarakhand",
      lat: 30.4312,
      lng: 79.4285,
      totalAreaSqm: 180000,
      usableAreaSqm: 144000,
      sphereStandardSqmPerPerson: 45.0,
      sphereCapacity: 3200, // 144,000 / 45
      currentOccupancy: 1850,
      remainingCapacity: 1350,
      waterSourceType: "Alaknanda Treated Filtration + Natural Spring Reservoir",
      roadConnectivityRating: 5,
      hospitalDistanceKm: 4.2,
      powerGridStatus: true,
      status: "ACTIVE",
    },
    {
      siteCode: "SITE-CHAMOLI-GAUCHER-02",
      name: "Gaucher Airstrip Valley Safe Zone",
      district: "Chamoli",
      state: "Uttarakhand",
      lat: 30.2925,
      lng: 79.1558,
      totalAreaSqm: 250000,
      usableAreaSqm: 202500,
      sphereStandardSqmPerPerson: 45.0,
      sphereCapacity: 4500,
      currentOccupancy: 2100,
      remainingCapacity: 2400,
      waterSourceType: "Submersible Borewells + NDRF Purifiers",
      roadConnectivityRating: 5,
      hospitalDistanceKm: 2.1,
      powerGridStatus: true,
      status: "ACTIVE",
    },
    {
      siteCode: "SITE-WAYANAD-KALPETTA-01",
      name: "Kalpetta Ridge Disaster Relief Campus",
      district: "Wayanad",
      state: "Kerala",
      lat: 11.6094,
      lng: 76.0827,
      totalAreaSqm: 210000,
      usableAreaSqm: 162000,
      sphereStandardSqmPerPerson: 45.0,
      sphereCapacity: 3600,
      currentOccupancy: 2300,
      remainingCapacity: 1300,
      waterSourceType: "Municipal Gravity Line + 200kL Storage Tanks",
      roadConnectivityRating: 5,
      hospitalDistanceKm: 3.5,
      powerGridStatus: true,
      status: "ACTIVE",
    },
    {
      siteCode: "SITE-WAYANAD-MANANTHAVADY-02",
      name: "Mananthavady Plateau Transit Site",
      district: "Wayanad",
      state: "Kerala",
      lat: 11.8028,
      lng: 76.0042,
      totalAreaSqm: 175000,
      usableAreaSqm: 135000,
      sphereStandardSqmPerPerson: 45.0,
      sphereCapacity: 3000,
      currentOccupancy: 1400,
      remainingCapacity: 1600,
      waterSourceType: "Deep Ground Aquifer + Mobile Filtration",
      roadConnectivityRating: 4,
      hospitalDistanceKm: 6.8,
      powerGridStatus: true,
      status: "ACTIVE",
    },
    {
      siteCode: "SITE-PATNA-BIHTA-01",
      name: "Bihta Elevated Dry-Ground Township",
      district: "Patna",
      state: "Bihar",
      lat: 25.5684,
      lng: 84.8712,
      totalAreaSqm: 320000,
      usableAreaSqm: 270000,
      sphereStandardSqmPerPerson: 45.0,
      sphereCapacity: 6000,
      currentOccupancy: 2900,
      remainingCapacity: 3100,
      waterSourceType: "Industrial Deep Borewells + RO Water Plant",
      roadConnectivityRating: 5,
      hospitalDistanceKm: 5.0,
      powerGridStatus: true,
      status: "ACTIVE",
    },
    {
      siteCode: "SITE-KAMRUP-MIRZA-01",
      name: "Mirza Highlands Safe Transit Hub",
      district: "Kamrup",
      state: "Assam",
      lat: 26.0824,
      lng: 91.5342,
      totalAreaSqm: 240000,
      usableAreaSqm: 180000,
      sphereStandardSqmPerPerson: 45.0,
      sphereCapacity: 4000,
      currentOccupancy: 1750,
      remainingCapacity: 2250,
      waterSourceType: "Brahmaputra Elevated Filtration Depot",
      roadConnectivityRating: 4,
      hospitalDistanceKm: 7.2,
      powerGridStatus: true,
      status: "ACTIVE",
    },
  ];

  for (const s of sitesData) {
    await prisma.relocationSite.upsert({
      where: { siteCode: s.siteCode },
      update: s,
      create: s,
    });
    console.log(`✓ Seeded Relocation Site: ${s.name} (Sphere Capacity: ${s.sphereCapacity})`);
  }

  // 3. Seed Historical Time-Series (for Analytics)
  console.log("\nSeeding 14-day historical telemetry and hazard trajectories...");
  for (const z of zonesData) {
    const isJoshimath = z.zoneId.includes("JOSHIMATH");
    const isWayanad = z.zoneId.includes("WAYANAD");
    const isPatna = z.zoneId.includes("PATNA");

    for (let idx = 0; idx < 14; idx++) {
      const factor = idx / 13;
      let flood = 0.2 + 0.1 * Math.sin(idx * 0.8);
      let landslide = 0.15 + 0.1 * Math.cos(idx * 0.5);
      let erosion = 0.0;
      let cloudburst = 0.1 + 0.1 * Math.sin(idx);
      let rainfall = 15 + idx * 4;

      if (isJoshimath) {
        landslide = 0.45 + factor * 0.43 + 0.05 * Math.sin(idx);
        cloudburst = 0.35 + factor * 0.39 + 0.08 * Math.cos(idx);
        rainfall = 20 + factor * 75;
      } else if (isWayanad) {
        landslide = 0.38 + factor * 0.46;
        flood = 0.3 + factor * 0.31;
        rainfall = 30 + factor * 120;
      } else if (isPatna) {
        flood = 0.25 + factor * 0.33 + 0.04 * Math.sin(idx);
        rainfall = 10 + factor * 35;
      }

      const worst = Math.max(flood, landslide, erosion, cloudburst);
      const color = worst >= 0.7 ? "RED" : worst >= 0.4 ? "YELLOW" : "GREEN";
      const recDate = new Date(Date.now() - (13 - idx) * 86400000);

      await prisma.hazardHistory.create({
        data: {
          zoneId: z.zoneId,
          recordedAt: recDate,
          floodScore: Number(flood.toFixed(3)),
          landslideScore: Number(landslide.toFixed(3)),
          erosionScore: Number(erosion.toFixed(3)),
          cloudburstScore: Number(cloudburst.toFixed(3)),
          worstScore: Number(worst.toFixed(3)),
          zoneColor: color,
          rainfallMm: Number(rainfall.toFixed(1)),
          riverLevelM: Number((2.1 + factor * 1.8).toFixed(2)),
          soilSaturationPct: Number((45 + factor * 42).toFixed(1)),
        },
      });
    }
  }

  console.log("\nDatabase seeding completed successfully! All locations, carrying capacities, and analytics histories are in PostgreSQL.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
