-- Operational / error events for admin debugging (apply after 001 on database requestflow).

CREATE TYPE system_event_level AS ENUM ('WARN', 'ERROR');

CREATE TABLE system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level system_event_level NOT NULL,
  code VARCHAR(64) NOT NULL,
  message TEXT NOT NULL,
  http_method VARCHAR(16),
  path TEXT,
  status_code INT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  request_id VARCHAR(64),
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_system_events_created_at ON system_events (created_at DESC);
