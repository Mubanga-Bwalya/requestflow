-- =============================================================================
-- RequestFlow — Set demo passwords for existing databases
-- =============================================================================
-- Run if 002 was applied before auth passwords were added.
-- Sets password_hash to plain-text "requestflow" for all seeded demo emails.
-- =============================================================================

UPDATE users
SET password_hash = 'requestflow', updated_at = NOW()
WHERE email IN (
  'admin@requestflow.local',
  'jane@requestflow.local',
  'henry@requestflow.local',
  'mary@requestflow.local',
  'helen@requestflow.local',
  'mark@requestflow.local',
  'musa@requestflow.local'
);
