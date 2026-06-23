-- 018_add_department_sections.sql
--
-- Adds a self-referential parent to departments so a department can have
-- sub-sections (each a child department row with its own manager). Hierarchy is
-- two levels only; that rule is enforced in the application layer.
--
-- Idempotent: safe to run more than once.

ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS parent_department_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'departments_parent_department_id_fkey'
  ) THEN
    ALTER TABLE departments
      ADD CONSTRAINT departments_parent_department_id_fkey
      FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_departments_parent_department_id
  ON departments(parent_department_id);
