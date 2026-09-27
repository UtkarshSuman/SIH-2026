-- ============================================================
-- RESCUE ARC DATABASE MIGRATION v2.0
-- Project: jxitjpimiompwifxguch (jxitjpimiompwifxguch.supabase.co)
-- Run this in Supabase Dashboard → SQL Editor
-- Creates all tables needed for full dynamic website operation
-- ============================================================

-- ============================================================
-- 1. ENRICH ZONES TABLE (add missing columns)
-- ============================================================
ALTER TABLE IF EXISTS zones
  ADD COLUMN IF NOT EXISTS state          TEXT,
  ADD COLUMN IF NOT EXISTS district       TEXT,
  ADD COLUMN IF NOT EXISTS lat            FLOAT,
  ADD COLUMN IF NOT EXISTS lng            FLOAT,
  ADD COLUMN IF NOT EXISTS population     INT         DEFAULT 0,
  ADD COLUMN IF NOT EXISTS elevation_m    FLOAT,
  ADD COLUMN IF NOT EXISTS slope_class    TEXT,
  ADD COLUMN IF NOT EXISTS is_red_zone    BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at     TIMESTAMPTZ DEFAULT NOW();

-- Update zone metadata from known data
UPDATE zones SET
  state = 'Bihar', district = 'Patna',
  lat = 25.5941, lng = 85.1376, population = 45000,
  elevation_m = 53, slope_class = 'Flat Plain (<5 deg)', is_red_zone = false
WHERE zone_id = 'Z-BIHAR-PATNA-01';

UPDATE zones SET
  state = 'Kerala', district = 'Wayanad',
  lat = 11.6854, lng = 76.1319, population = 18200,
  elevation_m = 980, slope_class = 'Escarpment Slopes (>35 deg)', is_red_zone = false
WHERE zone_id = 'Z-KERALA-WAYANAD-01';

UPDATE zones SET
  state = 'Assam', district = 'Kamrup Metropolitan',
  lat = 26.1445, lng = 91.7362, population = 32000,
  elevation_m = 55, slope_class = 'Riverine Valley (<8 deg)', is_red_zone = false
WHERE zone_id = 'Z-ASSAM-GUWAHATI-01';

UPDATE zones SET
  state = 'Odisha', district = 'Puri',
  lat = 19.8135, lng = 85.8312, population = 28000,
  elevation_m = 10, slope_class = 'Coastal Beach (<3 deg)', is_red_zone = false
WHERE zone_id = 'Z-ODISHA-PURI-01';

UPDATE zones SET
  state = 'Uttarakhand', district = 'Chamoli',
  lat = 30.5551, lng = 79.5641, population = 21500,
  elevation_m = 1890, slope_class = 'Steep Valley (>30 deg)', is_red_zone = false
WHERE zone_id = 'Z-UTTARAKHAND-JOSHIMATH-01';

-- ============================================================
-- 2. RELOCATION SITES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS relocation_sites (
  id                           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  site_code                    TEXT        UNIQUE NOT NULL,
  name                         TEXT        NOT NULL,
  district                     TEXT        NOT NULL,
  state                        TEXT        NOT NULL,
  lat                          FLOAT       NOT NULL,
  lng                          FLOAT       NOT NULL,
  total_area_sqm               FLOAT       NOT NULL,
  usable_area_sqm              FLOAT       NOT NULL,
  sphere_standard_sqm_per_person FLOAT     DEFAULT 45.0,
  sphere_capacity              INT         NOT NULL,
  current_occupancy            INT         DEFAULT 0,
  remaining_capacity           INT         NOT NULL,
  water_source_type            TEXT,
  road_connectivity_rating     INT         DEFAULT 4,
  hospital_distance_km         FLOAT,
  power_grid_status            BOOLEAN     DEFAULT true,
  status                       TEXT        DEFAULT 'ACTIVE'
                                           CHECK (status IN ('ACTIVE','PLANNED','FULL','MAINTENANCE')),
  created_at                   TIMESTAMPTZ DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS relocation_sites_district_idx ON relocation_sites(district);
CREATE INDEX IF NOT EXISTS relocation_sites_status_idx   ON relocation_sites(status);

-- ============================================================
-- 3. RELOCATION PLANS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS relocation_plans (
  id                    TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  zone_id               TEXT        UNIQUE NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
  total_evacuees        INT         NOT NULL,
  timeline              TEXT        NOT NULL,
  shortfall             INT         DEFAULT 0,
  is_fully_accommodated BOOLEAN     DEFAULT true,
  priority_rank         INT         DEFAULT 1,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS relocation_plans_zone_idx ON relocation_plans(zone_id);

-- ============================================================
-- 4. RELOCATION ALLOCATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS relocation_allocations (
  id                      TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  plan_id                 TEXT        NOT NULL REFERENCES relocation_plans(id) ON DELETE CASCADE,
  site_id                 TEXT        NOT NULL REFERENCES relocation_sites(id) ON DELETE CASCADE,
  allocated_population    INT         NOT NULL,
  distance_km             FLOAT       NOT NULL,
  road_route_coordinates  JSONB,
  route_status            TEXT        DEFAULT 'CLEAR'
                                      CHECK (route_status IN ('CLEAR','CONGESTED','BLOCKED','HAZARDOUS')),
  estimated_transit_hours FLOAT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS relocation_alloc_plan_idx ON relocation_allocations(plan_id);
CREATE INDEX IF NOT EXISTS relocation_alloc_site_idx ON relocation_allocations(site_id);

-- ============================================================
-- 5. ZONE ANALYTICS TABLE (pre-computed ML stats per zone)
-- ============================================================
CREATE TABLE IF NOT EXISTS zone_analytics (
  id                          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  zone_id                     TEXT        UNIQUE NOT NULL REFERENCES zones(zone_id) ON DELETE CASCADE,
  mean_worst_score            FLOAT       DEFAULT 0.0,
  peak_worst_score            FLOAT       DEFAULT 0.0,
  volatility_index            FLOAT       DEFAULT 0.0,
  rainfall_correlation        FLOAT       DEFAULT 0.0,
  river_correlation           FLOAT       DEFAULT 0.0,
  saturation_correlation      FLOAT       DEFAULT 0.0,
  primary_hazard_driver       TEXT,
  secondary_hazard_driver     TEXT,
  escalation_probability_pct  FLOAT       DEFAULT 0.0,
  days_above_warning          INT         DEFAULT 0,
  days_above_critical         INT         DEFAULT 0,
  anomalies_detected_count    INT         DEFAULT 0,
  generated_briefing          TEXT,
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS zone_analytics_zone_idx ON zone_analytics(zone_id);

-- ============================================================
-- 6. ALERT LOG TABLE (history of sent alerts)
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_log (
  id                    TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  zone_id               TEXT        NOT NULL,
  severity              TEXT        NOT NULL CHECK (severity IN ('alert','warning','info')),
  from_color            TEXT        NOT NULL,
  to_color              TEXT        NOT NULL,
  message               TEXT,
  recipients_targeted   INT         DEFAULT 0,
  recipients_delivered  INT         DEFAULT 0,
  sent_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alert_log_zone_idx    ON alert_log(zone_id);
CREATE INDEX IF NOT EXISTS alert_log_sent_at_idx ON alert_log(sent_at DESC);

-- ============================================================
-- 7. ALERT SUBSCRIBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS alert_subscribers (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  zone_id     TEXT        NOT NULL,
  email       TEXT,
  phone       TEXT,
  fcm_token   TEXT,
  active      BOOLEAN     DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS alert_sub_zone_idx ON alert_subscribers(zone_id);

-- ============================================================
-- 8. ML PIPELINE RUNS LOG (track when ML last ran per zone)
-- ============================================================
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  zone_id      TEXT        NOT NULL,
  ran_at       TIMESTAMPTZ DEFAULT NOW(),
  status       TEXT        DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS','FAILED','PARTIAL')),
  hazard_scores JSONB,
  data_sources TEXT[],
  duration_ms  INT,
  error_msg    TEXT
);

CREATE INDEX IF NOT EXISTS pipeline_runs_zone_idx  ON pipeline_runs(zone_id);
CREATE INDEX IF NOT EXISTS pipeline_runs_ran_at_idx ON pipeline_runs(ran_at DESC);

-- ============================================================
-- 9. USER AUTH TABLES (NextAuth v4 compatible)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id                TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name              TEXT,
  email             TEXT        UNIQUE NOT NULL,
  email_verified    TIMESTAMPTZ,
  image             TEXT,
  password_hash     TEXT,
  role              TEXT        DEFAULT 'CITIZEN'
                                CHECK (role IN ('CITIZEN','DEPARTMENT_OFFICIAL','ADMIN','SUPER_ADMIN')),
  mobile_number     TEXT,
  location          TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx  ON users(role);

CREATE TABLE IF NOT EXISTS user_sessions (
  id            TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id       TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT        UNIQUE NOT NULL,
  expires       TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_sessions_token_idx   ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS user_sessions_user_idx    ON user_sessions(user_id);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT        UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT        UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. SEED: ADMIN USER
-- Name: teamsih | Email: teamsih12@gmail.com | Password: 12345678
-- ============================================================
INSERT INTO users (id, name, email, password_hash, role, email_verified, created_at, updated_at)
VALUES (
  'admin-teamsih-001',
  'teamsih',
  'teamsih12@gmail.com',
  '$2b$12$Ng6HSTXjE6Ow7erpp0WoteOP9kFUmmuWVMCi24qwCG9Nt3VeffOLa',
  'ADMIN',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  email_verified = EXCLUDED.email_verified,
  updated_at = NOW();
