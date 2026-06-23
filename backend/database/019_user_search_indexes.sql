-- Fast ILIKE / contains search for admin user list (pg_trgm).
-- Safe to run multiple times.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_users_full_name_trgm
  ON users USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_email_trgm
  ON users USING gin (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_job_title_trgm
  ON users USING gin (job_title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_users_gn_trgm
  ON users USING gin (gn gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_departments_name_trgm
  ON departments USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_roles_name_trgm
  ON roles USING gin (name gin_trgm_ops);
