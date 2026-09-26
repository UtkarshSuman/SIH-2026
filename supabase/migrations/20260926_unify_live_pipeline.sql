-- FEATURE: Enforces one current relocation plan per assessed zone.
-- INSTALLATION: Apply through the Supabase SQL editor before deploying the live worker.
CREATE UNIQUE INDEX IF NOT EXISTS "RelocationPlan_zoneId_key"
  ON "RelocationPlan" ("zoneId");

CREATE TABLE IF NOT EXISTS "StaticZoneField" (
  "id" text PRIMARY KEY,
  "zoneId" text NOT NULL REFERENCES "Zone"("zoneId") ON DELETE CASCADE,
  "fieldName" text NOT NULL,
  "value" double precision,
  "source" text NOT NULL,
  "ingestedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("zoneId", "fieldName")
);
CREATE INDEX IF NOT EXISTS "StaticZoneField_zoneId_idx" ON "StaticZoneField" ("zoneId");
