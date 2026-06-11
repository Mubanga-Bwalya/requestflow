-- Data integrity constraints (safe to re-run). Apply after 001 on database requestflow.

-- One OPEN missing-information round per request (app also enforces this).
CREATE UNIQUE INDEX IF NOT EXISTS uq_missing_info_one_open_per_request
  ON missing_information_requests (request_id)
  WHERE status = 'OPEN';

-- Attachment must belong to exactly one parent: request XOR milestone.
ALTER TABLE attachments DROP CONSTRAINT IF EXISTS chk_attachments_parent;
ALTER TABLE attachments ADD CONSTRAINT chk_attachments_parent CHECK (
  (request_id IS NOT NULL AND milestone_id IS NULL)
  OR (request_id IS NULL AND milestone_id IS NOT NULL)
);
