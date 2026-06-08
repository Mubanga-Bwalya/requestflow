-- =============================================================================
-- RequestFlow — Step 1: Schema (tables, enums, indexes, triggers)
-- =============================================================================
-- Prerequisites:
--   - Database `requestflow` exists (run 000_create_database.sql first).
--   - You are connected to database `requestflow`.
--
-- Request numbers (application-level, not generated here):
--   Format RF-YYYY-NNNN e.g. RF-2026-0001
--
-- Progress (application-level, not trigger-based):
--   Assignment/request progress derived from milestone averages in NestJS.
--
-- MVP scope: HR + Marketing only. No chat/comments/discussion tables.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- ENUM types
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM (
    'DRAFT', 'SUBMITTED', 'NEEDS_INFORMATION', 'ACCEPTED', 'ASSIGNED',
    'IN_PROGRESS', 'READY_FOR_REVIEW', 'COMPLETED', 'APPROVED', 'REOPENED',
    'REJECTED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE field_type AS ENUM (
    'TEXT', 'LONG_TEXT', 'DATE', 'DROPDOWN', 'MULTI_SELECT',
    'FILE', 'NUMBER', 'CHECKBOX', 'EMAIL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM (
    'NOT_STARTED', 'ASSIGNED', 'IN_PROGRESS', 'READY_FOR_REVIEW',
    'COMPLETED', 'REOPENED', 'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE milestone_status AS ENUM (
    'NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE missing_information_status AS ENUM ('OPEN', 'RESOLVED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'REQUEST_SUBMITTED', 'REQUEST_NEEDS_INFORMATION', 'REQUEST_ACCEPTED',
    'REQUEST_REJECTED', 'REQUEST_ASSIGNED', 'REQUEST_IN_PROGRESS',
    'REQUEST_COMPLETED', 'REQUEST_APPROVED', 'REQUEST_REOPENED',
    'TASK_ASSIGNED', 'MILESTONE_UPDATED', 'SYSTEM'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_action AS ENUM (
    'REQUEST_CREATED', 'REQUEST_SUBMITTED', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED',
    'REQUEST_NEEDS_INFORMATION', 'REQUEST_ASSIGNED', 'REQUEST_PROGRESS_UPDATED',
    'REQUEST_COMPLETED', 'REQUEST_APPROVED', 'REQUEST_REOPENED',
    'ASSIGNMENT_CREATED', 'ASSIGNMENT_MEMBER_ADDED', 'MILESTONE_CREATED',
    'MILESTONE_UPDATED', 'ATTACHMENT_UPLOADED', 'NOTIFICATION_CREATED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- updated_at trigger function
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Core reference tables
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL UNIQUE,
  description             TEXT,
  manager_user_id         UUID,
  external_department_code TEXT,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name           TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  password_hash       TEXT,
  department_id       UUID REFERENCES departments(id) ON DELETE SET NULL,
  role_id             UUID REFERENCES roles(id) ON DELETE RESTRICT,
  job_title           TEXT,
  external_employee_id TEXT,
  profile_image_url   TEXT,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_departments_manager_user'
  ) THEN
    ALTER TABLE departments
      ADD CONSTRAINT fk_departments_manager_user
      FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Templates
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS request_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_request_templates_department_name UNIQUE (department_id, name)
);

CREATE TABLE IF NOT EXISTS template_fields (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     UUID NOT NULL REFERENCES request_templates(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  field_key       TEXT NOT NULL,
  field_type      field_type NOT NULL,
  is_required     BOOLEAN NOT NULL DEFAULT FALSE,
  options         JSONB,
  help_text       TEXT,
  display_order   INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_template_fields_template_key UNIQUE (template_id, field_key)
);

-- -----------------------------------------------------------------------------
-- Requests and answers
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS requests (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number            TEXT NOT NULL UNIQUE,
  title                     TEXT NOT NULL,
  description               TEXT,
  created_by_user_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  source_department_id      UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  target_department_id      UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  template_id               UUID NOT NULL REFERENCES request_templates(id) ON DELETE RESTRICT,
  status                    request_status NOT NULL DEFAULT 'DRAFT',
  priority                  priority NOT NULL DEFAULT 'MEDIUM',
  deadline                  TIMESTAMPTZ,
  progress_percentage       INTEGER NOT NULL DEFAULT 0,
  current_stage             TEXT,
  expected_completion_date  DATE,
  submitted_at              TIMESTAMPTZ,
  completed_at              TIMESTAMPTZ,
  approved_at               TIMESTAMPTZ,
  rejected_at               TIMESTAMPTZ,
  cancelled_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_requests_progress CHECK (progress_percentage BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS request_field_answers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id        UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  template_field_id UUID NOT NULL REFERENCES template_fields(id) ON DELETE RESTRICT,
  answer_text       TEXT,
  answer_json       JSONB,
  file_url          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_request_field_answers_request_field UNIQUE (request_id, template_field_id)
);

-- -----------------------------------------------------------------------------
-- Missing information workflow
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS missing_information_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id          UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status              missing_information_status NOT NULL DEFAULT 'OPEN',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS missing_information_items (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  missing_information_request_id UUID NOT NULL REFERENCES missing_information_requests(id) ON DELETE CASCADE,
  template_field_id             UUID REFERENCES template_fields(id) ON DELETE SET NULL,
  reason_label                  TEXT NOT NULL,
  is_resolved                   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at                   TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- Assignments and milestones
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS assignments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id                UUID NOT NULL UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
  title                     TEXT NOT NULL,
  description               TEXT,
  assigned_by_user_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department_id             UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  status                    assignment_status NOT NULL DEFAULT 'NOT_STARTED',
  progress_percentage       INTEGER NOT NULL DEFAULT 0,
  deadline                  TIMESTAMPTZ,
  expected_completion_date  DATE,
  ready_for_review_at       TIMESTAMPTZ,
  completed_at              TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_assignments_progress CHECK (progress_percentage BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS assignment_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id       UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  role_on_assignment  TEXT,
  is_manager_member   BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_assignment_members_assignment_user UNIQUE (assignment_id, user_id)
);

CREATE TABLE IF NOT EXISTS milestones (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id       UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  owner_user_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title               TEXT NOT NULL,
  description         TEXT,
  status              milestone_status NOT NULL DEFAULT 'NOT_STARTED',
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  deadline            TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_milestones_progress CHECK (progress_percentage BETWEEN 0 AND 100)
);

-- -----------------------------------------------------------------------------
-- Attachments, notifications, activity
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS attachments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id          UUID REFERENCES requests(id) ON DELETE CASCADE,
  milestone_id        UUID REFERENCES milestones(id) ON DELETE CASCADE,
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  file_name           TEXT NOT NULL,
  file_url            TEXT NOT NULL,
  file_type           TEXT,
  file_size           BIGINT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_attachments_parent CHECK (
    request_id IS NOT NULL OR milestone_id IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS notifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                  notification_type NOT NULL,
  title                 TEXT NOT NULL,
  message               TEXT NOT NULL,
  related_request_id    UUID REFERENCES requests(id) ON DELETE SET NULL,
  related_assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
  related_milestone_id  UUID REFERENCES milestones(id) ON DELETE SET NULL,
  is_read               BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID REFERENCES requests(id) ON DELETE CASCADE,
  assignment_id   UUID REFERENCES assignments(id) ON DELETE CASCADE,
  milestone_id    UUID REFERENCES milestones(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  action          activity_action NOT NULL,
  description     TEXT NOT NULL,
  old_value       JSONB,
  new_value       JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);

CREATE INDEX IF NOT EXISTS idx_departments_manager_user_id ON departments(manager_user_id);

CREATE INDEX IF NOT EXISTS idx_request_templates_department_id ON request_templates(department_id);
CREATE INDEX IF NOT EXISTS idx_template_fields_template_id ON template_fields(template_id);

CREATE INDEX IF NOT EXISTS idx_requests_created_by_user_id ON requests(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_requests_target_department_id ON requests(target_department_id);
CREATE INDEX IF NOT EXISTS idx_requests_source_department_id ON requests(source_department_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_priority ON requests(priority);
CREATE INDEX IF NOT EXISTS idx_requests_deadline ON requests(deadline);

CREATE INDEX IF NOT EXISTS idx_assignments_request_id ON assignments(request_id);
CREATE INDEX IF NOT EXISTS idx_assignments_department_id ON assignments(department_id);

CREATE INDEX IF NOT EXISTS idx_assignment_members_assignment_id ON assignment_members(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_members_user_id ON assignment_members(user_id);

CREATE INDEX IF NOT EXISTS idx_milestones_assignment_id ON milestones(assignment_id);
CREATE INDEX IF NOT EXISTS idx_milestones_owner_user_id ON milestones(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_activity_logs_request_id ON activity_logs(request_id);

CREATE INDEX IF NOT EXISTS idx_missing_information_requests_request_id ON missing_information_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_request_field_answers_request_id ON request_field_answers(request_id);

-- -----------------------------------------------------------------------------
-- updated_at triggers (create only if missing — avoids NOTICE on first run)
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'departments', 'roles', 'users', 'request_templates', 'template_fields',
    'requests', 'request_field_answers', 'assignments', 'milestones'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger t
      JOIN pg_class c ON c.oid = t.tgrelid
      WHERE t.tgname = 'trg_' || tbl || '_updated_at'
        AND c.relname = tbl
        AND NOT t.tgisinternal
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;
