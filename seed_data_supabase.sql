-- ====================================================================
-- RESCUE ARC - MASTER SUPABASE DATABASE SEED & DYNAMIC SCHEMA SCRIPT
-- Problem SIH 26191: Multi-Hazard Red Zone Prediction & Relocation DSS
-- Run this directly in the Supabase SQL Editor to populate live data.
-- ====================================================================

-- 0. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Create Enums if they do not exist
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'DEPARTMENT_OFFICIAL', 'ADMIN', 'SUPER_ADMIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "HazardType" AS ENUM ('FLOOD', 'LANDSLIDE', 'EROSION', 'CLOUDBURST');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ZoneColor" AS ENUM ('RED', 'YELLOW', 'GREEN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PriorityTier" AS ENUM ('IMMEDIATE', 'SHORT_TERM', 'MEDIUM_TERM', 'NONE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "DataQuality" AS ENUM ('RAW', 'IMPUTED', 'STALE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "RelocationSiteStatus" AS ENUM ('ACTIVE', 'PLANNED', 'FULL', 'MAINTENANCE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "RouteStatus" AS ENUM ('CLEAR', 'CONGESTED', 'BLOCKED', 'HAZARDOUS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Core GIS & PostGIS Tables (habitations & regions)
CREATE TABLE IF NOT EXISTS public.regions (
    region_id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE,
    display_name TEXT NOT NULL,
    hazard_types TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.habitations (
    id SERIAL PRIMARY KEY,
    source_id TEXT UNIQUE,
    name TEXT NOT NULL,
    region_id INT REFERENCES public.regions(region_id) ON UPDATE NO ACTION,
    geom geometry(Point, 4326),
    zone_class TEXT,
    hazard_prob DOUBLE PRECISION,
    evacuees INT DEFAULT 0,
    timeline TEXT,
    slope_class TEXT,
    rainfall_mm DOUBLE PRECISION,
    discharge_cumecs DOUBLE PRECISION,
    dist_river_m DOUBLE PRECISION,
    isolation_index DOUBLE PRECISION,
    dest_id INT REFERENCES public.habitations(id) ON UPDATE NO ACTION,
    alert_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure habitations check constraint allows case-flexible zone classes
DO $$
BEGIN
    ALTER TABLE public.habitations DROP CONSTRAINT IF EXISTS habitations_zone_class_check;
    ALTER TABLE public.habitations ADD CONSTRAINT habitations_zone_class_check 
        CHECK (lower(zone_class) IN ('red', 'yellow', 'green', 'safe'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Prisma Application Tables
CREATE TABLE IF NOT EXISTS public."Zone" (
    id TEXT PRIMARY KEY,
    "zoneId" TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    "minLon" DOUBLE PRECISION,
    "minLat" DOUBLE PRECISION,
    "maxLon" DOUBLE PRECISION,
    "maxLat" DOUBLE PRECISION,
    population INT DEFAULT 0,
    "householdCount" INT,
    "elevationM" DOUBLE PRECISION,
    "slopeClass" TEXT,
    "isRedZone" BOOLEAN DEFAULT false,
    "zoneColor" "ZoneColor" DEFAULT 'GREEN',
    "worstHazard" "HazardType",
    "worstScore" DOUBLE PRECISION DEFAULT 0.0,
    priority "PriorityTier" DEFAULT 'NONE',
    "priorityScore" DOUBLE PRECISION DEFAULT 0.0,
    "floodScore" DOUBLE PRECISION DEFAULT 0.0,
    "landslideScore" DOUBLE PRECISION DEFAULT 0.0,
    "erosionScore" DOUBLE PRECISION DEFAULT 0.0,
    "cloudburstScore" DOUBLE PRECISION DEFAULT 0.0,
    "lastAssessedAt" TIMESTAMPTZ DEFAULT now(),
    "isStale" BOOLEAN DEFAULT false,
    "baselineFloodScore" DOUBLE PRECISION DEFAULT 0.18,
    "baselineLandslideScore" DOUBLE PRECISION DEFAULT 0.22,
    "baselineErosionScore" DOUBLE PRECISION DEFAULT 0.08,
    "baselineCloudburstScore" DOUBLE PRECISION DEFAULT 0.12,
    "criticalThreshold" DOUBLE PRECISION DEFAULT 0.70,
    "warningThreshold" DOUBLE PRECISION DEFAULT 0.40,
    "modelName" TEXT DEFAULT 'Multi-Hazard Ensemble RF-v4.2',
    "modelVersion" TEXT DEFAULT 'v4.2.1-prod',
    "confidenceScore" DOUBLE PRECISION DEFAULT 0.91,
    "sensorNodeCount" INT DEFAULT 16,
    "riskVelocity" DOUBLE PRECISION DEFAULT 0.0,
    "evacuationReadinessPct" DOUBLE PRECISION DEFAULT 85.0,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

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
);

CREATE TABLE IF NOT EXISTS public."StaticZoneField" (
    id TEXT PRIMARY KEY,
    "zoneId" TEXT NOT NULL REFERENCES public."Zone"("zoneId") ON DELETE CASCADE,
    "fieldName" TEXT NOT NULL,
    value DOUBLE PRECISION,
    source TEXT NOT NULL,
    "ingestedAt" TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT "StaticZoneField_zoneId_fieldName_key" UNIQUE ("zoneId", "fieldName")
);

CREATE TABLE IF NOT EXISTS public."HazardReading" (
    id TEXT PRIMARY KEY,
    "zoneId" TEXT NOT NULL REFERENCES public."Zone"("zoneId") ON DELETE CASCADE,
    "hazardType" "HazardType" NOT NULL,
    source TEXT NOT NULL,
    "recordedAt" TIMESTAMPTZ DEFAULT now(),
    "dataQuality" "DataQuality" DEFAULT 'RAW',
    parameters JSONB NOT NULL,
    "imputedFields" TEXT[] DEFAULT '{}',
    "droppedFields" TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public."HazardHistory" (
    id TEXT PRIMARY KEY,
    "zoneId" TEXT NOT NULL REFERENCES public."Zone"("zoneId") ON DELETE CASCADE,
    "recordedAt" TIMESTAMPTZ DEFAULT now(),
    "floodScore" DOUBLE PRECISION NOT NULL,
    "landslideScore" DOUBLE PRECISION NOT NULL,
    "erosionScore" DOUBLE PRECISION NOT NULL,
    "cloudburstScore" DOUBLE PRECISION NOT NULL,
    "worstScore" DOUBLE PRECISION NOT NULL,
    "zoneColor" "ZoneColor" NOT NULL,
    "rainfallMm" DOUBLE PRECISION,
    "riverLevelM" DOUBLE PRECISION,
    "temperatureC" DOUBLE PRECISION,
    "soilSaturationPct" DOUBLE PRECISION,
    "dischargeCumecs" DOUBLE PRECISION,
    "humidityPct" DOUBLE PRECISION,
    "windSpeedKmh" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS public."RelocationSite" (
    id TEXT PRIMARY KEY,
    "siteCode" TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    "totalAreaSqm" DOUBLE PRECISION NOT NULL,
    "usableAreaSqm" DOUBLE PRECISION NOT NULL,
    "sphereStandardSqmPerPerson" DOUBLE PRECISION DEFAULT 45.0,
    "sphereCapacity" INT NOT NULL,
    "currentOccupancy" INT DEFAULT 0,
    "remainingCapacity" INT NOT NULL,
    "waterSourceType" TEXT,
    "roadConnectivityRating" INT DEFAULT 4,
    "hospitalDistanceKm" DOUBLE PRECISION,
    "powerGridStatus" BOOLEAN DEFAULT true,
    status "RelocationSiteStatus" DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."RelocationPlan" (
    id TEXT PRIMARY KEY,
    "zoneId" TEXT UNIQUE NOT NULL REFERENCES public."Zone"("zoneId") ON DELETE CASCADE,
    "totalEvacuees" INT NOT NULL,
    timeline TEXT NOT NULL,
    shortfall INT DEFAULT 0,
    "isFullyAccommodated" BOOLEAN DEFAULT true,
    "priorityRank" INT DEFAULT 1,
    notes TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT now(),
    "updatedAt" TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public."RelocationAllocation" (
    id TEXT PRIMARY KEY,
    "planId" TEXT NOT NULL REFERENCES public."RelocationPlan"(id) ON DELETE CASCADE,
    "siteId" TEXT NOT NULL REFERENCES public."RelocationSite"(id) ON DELETE CASCADE,
    "allocatedPopulation" INT NOT NULL,
    "distanceKm" DOUBLE PRECISION NOT NULL,
    "roadRouteCoordinates" JSONB,
    "routeStatus" "RouteStatus" DEFAULT 'CLEAR',
    "estimatedTransitHours" DOUBLE PRECISION
);

-- ====================================================================
-- AUTO-SYNC SEQUENCES TO PREVENT UNIQUE CONSTRAINT VIOLATIONS
-- ====================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'regions_region_id_seq') THEN
        PERFORM setval('regions_region_id_seq', (SELECT COALESCE(MAX(region_id), 0) + 1 FROM public.regions), false);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'habitations_id_seq') THEN
        PERFORM setval('habitations_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM public.habitations), false);
    END IF;
END $$;

-- ====================================================================
-- POPULATE DATA (SAFE UPSERTS WITHOUT HARDCODED SERIAL PRIMARY KEYS)
-- ====================================================================

-- 4. Insert Regions (Omitting serial region_id to avoid key conflict)
INSERT INTO public.regions (slug, display_name, hazard_types)
VALUES
('uttarakhand-himalayas', 'Uttarakhand Himalayan Foothills (Chamoli, Joshimath, Kedarnath)', ARRAY['LANDSLIDE', 'CLOUDBURST', 'FLOOD']),
('kerala-western-ghats', 'Kerala Western Ghats (Wayanad, Meppadi, Chooralmala)', ARRAY['LANDSLIDE', 'FLOOD']),
('bihar-gangetic-plains', 'Bihar Gangetic Plains (Patna, Bhagalpur, Kosi Belt)', ARRAY['FLOOD']),
('assam-brahmaputra', 'Assam Brahmaputra Valley (Kamrup, Majuli, Dhemaji)', ARRAY['FLOOD', 'EROSION']),
('west-bengal-darjeeling', 'West Bengal Sub-Himalayan (Darjeeling, Teesta Valley)', ARRAY['LANDSLIDE', 'EROSION']),
('himachal-beas-basin', 'Himachal Pradesh Beas Basin (Mandi, Kullu, Shimla)', ARRAY['LANDSLIDE', 'CLOUDBURST', 'FLOOD']),
('odisha-coastal-belt', 'Odisha Sub-Coastal Delta (Puri, Kendrapara)', ARRAY['FLOOD', 'EROSION'])
ON CONFLICT (slug) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    hazard_types = EXCLUDED.hazard_types;

-- 5. Insert Habitations (Omitting serial id, dynamically resolving region_id)
INSERT INTO public.habitations (source_id, name, region_id, geom, zone_class, hazard_prob, evacuees, timeline, slope_class, rainfall_mm, discharge_cumecs, dist_river_m, isolation_index, alert_sent)
VALUES
(
    'HAB-JOSH-001', 'Sunil Ward & Ravine Slope, Joshimath',
    (SELECT region_id FROM public.regions WHERE slug = 'uttarakhand-himalayas' LIMIT 1),
    ST_SetSRID(ST_MakePoint(79.5641, 30.5551), 4326), 'red', 0.94, 1850, 'IMMEDIATE (0-6 Hours)', 'Very Steep (>32 deg)', 142.5, 34.0, 180.0, 0.88, true
),
(
    'HAB-JOSH-002', 'Manohar Bagh Fissure Belt, Joshimath',
    (SELECT region_id FROM public.regions WHERE slug = 'uttarakhand-himalayas' LIMIT 1),
    ST_SetSRID(ST_MakePoint(79.5580, 30.5520), 4326), 'red', 0.91, 1350, 'IMMEDIATE (0-6 Hours)', 'Steep Valley (>30 deg)', 138.0, 28.5, 210.0, 0.84, true
),
(
    'HAB-WAY-001', 'Chooralmala Tea Plantation Habitation, Wayanad',
    (SELECT region_id FROM public.regions WHERE slug = 'kerala-western-ghats' LIMIT 1),
    ST_SetSRID(ST_MakePoint(76.1319, 11.6854), 4326), 'red', 0.96, 3100, 'IMMEDIATE (0-6 Hours)', 'Escarpment (>28 deg)', 285.0, 48.0, 95.0, 0.92, true
),
(
    'HAB-WAY-002', 'Mundakkai Debris Flow Settlement, Wayanad',
    (SELECT region_id FROM public.regions WHERE slug = 'kerala-western-ghats' LIMIT 1),
    ST_SetSRID(ST_MakePoint(76.1450, 11.6620), 4326), 'red', 0.98, 2200, 'IMMEDIATE (0-6 Hours)', 'Precipitous (>35 deg)', 310.0, 62.0, 45.0, 0.95, true
),
(
    'HAB-PAT-001', 'Raghopur Diyara Inundation Habitation, Patna',
    (SELECT region_id FROM public.regions WHERE slug = 'bihar-gangetic-plains' LIMIT 1),
    ST_SetSRID(ST_MakePoint(85.1376, 25.5941), 4326), 'yellow', 0.68, 3200, 'SHORT_TERM (6-24 Hours)', 'Gentle Plains (0-3 deg)', 88.5, 4100.0, 25.0, 0.65, false
),
(
    'HAB-GHY-001', 'Deepor Beel Peripheral Ward, Guwahati',
    (SELECT region_id FROM public.regions WHERE slug = 'assam-brahmaputra' LIMIT 1),
    ST_SetSRID(ST_MakePoint(91.7362, 26.1445), 4326), 'yellow', 0.64, 2800, 'SHORT_TERM (6-24 Hours)', 'Floodplain (0-2 deg)', 92.0, 3850.0, 80.0, 0.58, false
),
(
    'HAB-DAR-001', 'Tindharia Landslip Habitation, Darjeeling',
    (SELECT region_id FROM public.regions WHERE slug = 'west-bengal-darjeeling' LIMIT 1),
    ST_SetSRID(ST_MakePoint(88.2627, 27.0410), 4326), 'red', 0.86, 1650, 'IMMEDIATE (0-6 Hours)', 'Steep Escarpment (>30 deg)', 175.0, 22.0, 140.0, 0.79, true
),
(
    'HAB-MND-001', 'Pandoh Dam Downstream Cluster, Mandi',
    (SELECT region_id FROM public.regions WHERE slug = 'himachal-beas-basin' LIMIT 1),
    ST_SetSRID(ST_MakePoint(76.9318, 31.7087), 4326), 'yellow', 0.62, 1950, 'SHORT_TERM (6-24 Hours)', 'River Gorge (15-25 deg)', 110.0, 2100.0, 60.0, 0.60, false
),
(
    'HAB-PUR-001', 'Astaranga Tidal Surge Habitation, Puri',
    (SELECT region_id FROM public.regions WHERE slug = 'odisha-coastal-belt' LIMIT 1),
    ST_SetSRID(ST_MakePoint(85.8312, 19.8135), 4326), 'yellow', 0.59, 2400, 'SHORT_TERM (6-24 Hours)', 'Coastal Plain (0-2 deg)', 65.0, 1500.0, 30.0, 0.52, false
),
(
    'HAB-GOP-001', 'Gopeshwar Stable Ridge Habitation, Chamoli',
    (SELECT region_id FROM public.regions WHERE slug = 'uttarakhand-himalayas' LIMIT 1),
    ST_SetSRID(ST_MakePoint(79.3176, 30.4124), 4326), 'safe', 0.14, 0, 'SAFE BASELINE', 'Gentle Plateau (4-8 deg)', 22.0, 5.0, 650.0, 0.10, false
),
(
    'HAB-KAL-001', 'Kalpetta Highland Safe Cluster, Wayanad',
    (SELECT region_id FROM public.regions WHERE slug = 'kerala-western-ghats' LIMIT 1),
    ST_SetSRID(ST_MakePoint(76.0827, 11.6094), 4326), 'safe', 0.12, 0, 'SAFE BASELINE', 'Rolling Highland (5-10 deg)', 35.0, 8.0, 800.0, 0.12, false
),
(
    'HAB-PAT-002', 'Patna Cantonment High Grounds, Bihar',
    (SELECT region_id FROM public.regions WHERE slug = 'bihar-gangetic-plains' LIMIT 1),
    ST_SetSRID(ST_MakePoint(85.0850, 25.6120), 4326), 'safe', 0.08, 0, 'SAFE BASELINE', 'Elevated Terrace (0-2 deg)', 18.0, 2.0, 1400.0, 0.05, false
)
ON CONFLICT (source_id) DO UPDATE SET
    name = EXCLUDED.name,
    region_id = EXCLUDED.region_id,
    geom = EXCLUDED.geom,
    zone_class = EXCLUDED.zone_class,
    hazard_prob = EXCLUDED.hazard_prob,
    evacuees = EXCLUDED.evacuees,
    timeline = EXCLUDED.timeline,
    slope_class = EXCLUDED.slope_class,
    rainfall_mm = EXCLUDED.rainfall_mm,
    discharge_cumecs = EXCLUDED.discharge_cumecs,
    dist_river_m = EXCLUDED.dist_river_m,
    isolation_index = EXCLUDED.isolation_index,
    alert_sent = EXCLUDED.alert_sent;

-- 6. Insert Core App Zones (9 Monitored Multi-Hazard Zones)
INSERT INTO public."Zone" (
    id, "zoneId", name, state, district, lat, lng,
    "minLon", "minLat", "maxLon", "maxLat",
    population, "householdCount", "elevationM", "slopeClass",
    "isRedZone", "zoneColor", "worstHazard", "worstScore",
    priority, "priorityScore", "floodScore", "landslideScore",
    "erosionScore", "cloudburstScore", "lastAssessedAt", "isStale", "updatedAt"
)
VALUES
(
    COALESCE((SELECT id FROM public."Zone" WHERE "zoneId" = 'Z-UTTARAKHAND-JOSHIMATH-01'), 'zone-uk-joshimath-01'),
    'Z-UTTARAKHAND-JOSHIMATH-01', 'Joshimath Town & Ravine Valley, Uttarakhand', 'Uttarakhand', 'Chamoli',
    30.5551, 79.5641, 79.5391, 30.5301, 79.5891, 30.5801,
    21500, 4800, 1890.0, 'Steep Valley (>30 deg)',
    true, 'RED', 'LANDSLIDE', 0.94,
    'IMMEDIATE', 0.893, 0.42, 0.94, 0.0, 0.88,
    now(), false, now()
),
(
    COALESCE((SELECT id FROM public."Zone" WHERE "zoneId" = 'Z-KERALA-WAYANAD-01'), 'zone-kl-wayanad-01'),
    'Z-KERALA-WAYANAD-01', 'Meppadi Chooralmala Sector, Wayanad', 'Kerala', 'Wayanad',
    11.6854, 76.1319, 76.1069, 11.6604, 76.1569, 11.7104,
    16800, 3900, 840.0, 'Escarpment (>25 deg)',
    true, 'RED', 'LANDSLIDE', 0.845,
    'IMMEDIATE', 0.812, 0.612, 0.845, 0.0, 0.589,
    now(), false, now()
),
(
    COALESCE((SELECT id FROM public."Zone" WHERE "zoneId" = 'Z-WESTBENGAL-DARJEELING-01'), 'zone-wb-darjeeling-01'),
    'Z-WESTBENGAL-DARJEELING-01', 'Darjeeling Teesta Gorge Slope, West Bengal', 'West Bengal', 'Darjeeling',
    27.0410, 88.2627, 27.0160, 88.2377, 27.0660, 88.2877,
    14500, 3200, 2045.0, 'Precipitous Slopes (>35 deg)',
    true, 'RED', 'LANDSLIDE', 0.862,
    'IMMEDIATE', 0.835, 0.38, 0.862, 0.45, 0.62,
    now(), false, now()
),
(
    COALESCE((SELECT id FROM public."Zone" WHERE "zoneId" = 'Z-BIHAR-PATNA-01'), 'zone-br-patna-01'),
    'Z-BIHAR-PATNA-01', 'Patna Central Lowlands & Ganga Basin, Bihar', 'Bihar', 'Patna',
    25.5941, 85.1376, 85.1126, 25.5691, 85.1626, 25.6191,
    48500, 11200, 55.0, 'Gentle Plains (0-3 deg)',
    false, 'YELLOW', 'FLOOD', 0.584,
    'SHORT_TERM', 0.542, 0.584, 0.12, 0.0, 0.31,
    now(), false, now()
),
(
    COALESCE((SELECT id FROM public."Zone" WHERE "zoneId" = 'Z-ASSAM-GUWAHATI-01'), 'zone-as-guwahati-01'),
    'Z-ASSAM-GUWAHATI-01', 'Guwahati Brahmaputra Floodplain, Assam', 'Assam', 'Kamrup Metropolitan',
    26.1445, 91.7362, 91.7112, 26.1195, 91.7612, 26.1695,
    34200, 7800, 52.0, 'Floodplain Basin (0-2 deg)',
    false, 'YELLOW', 'FLOOD', 0.638,
    'SHORT_TERM', 0.612, 0.638, 0.08, 0.55, 0.42,
    now(), false, now()
),
(
    COALESCE((SELECT id FROM public."Zone" WHERE "zoneId" = 'Z-HIMACHAL-MANDI-01'), 'zone-hp-mandi-01'),
    'Z-HIMACHAL-MANDI-01', 'Mandi Beas River Valley, Himachal Pradesh', 'Himachal Pradesh', 'Mandi',
    31.7087, 76.9318, 76.9068, 31.6837, 76.9568, 31.7337,
    18900, 4100, 760.0, 'River Gorge (18-28 deg)',
    false, 'YELLOW', 'CLOUDBURST', 0.625,
    'SHORT_TERM', 0.595, 0.55, 0.58, 0.22, 0.625,
    now(), false, now()
),
(
    COALESCE((SELECT id FROM public."Zone" WHERE "zoneId" = 'Z-ODISHA-PURI-01'), 'zone-od-puri-01'),
    'Z-ODISHA-PURI-01', 'Puri Coastal Surge Zone, Odisha', 'Odisha', 'Puri',
    19.8135, 85.8312, 85.8062, 19.7885, 85.8562, 19.8385,
    26400, 5900, 12.0, 'Coastal Littoral Plain (0-2 deg)',
    false, 'YELLOW', 'FLOOD', 0.565,
    'SHORT_TERM', 0.530, 0.565, 0.05, 0.52, 0.15,
    now(), false, now()
),
(
    COALESCE((SELECT id FROM public."Zone" WHERE "zoneId" = 'Z-UTTARAKHAND-GOPESHWAR-01'), 'zone-uk-gopeshwar-01'),
    'Z-UTTARAKHAND-GOPESHWAR-01', 'Gopeshwar Stable Ridge, Uttarakhand', 'Uttarakhand', 'Chamoli',
    30.4124, 79.3176, 79.2926, 30.3874, 79.3426, 30.4374,
    14200, 3100, 1550.0, 'Moderate Ridge (5-12 deg)',
    false, 'GREEN', 'LANDSLIDE', 0.165,
    'NONE', 0.0, 0.12, 0.165, 0.0, 0.14,
    now(), false, now()
),
(
    COALESCE((SELECT id FROM public."Zone" WHERE "zoneId" = 'Z-KERALA-KALPETTA-01'), 'zone-kl-kalpetta-01'),
    'Z-KERALA-KALPETTA-01', 'Kalpetta Safe Highland Township, Kerala', 'Kerala', 'Wayanad',
    11.6094, 76.0827, 76.0577, 11.5844, 76.1077, 11.6344,
    22800, 5200, 780.0, 'Rolling Plateau (4-10 deg)',
    false, 'GREEN', 'FLOOD', 0.135,
    'NONE', 0.0, 0.135, 0.12, 0.0, 0.10,
    now(), false, now()
)
ON CONFLICT ("zoneId") DO UPDATE SET
    name = EXCLUDED.name,
    state = EXCLUDED.state,
    district = EXCLUDED.district,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    population = EXCLUDED.population,
    "elevationM" = EXCLUDED."elevationM",
    "slopeClass" = EXCLUDED."slopeClass",
    "isRedZone" = EXCLUDED."isRedZone",
    "zoneColor" = EXCLUDED."zoneColor",
    "worstHazard" = EXCLUDED."worstHazard",
    "worstScore" = EXCLUDED."worstScore",
    priority = EXCLUDED.priority,
    "priorityScore" = EXCLUDED."priorityScore",
    "floodScore" = EXCLUDED."floodScore",
    "landslideScore" = EXCLUDED."landslideScore",
    "erosionScore" = EXCLUDED."erosionScore",
    "cloudburstScore" = EXCLUDED."cloudburstScore",
    "lastAssessedAt" = EXCLUDED."lastAssessedAt",
    "isStale" = EXCLUDED."isStale",
    "updatedAt" = now();

-- 7. Insert Static Zone Fields (GIS Attributes)
INSERT INTO public."StaticZoneField" (id, "zoneId", "fieldName", value, source)
VALUES
('szf-josh-01', 'Z-UTTARAKHAND-JOSHIMATH-01', 'slope_deg', 34.2, 'SRTM 30m DEM'),
('szf-josh-02', 'Z-UTTARAKHAND-JOSHIMATH-01', 'soil_bearing_kpa', 65.0, 'Geological Survey of India'),
('szf-josh-03', 'Z-UTTARAKHAND-JOSHIMATH-01', 'drainage_density_km2', 3.8, 'Bhuvan ISRO'),
('szf-way-01', 'Z-KERALA-WAYANAD-01', 'slope_deg', 28.6, 'Cartosat-1 DEM'),
('szf-way-02', 'Z-KERALA-WAYANAD-01', 'soil_bearing_kpa', 78.0, 'Kerala State Disaster Management Authority'),
('szf-pat-01', 'Z-BIHAR-PATNA-01', 'slope_deg', 0.64, 'Survey of India'),
('szf-pat-02', 'Z-BIHAR-PATNA-01', 'drainage_density_km2', 1.2, 'Central Water Commission')
ON CONFLICT ("zoneId", "fieldName") DO UPDATE SET
    value = EXCLUDED.value,
    source = EXCLUDED.source,
    "ingestedAt" = now();

-- 8. Insert Hazard Readings (Live Multi-Hazard Telemetry)
INSERT INTO public."HazardReading" (id, "zoneId", "hazardType", source, "recordedAt", "dataQuality", parameters)
VALUES
('hr-josh-01', 'Z-UTTARAKHAND-JOSHIMATH-01', 'LANDSLIDE', 'IMD_AWS_Chamoli', now(), 'RAW', '{"rainfall_24h_mm": 78.4, "rainfall_72h_mm": 245.0, "river_discharge_m3s": 34.0, "soil_saturation_pct": 95.0, "slope_deg": 34.2}'::jsonb),
('hr-way-01', 'Z-KERALA-WAYANAD-01', 'LANDSLIDE', 'IMD_AWS_Wayanad', now(), 'RAW', '{"rainfall_24h_mm": 142.0, "rainfall_72h_mm": 310.5, "river_discharge_m3s": 32.1, "soil_saturation_pct": 89.0, "slope_deg": 28.6}'::jsonb),
('hr-pat-01', 'Z-BIHAR-PATNA-01', 'FLOOD', 'CWC_Gauge_Patna', now(), 'RAW', '{"rainfall_24h_mm": 34.7, "rainfall_72h_mm": 47.1, "river_discharge_m3s": 8.25, "soil_saturation_pct": 62.0, "slope_deg": 0.64}'::jsonb),
('hr-ghy-01', 'Z-ASSAM-GUWAHATI-01', 'FLOOD', 'CWC_Gauge_Brahmaputra', now(), 'RAW', '{"rainfall_24h_mm": 52.3, "rainfall_72h_mm": 88.0, "river_discharge_m3s": 18.5, "soil_saturation_pct": 74.0, "slope_deg": 0.8}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    parameters = EXCLUDED.parameters,
    "recordedAt" = now();

-- 9. Insert Hazard History (14 Days of Time Series for Analytics Charts)
INSERT INTO public."HazardHistory" (
    id, "zoneId", "recordedAt", "floodScore", "landslideScore",
    "erosionScore", "cloudburstScore", "worstScore", "zoneColor",
    "rainfallMm", "riverLevelM", "temperatureC", "soilSaturationPct"
)
VALUES
-- Joshimath 14-day history (Progressive saturation leading to Red Zone)
('hh-josh-01', 'Z-UTTARAKHAND-JOSHIMATH-01', now() - interval '13 days', 0.20, 0.42, 0.0, 0.35, 0.42, 'YELLOW', 22.0, 2.1, 14.5, 52.0),
('hh-josh-02', 'Z-UTTARAKHAND-JOSHIMATH-01', now() - interval '11 days', 0.24, 0.48, 0.0, 0.40, 0.48, 'YELLOW', 35.0, 2.3, 13.8, 59.0),
('hh-josh-03', 'Z-UTTARAKHAND-JOSHIMATH-01', now() - interval '9 days',  0.28, 0.58, 0.0, 0.52, 0.58, 'YELLOW', 48.0, 2.6, 12.5, 68.0),
('hh-josh-04', 'Z-UTTARAKHAND-JOSHIMATH-01', now() - interval '7 days',  0.34, 0.69, 0.0, 0.65, 0.69, 'YELLOW', 62.0, 3.0, 11.2, 76.0),
('hh-josh-05', 'Z-UTTARAKHAND-JOSHIMATH-01', now() - interval '5 days',  0.38, 0.78, 0.0, 0.74, 0.78, 'RED',    75.0, 3.3, 10.5, 84.0),
('hh-josh-06', 'Z-UTTARAKHAND-JOSHIMATH-01', now() - interval '3 days',  0.41, 0.88, 0.0, 0.82, 0.88, 'RED',    88.0, 3.6, 9.8,  91.0),
('hh-josh-07', 'Z-UTTARAKHAND-JOSHIMATH-01', now() - interval '1 days',  0.42, 0.94, 0.0, 0.88, 0.94, 'RED',    95.0, 3.8, 9.2,  95.0),

-- Wayanad 14-day history (Monsoon debris flow surge)
('hh-way-01', 'Z-KERALA-WAYANAD-01', now() - interval '13 days', 0.35, 0.45, 0.0, 0.30, 0.45, 'YELLOW', 45.0, 1.8, 22.5, 60.0),
('hh-way-02', 'Z-KERALA-WAYANAD-01', now() - interval '10 days', 0.42, 0.55, 0.0, 0.40, 0.55, 'YELLOW', 68.0, 2.2, 21.8, 68.0),
('hh-way-03', 'Z-KERALA-WAYANAD-01', now() - interval '7 days',  0.50, 0.68, 0.0, 0.48, 0.68, 'YELLOW', 92.0, 2.7, 21.0, 77.0),
('hh-way-04', 'Z-KERALA-WAYANAD-01', now() - interval '4 days',  0.58, 0.79, 0.0, 0.55, 0.79, 'RED',    125.0, 3.2, 20.2, 85.0),
('hh-way-05', 'Z-KERALA-WAYANAD-01', now() - interval '1 days',  0.61, 0.84, 0.0, 0.59, 0.84, 'RED',    142.0, 3.5, 19.8, 89.0),

-- Patna 14-day history (Steady riverine swell)
('hh-pat-01', 'Z-BIHAR-PATNA-01', now() - interval '12 days', 0.32, 0.05, 0.0, 0.15, 0.32, 'GREEN',  15.0, 1.2, 31.0, 45.0),
('hh-pat-02', 'Z-BIHAR-PATNA-01', now() - interval '8 days',  0.42, 0.08, 0.0, 0.22, 0.42, 'YELLOW', 24.0, 1.6, 29.5, 52.0),
('hh-pat-03', 'Z-BIHAR-PATNA-01', now() - interval '4 days',  0.51, 0.10, 0.0, 0.28, 0.51, 'YELLOW', 31.0, 2.0, 28.8, 58.0),
('hh-pat-04', 'Z-BIHAR-PATNA-01', now() - interval '1 days',  0.58, 0.12, 0.0, 0.31, 0.58, 'YELLOW', 35.0, 2.3, 28.0, 62.0)
ON CONFLICT (id) DO UPDATE SET
    "floodScore" = EXCLUDED."floodScore",
    "landslideScore" = EXCLUDED."landslideScore",
    "worstScore" = EXCLUDED."worstScore",
    "zoneColor" = EXCLUDED."zoneColor",
    "rainfallMm" = EXCLUDED."rainfallMm",
    "soilSaturationPct" = EXCLUDED."soilSaturationPct";

-- 10. Insert Certified Relocation Sites (Sphere Standards Compliant)
-- Note: site-008 is FULL (remainingCapacity: 0) to demonstrate dynamic path vanishing
INSERT INTO public."RelocationSite" (
    id, "siteCode", name, district, state, lat, lng,
    "totalAreaSqm", "usableAreaSqm", "sphereStandardSqmPerPerson",
    "sphereCapacity", "currentOccupancy", "remainingCapacity",
    "waterSourceType", "roadConnectivityRating", "hospitalDistanceKm",
    "powerGridStatus", status, "updatedAt"
)
VALUES
(
    COALESCE((SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-CHAMOLI-PIPALKOTI-01'), 'site-001'),
    'SITE-CHAMOLI-PIPALKOTI-01', 'Pipalkoti Elevated Resettlement Township', 'Chamoli', 'Uttarakhand',
    30.4312, 79.4285, 180000.0, 144000.0, 45.0,
    3200, 1850, 1350,
    'Alaknanda Treated Filtration + Natural Spring Reservoir', 5, 4.2,
    true, 'ACTIVE', now()
),
(
    COALESCE((SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-CHAMOLI-GAUCHER-02'), 'site-002'),
    'SITE-CHAMOLI-GAUCHER-02', 'Gaucher Airstrip Valley Safe Zone', 'Chamoli', 'Uttarakhand',
    30.2925, 79.1558, 250000.0, 202500.0, 45.0,
    4500, 2100, 2400,
    'Submersible Borewells + NDRF Purifiers', 5, 2.1,
    true, 'ACTIVE', now()
),
(
    COALESCE((SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-WAYANAD-KALPETTA-01'), 'site-003'),
    'SITE-WAYANAD-KALPETTA-01', 'Kalpetta Ridge Disaster Relief Campus', 'Wayanad', 'Kerala',
    11.6094, 76.0827, 210000.0, 162000.0, 45.0,
    3600, 2300, 1300,
    'Municipal Gravity Line + 200kL Storage Tanks', 5, 3.5,
    true, 'ACTIVE', now()
),
(
    COALESCE((SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-WAYANAD-MANANTHAVADY-02'), 'site-004'),
    'SITE-WAYANAD-MANANTHAVADY-02', 'Mananthavady Plateau Transit Site', 'Wayanad', 'Kerala',
    11.8028, 76.0042, 175000.0, 135000.0, 45.0,
    3000, 1400, 1600,
    'Deep Ground Aquifer + Mobile Filtration', 4, 6.8,
    true, 'ACTIVE', now()
),
(
    COALESCE((SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-PATNA-BIHTA-01'), 'site-005'),
    'SITE-PATNA-BIHTA-01', 'Bihta Elevated Dry-Ground Township', 'Patna', 'Bihar',
    25.5684, 84.8712, 320000.0, 270000.0, 45.0,
    6000, 2900, 3100,
    'Industrial Deep Borewells + RO Water Plant', 5, 5.0,
    true, 'ACTIVE', now()
),
(
    COALESCE((SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-KAMRUP-MIRZA-01'), 'site-006'),
    'SITE-KAMRUP-MIRZA-01', 'Mirza Highlands Safe Transit Hub', 'Kamrup', 'Assam',
    26.0824, 91.5342, 240000.0, 180000.0, 45.0,
    4000, 1750, 2250,
    'Brahmaputra Elevated Filtration Depot', 4, 7.2,
    true, 'ACTIVE', now()
),
(
    COALESCE((SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-DARJEELING-KURSEONG-01'), 'site-007'),
    'SITE-DARJEELING-KURSEONG-01', 'Kurseong ITI High Ridge Relocation Camp', 'Darjeeling', 'West Bengal',
    26.8820, 88.2780, 150000.0, 112500.0, 45.0,
    2500, 950, 1550,
    'Municipal Gravity Spring Network', 4, 3.8,
    true, 'ACTIVE', now()
),
(
    COALESCE((SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-MANDI-SUNDERNAGAR-01'), 'site-008'),
    'SITE-MANDI-SUNDERNAGAR-01', 'Sundernagar Plateau Relief Camp', 'Mandi', 'Himachal Pradesh',
    31.5320, 76.8920, 160000.0, 126000.0, 45.0,
    2800, 2800, 0,
    'Gravity Reservoir + Mobile Purifier', 4, 4.5,
    true, 'FULL', now()
)
ON CONFLICT ("siteCode") DO UPDATE SET
    name = EXCLUDED.name,
    district = EXCLUDED.district,
    state = EXCLUDED.state,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng,
    "totalAreaSqm" = EXCLUDED."totalAreaSqm",
    "usableAreaSqm" = EXCLUDED."usableAreaSqm",
    "sphereCapacity" = EXCLUDED."sphereCapacity",
    "currentOccupancy" = EXCLUDED."currentOccupancy",
    "remainingCapacity" = EXCLUDED."remainingCapacity",
    "waterSourceType" = EXCLUDED."waterSourceType",
    "roadConnectivityRating" = EXCLUDED."roadConnectivityRating",
    "hospitalDistanceKm" = EXCLUDED."hospitalDistanceKm",
    status = EXCLUDED.status,
    "updatedAt" = now();

-- 11. Insert Relocation Plans
INSERT INTO public."RelocationPlan" (
    id, "zoneId", "totalEvacuees", timeline, shortfall,
    "isFullyAccommodated", "priorityRank", notes, "updatedAt"
)
VALUES
(
    COALESCE((SELECT id FROM public."RelocationPlan" WHERE "zoneId" = 'Z-UTTARAKHAND-JOSHIMATH-01'), 'plan-001'),
    'Z-UTTARAKHAND-JOSHIMATH-01', 3200, '0-6 Hours (Immediate Evacuation)', 0,
    true, 1, 'Coordinated NH-7 Alaknanda Corridor descent. All evacuees accommodated in Pipalkoti and Gaucher.', now()
),
(
    COALESCE((SELECT id FROM public."RelocationPlan" WHERE "zoneId" = 'Z-KERALA-WAYANAD-01'), 'plan-002'),
    'Z-KERALA-WAYANAD-01', 4500, '0-6 Hours (Immediate Evacuation)', 0,
    true, 1, 'Western Ghats slope evacuation via SH-59 Kalpetta bypass.', now()
),
(
    COALESCE((SELECT id FROM public."RelocationPlan" WHERE "zoneId" = 'Z-BIHAR-PATNA-01'), 'plan-003'),
    'Z-BIHAR-PATNA-01', 5800, '12-24 Hours (Planned Transit)', 0,
    true, 2, 'Riverine low-ground evacuation to Bihta dry-ground township via NH-922.', now()
),
(
    COALESCE((SELECT id FROM public."RelocationPlan" WHERE "zoneId" = 'Z-ASSAM-GUWAHATI-01'), 'plan-004'),
    'Z-ASSAM-GUWAHATI-01', 4000, '12-24 Hours (Planned Transit)', 0,
    true, 2, 'South bank flood evacuation to Mirza highlands via NH-27.', now()
),
(
    COALESCE((SELECT id FROM public."RelocationPlan" WHERE "zoneId" = 'Z-WESTBENGAL-DARJEELING-01'), 'plan-005'),
    'Z-WESTBENGAL-DARJEELING-01', 2500, '0-6 Hours (Immediate Evacuation)', 0,
    true, 1, 'Teesta gorge hillside descent to Kurseong via Hill Cart Road (NH-110).', now()
)
ON CONFLICT ("zoneId") DO UPDATE SET
    "totalEvacuees" = EXCLUDED."totalEvacuees",
    timeline = EXCLUDED.timeline,
    shortfall = EXCLUDED.shortfall,
    "isFullyAccommodated" = EXCLUDED."isFullyAccommodated",
    "priorityRank" = EXCLUDED."priorityRank",
    notes = EXCLUDED.notes,
    "updatedAt" = now();

-- 12. Insert Relocation Allocations with Verified Road Route Coordinates
DELETE FROM public."RelocationAllocation";

INSERT INTO public."RelocationAllocation" (
    id, "planId", "siteId", "allocatedPopulation", "distanceKm",
    "roadRouteCoordinates", "routeStatus", "estimatedTransitHours"
)
VALUES
-- Joshimath -> Pipalkoti (NH-7 Road Route)
(
    'alloc-001',
    (SELECT id FROM public."RelocationPlan" WHERE "zoneId" = 'Z-UTTARAKHAND-JOSHIMATH-01' LIMIT 1),
    (SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-CHAMOLI-PIPALKOTI-01' LIMIT 1),
    1850, 24.5,
    '[[30.5551, 79.5641], [30.5312, 79.5245], [30.5015, 79.4892], [30.4682, 79.4512], [30.4312, 79.4285]]'::jsonb,
    'CLEAR', 0.8
),
-- Joshimath -> Gaucher Airstrip (NH-7 Lower Valley Route)
(
    'alloc-002',
    (SELECT id FROM public."RelocationPlan" WHERE "zoneId" = 'Z-UTTARAKHAND-JOSHIMATH-01' LIMIT 1),
    (SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-CHAMOLI-GAUCHER-02' LIMIT 1),
    1350, 48.2,
    '[[30.5551, 79.5641], [30.4312, 79.4285], [30.3845, 79.3512], [30.3312, 79.2458], [30.2925, 79.1558]]'::jsonb,
    'CLEAR', 1.5
),
-- Wayanad Chooralmala -> Kalpetta Relief Campus (SH-59 Route)
(
    'alloc-003',
    (SELECT id FROM public."RelocationPlan" WHERE "zoneId" = 'Z-KERALA-WAYANAD-01' LIMIT 1),
    (SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-WAYANAD-KALPETTA-01' LIMIT 1),
    2500, 18.2,
    '[[11.6854, 76.1319], [11.6621, 76.1154], [11.6385, 76.0982], [11.6094, 76.0827]]'::jsonb,
    'CLEAR', 0.6
),
-- Wayanad Chooralmala -> Mananthavady Plateau Transit Hub
(
    'alloc-004',
    (SELECT id FROM public."RelocationPlan" WHERE "zoneId" = 'Z-KERALA-WAYANAD-01' LIMIT 1),
    (SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-WAYANAD-MANANTHAVADY-02' LIMIT 1),
    2000, 31.4,
    '[[11.6854, 76.1319], [11.7245, 76.0912], [11.7654, 76.0482], [11.8028, 76.0042]]'::jsonb,
    'CLEAR', 1.0
),
-- Patna -> Bihta Safe Township (NH-922 Expressway)
(
    'alloc-005',
    (SELECT id FROM public."RelocationPlan" WHERE "zoneId" = 'Z-BIHAR-PATNA-01' LIMIT 1),
    (SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-PATNA-BIHTA-01' LIMIT 1),
    5800, 28.0,
    '[[25.5941, 85.1376], [25.5842, 85.0512], [25.5784, 84.9625], [25.5684, 84.8712]]'::jsonb,
    'CLEAR', 0.9
),
-- Guwahati -> Mirza Highlands Transit Hub (NH-27 Corridor)
(
    'alloc-006',
    (SELECT id FROM public."RelocationPlan" WHERE "zoneId" = 'Z-ASSAM-GUWAHATI-01' LIMIT 1),
    (SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-KAMRUP-MIRZA-01' LIMIT 1),
    4000, 26.5,
    '[[26.1445, 91.7362], [26.1215, 91.6745], [26.0982, 91.6021], [26.0824, 91.5342]]'::jsonb,
    'CLEAR', 0.7
),
-- Darjeeling -> Kurseong ITI Campus (Hill Cart Road NH-110)
(
    'alloc-007',
    (SELECT id FROM public."RelocationPlan" WHERE "zoneId" = 'Z-WESTBENGAL-DARJEELING-01' LIMIT 1),
    (SELECT id FROM public."RelocationSite" WHERE "siteCode" = 'SITE-DARJEELING-KURSEONG-01' LIMIT 1),
    2500, 22.0,
    '[[27.0410, 88.2627], [26.9854, 88.2712], [26.9245, 88.2745], [26.8820, 88.2780]]'::jsonb,
    'CLEAR', 0.9
)
ON CONFLICT (id) DO UPDATE SET
    "allocatedPopulation" = EXCLUDED."allocatedPopulation",
    "distanceKm" = EXCLUDED."distanceKm",
    "roadRouteCoordinates" = EXCLUDED."roadRouteCoordinates",
    "routeStatus" = EXCLUDED."routeStatus",
    "estimatedTransitHours" = EXCLUDED."estimatedTransitHours";

-- Grant permissions to Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ====================================================================
-- SUCCESS VERIFICATION QUERY
-- ====================================================================
SELECT 'Zone count' AS entity, COUNT(*) FROM public."Zone"
UNION ALL
SELECT 'Relocation sites', COUNT(*) FROM public."RelocationSite"
UNION ALL
SELECT 'Relocation plans', COUNT(*) FROM public."RelocationPlan"
UNION ALL
SELECT 'Allocations', COUNT(*) FROM public."RelocationAllocation"
UNION ALL
SELECT 'Habitations', COUNT(*) FROM public.habitations
UNION ALL
SELECT 'Regions', COUNT(*) FROM public.regions
UNION ALL
SELECT 'Hazard readings', COUNT(*) FROM public."HazardReading"
UNION ALL
SELECT 'Hazard history records', COUNT(*) FROM public."HazardHistory";
