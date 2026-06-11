-- Allow one user to manage multiple departments.
-- Drops Prisma @unique on departments.manager_user_id if it was applied to the database.
-- Safe to run multiple times.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'departments_manager_user_id_key'
  ) THEN
    ALTER TABLE departments DROP CONSTRAINT departments_manager_user_id_key;
  END IF;
END $$;
