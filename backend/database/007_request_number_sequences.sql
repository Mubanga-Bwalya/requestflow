-- Atomic per-year counters for RF-YYYY-NNNN request numbers (safe under concurrency).
-- Apply after 001_create_schema.sql on database `requestflow`.

CREATE TABLE IF NOT EXISTS request_number_sequences (
  year        INT PRIMARY KEY,
  last_value  INT NOT NULL DEFAULT 0
);
