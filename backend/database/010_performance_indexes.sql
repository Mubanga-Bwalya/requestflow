-- Additional indexes for list/filter/count query patterns (safe to re-run).
-- Apply after 006_performance_indexes.sql.

-- Assignment tab filters + tasks-to-start count (status + member join).
CREATE INDEX IF NOT EXISTS idx_assignments_status_updated_at
  ON assignments(status, updated_at DESC);

-- Workspace needsResponse count for requester.
CREATE INDEX IF NOT EXISTS idx_requests_created_by_status
  ON requests(created_by_user_id, status);

-- Admin overdue requests (status + deadline).
CREATE INDEX IF NOT EXISTS idx_requests_status_deadline
  ON requests(status, deadline);

-- Admin completed-this-month reports.
CREATE INDEX IF NOT EXISTS idx_requests_completed_at
  ON requests(completed_at DESC)
  WHERE completed_at IS NOT NULL;

-- ILIKE search on title / request number (requires pg_trgm).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_requests_title_trgm
  ON requests USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_requests_request_number_trgm
  ON requests USING gin (request_number gin_trgm_ops);
