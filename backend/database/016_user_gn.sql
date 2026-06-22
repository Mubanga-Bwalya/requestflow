-- Add Zamtel staff number (GN) to users.
-- Populated on first Zamtel sign-in; unique when present (NULLs allowed for
-- users that have not yet authenticated against the Zamtel staff service).
-- Safe to run multiple times.

ALTER TABLE users ADD COLUMN IF NOT EXISTS gn TEXT;

-- Unique index; Postgres treats NULLs as distinct, so many users may have NULL gn.
CREATE UNIQUE INDEX IF NOT EXISTS users_gn_key ON users (gn);
