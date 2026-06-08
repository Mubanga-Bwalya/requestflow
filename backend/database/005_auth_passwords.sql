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
  'jane.employee@requestflow.local',
  'henry.hr@requestflow.local',
  'mary.marketing@requestflow.local',
  'helen.hr@requestflow.local',
  'mark.marketing@requestflow.local',
  'musa.marketing@requestflow.local'
);
