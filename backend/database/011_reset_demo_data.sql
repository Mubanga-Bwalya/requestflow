-- =============================================================================
-- RequestFlow — Reset transactional data and reseed demo users (keeps admin)
-- =============================================================================
-- DESTRUCTIVE / DEV-ONLY — not run by apply-migrations.sh. May not match live demo DB
-- (Jane removed; Ivan uses mbwalya4477@gmail.com in current environment).
-- Clears requests, assignments, notifications, logs, etc.
-- Removes all users except admin@requestflow.local, then seeds:
--   HR, Marketing, Billing, Innovations — 4 users each (1 manager + 3 team members)
-- Demo password for all users: requestflow (bcrypt hash below)
--
-- Run:
--   psql -U postgres -d requestflow -f backend/database/011_reset_demo_data.sql
-- =============================================================================

BEGIN;

-- Clear department manager links before user deletes
UPDATE departments SET manager_user_id = NULL, updated_at = NOW()
WHERE manager_user_id IS NOT NULL
  AND manager_user_id <> 'c1111111-1111-4111-8111-111111110001';

-- Transactional / operational data (dependency order)
DELETE FROM activity_logs;
DELETE FROM notifications;
DELETE FROM attachments;
DELETE FROM milestones;
DELETE FROM assignment_members;
DELETE FROM assignments;
DELETE FROM missing_information_items;
DELETE FROM missing_information_requests;
DELETE FROM request_field_answers;
DELETE FROM requests;

DELETE FROM system_events WHERE TRUE;

TRUNCATE request_number_sequences;

-- Remove demo users (keep admin)
DELETE FROM users
WHERE email <> 'admin@requestflow.local';

-- -----------------------------------------------------------------------------
-- Reseed users — name@requestflow.local
-- -----------------------------------------------------------------------------

INSERT INTO users (id, full_name, email, password_hash, department_id, role_id, job_title, is_active)
VALUES
  -- HR (manager + 3 team members)
  ('c1111111-1111-4111-8111-111111110003', 'Henry', 'henry@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110001', 'b1111111-1111-4111-8111-111111110003', 'HR Manager', TRUE),
  ('c1111111-1111-4111-8111-111111110005', 'Helen', 'helen@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110001', 'b1111111-1111-4111-8111-111111110005', 'HR Officer', TRUE),
  ('c1111111-1111-4111-8111-111111110008', 'Hannah', 'hannah@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110001', 'b1111111-1111-4111-8111-111111110005', 'HR Officer', TRUE),
  ('c1111111-1111-4111-8111-111111110009', 'Hugo', 'hugo@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110001', 'b1111111-1111-4111-8111-111111110005', 'HR Officer', TRUE),
  -- Marketing (manager + 3 team members)
  ('c1111111-1111-4111-8111-111111110004', 'Mary', 'mary@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110002', 'b1111111-1111-4111-8111-111111110004', 'Marketing Manager', TRUE),
  ('c1111111-1111-4111-8111-111111110006', 'Mark', 'mark@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110002', 'b1111111-1111-4111-8111-111111110006', 'Marketing Designer', TRUE),
  ('c1111111-1111-4111-8111-111111110007', 'Musa', 'musa@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110002', 'b1111111-1111-4111-8111-111111110006', 'Marketing Assistant', TRUE),
  ('c1111111-1111-4111-8111-111111110010', 'Mia', 'mia@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110002', 'b1111111-1111-4111-8111-111111110006', 'Marketing Assistant', TRUE),
  -- Billing (manager + 3 team members)
  ('c1111111-1111-4111-8111-111111110011', 'Ben', 'ben@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110003', 'b1111111-1111-4111-8111-111111110008', 'Billing Manager', TRUE),
  ('c1111111-1111-4111-8111-111111110012', 'Beth', 'beth@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110003', 'b1111111-1111-4111-8111-111111110009', 'Billing Officer', TRUE),
  ('c1111111-1111-4111-8111-111111110013', 'Blake', 'blake@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110003', 'b1111111-1111-4111-8111-111111110009', 'Billing Officer', TRUE),
  ('c1111111-1111-4111-8111-111111110014', 'Brooke', 'brooke@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110003', 'b1111111-1111-4111-8111-111111110009', 'Billing Officer', TRUE),
  -- Innovations (manager + 3 team members)
  ('c1111111-1111-4111-8111-111111110015', 'Ivan', 'mbwalya4477@gmail.com',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110004', 'b1111111-1111-4111-8111-111111110010', 'Innovations Manager', TRUE),
  ('c1111111-1111-4111-8111-111111110016', 'Iris', 'iris@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110004', 'b1111111-1111-4111-8111-111111110011', 'Innovations Analyst', TRUE),
  ('c1111111-1111-4111-8111-111111110017', 'Isaac', 'isaac@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110004', 'b1111111-1111-4111-8111-111111110011', 'Innovations Analyst', TRUE),
  ('c1111111-1111-4111-8111-111111110018', 'Imani', 'imani@requestflow.local',
   '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110004', 'b1111111-1111-4111-8111-111111110011', 'Innovations Analyst', TRUE)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  department_id = EXCLUDED.department_id,
  role_id = EXCLUDED.role_id,
  job_title = EXCLUDED.job_title,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

UPDATE departments SET manager_user_id = 'c1111111-1111-4111-8111-111111110003', updated_at = NOW()
WHERE name = 'HR';

UPDATE departments SET manager_user_id = 'c1111111-1111-4111-8111-111111110004', updated_at = NOW()
WHERE name = 'Marketing';

UPDATE departments SET manager_user_id = 'c1111111-1111-4111-8111-111111110011', updated_at = NOW()
WHERE name = 'Billing';

UPDATE departments SET manager_user_id = 'c1111111-1111-4111-8111-111111110015', updated_at = NOW()
WHERE name = 'Innovations';

COMMIT;
