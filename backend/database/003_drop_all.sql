-- =============================================================================
-- RequestFlow — Local reset: drop all application objects
-- =============================================================================
-- WARNING: Destructive. Deletes all RequestFlow tables and enum types.
-- Run while connected to database `requestflow`.
--
-- Typical local reset:
--   psql -U postgres -d requestflow -f backend/database/003_drop_all.sql
--   bash backend/database/apply-migrations.sh
--   cd backend && npm run db:seed
-- =============================================================================

-- Drop tables (reverse dependency order)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS assignment_members CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS missing_information_items CASCADE;
DROP TABLE IF EXISTS missing_information_requests CASCADE;
DROP TABLE IF EXISTS request_field_answers CASCADE;
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS template_fields CASCADE;
DROP TABLE IF EXISTS request_templates CASCADE;
DROP TABLE IF EXISTS system_events CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS request_number_sequences CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Drop trigger function
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS system_event_level CASCADE;
DROP TYPE IF EXISTS activity_action CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS missing_information_status CASCADE;
DROP TYPE IF EXISTS milestone_status CASCADE;
DROP TYPE IF EXISTS assignment_status CASCADE;
DROP TYPE IF EXISTS field_type CASCADE;
DROP TYPE IF EXISTS priority CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;

-- Extension pgcrypto is left installed (harmless; shared with other apps)
