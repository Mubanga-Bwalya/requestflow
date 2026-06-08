-- =============================================================================
-- RequestFlow — System settings (single-row MVP)
-- =============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id                      TEXT PRIMARY KEY DEFAULT 'default',
  system_name             TEXT NOT NULL DEFAULT 'RequestFlow',
  default_priority        priority NOT NULL DEFAULT 'MEDIUM',
  allow_uploads           BOOLEAN NOT NULL DEFAULT TRUE,
  notify_on_status_change BOOLEAN NOT NULL DEFAULT TRUE,
  file_upload_limit_mb    INTEGER NOT NULL DEFAULT 25,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO system_settings (
  id,
  system_name,
  default_priority,
  allow_uploads,
  notify_on_status_change,
  file_upload_limit_mb
)
VALUES (
  'default',
  'RequestFlow',
  'MEDIUM',
  TRUE,
  TRUE,
  25
)
ON CONFLICT (id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  default_priority = EXCLUDED.default_priority,
  allow_uploads = EXCLUDED.allow_uploads,
  notify_on_status_change = EXCLUDED.notify_on_status_change,
  file_upload_limit_mb = EXCLUDED.file_upload_limit_mb,
  updated_at = NOW();
