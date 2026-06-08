-- Performance indexes for common list/filter queries (safe to re-run).

CREATE INDEX IF NOT EXISTS idx_requests_created_by_created_at
  ON requests(created_by_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_requests_target_dept_status
  ON requests(target_department_id, status);

CREATE INDEX IF NOT EXISTS idx_requests_target_dept_created_at
  ON requests(target_department_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at
  ON activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assignments_updated_at
  ON assignments(updated_at DESC);

-- Composite index (001 already has idx_assignment_members_user_id on user_id alone).
CREATE INDEX IF NOT EXISTS idx_assignment_members_user_assignment
  ON assignment_members(user_id, assignment_id);
