-- ============================================================
-- 002_grant_service_role.sql
-- Run this in Supabase Dashboard → SQL Editor
-- Grants the service_role bypass access to all app tables
-- (service_role already bypasses RLS by default, but explicit
--  grants ensure PostgREST exposes the tables correctly)
-- ============================================================

-- Enable RLS on all tables (so anon users can't read directly)
ALTER TABLE IF EXISTS relocation_sites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS relocation_plans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS relocation_allocations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS zone_analytics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pipeline_runs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS email_verification_tokens  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS password_reset_tokens      ENABLE ROW LEVEL SECURITY;

-- Grant service_role FULL access to all tables (bypasses RLS)
GRANT ALL ON relocation_sites           TO service_role;
GRANT ALL ON relocation_plans           TO service_role;
GRANT ALL ON relocation_allocations     TO service_role;
GRANT ALL ON zone_analytics             TO service_role;
GRANT ALL ON alert_log                  TO service_role;
GRANT ALL ON pipeline_runs              TO service_role;
GRANT ALL ON users                      TO service_role;
GRANT ALL ON user_sessions              TO service_role;
GRANT ALL ON email_verification_tokens  TO service_role;
GRANT ALL ON password_reset_tokens      TO service_role;
GRANT ALL ON zones                      TO service_role;
GRANT ALL ON zone_classifications       TO service_role;

-- Also grant to postgres role (owner)
GRANT ALL ON relocation_sites           TO postgres;
GRANT ALL ON relocation_plans           TO postgres;
GRANT ALL ON relocation_allocations     TO postgres;
GRANT ALL ON zone_analytics             TO postgres;
GRANT ALL ON pipeline_runs              TO postgres;
GRANT ALL ON users                      TO postgres;
GRANT ALL ON user_sessions              TO postgres;
GRANT ALL ON email_verification_tokens  TO postgres;
GRANT ALL ON password_reset_tokens      TO postgres;

-- Expose tables to PostgREST (needed for REST API access with service_role)
NOTIFY pgrst, 'reload schema';
