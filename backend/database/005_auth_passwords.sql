-- =============================================================================
-- DISABLED — plaintext password seed (historical)
-- =============================================================================
-- This file no longer modifies data. The old script is quarantined under
-- backend/database/deprecated/005_auth_passwords.sql
--
-- To bcrypt-hash legacy plaintext password_hash values (one-time):
--   npm run hash-passwords --workspace=backend
--
-- Never re-enable plaintext password writes in SQL or seed scripts.
-- =============================================================================

SELECT 1;
