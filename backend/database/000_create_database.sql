-- =============================================================================
-- RequestFlow — Step 0: Create database
-- =============================================================================
-- Run this script while connected to the default `postgres` database
-- (or another maintenance database). Do NOT run it while already connected
-- to `requestflow`.
--
-- Example (psql):
--   psql -U postgres -d postgres -f 000_create_database.sql
--
-- Example (pgAdmin):
--   Connect to PostgreSQL → open Query Tool on database `postgres` → run this file.
--
-- After this succeeds, connect to `requestflow` before running:
--   001_create_schema.sql
--   002_seed_core_data.sql
-- =============================================================================

CREATE DATABASE requestflow
    WITH
    OWNER = postgres
    ENCODING = 'UTF8'
    LOCALE_PROVIDER = 'libc'
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;
