-- =============================================================================
-- RequestFlow — Billing + Innovations departments, roles, users, templates
-- =============================================================================
-- HISTORICAL / upgrade path — superseded by 002 for new installs (see database/README.md).
-- Ivan email here is mbwalya4477@gmail.com; live DB may already differ.
-- Idempotent. Safe to re-run on existing DBs that already have HR + Marketing.
-- Demo password for all users: requestflow (bcrypt hash below)
--
-- Run:
--   cd backend
--   npx prisma db execute --file database/012_add_billing_innovations.sql --schema prisma/schema.prisma
-- =============================================================================

BEGIN;

INSERT INTO departments (id, name, description, external_department_code, is_active)
VALUES
  ('d1111111-1111-4111-8111-111111110003', 'Billing', 'Billing and payment support', 'DEPT-BIL', TRUE),
  ('d1111111-1111-4111-8111-111111110004', 'Innovations', 'Software, systems, and digital support', 'DEPT-INN', TRUE)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  external_department_code = EXCLUDED.external_department_code,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO roles (id, name, description, is_active)
VALUES
  ('b1111111-1111-4111-8111-111111110008', 'Billing Manager', 'Review and assign Billing requests', TRUE),
  ('b1111111-1111-4111-8111-111111110009', 'Billing Team Member', 'Execute Billing assignments and milestones', TRUE),
  ('b1111111-1111-4111-8111-111111110010', 'Innovations Manager', 'Review and assign Innovations requests', TRUE),
  ('b1111111-1111-4111-8111-111111110011', 'Innovations Team Member', 'Execute Innovations assignments and milestones', TRUE)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO users (id, full_name, email, password_hash, department_id, role_id, job_title, is_active)
VALUES
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

UPDATE departments SET manager_user_id = 'c1111111-1111-4111-8111-111111110011', updated_at = NOW()
WHERE name = 'Billing';

UPDATE departments SET manager_user_id = 'c1111111-1111-4111-8111-111111110015', updated_at = NOW()
WHERE name = 'Innovations';

INSERT INTO request_templates (id, department_id, name, description, is_active)
VALUES
  ('e2222222-2222-4222-8222-222222220401', 'd1111111-1111-4111-8111-111111110003',
   'Invoice Support Request', 'Payment, invoice, or statement queries', TRUE),
  ('e2222222-2222-4222-8222-222222220402', 'd1111111-1111-4111-8111-111111110003',
   'Account Billing Query', 'Account charges, credits, and billing adjustments', TRUE),
  ('e2222222-2222-4222-8222-222222220501', 'd1111111-1111-4111-8111-111111110004',
   'Software Support Request', 'Application bugs, access, and software issues', TRUE),
  ('e2222222-2222-4222-8222-222222220502', 'd1111111-1111-4111-8111-111111110004',
   'System Change Request', 'New features, integrations, or system changes', TRUE)
ON CONFLICT (department_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO template_fields (template_id, field_key, label, field_type, is_required, options, help_text, display_order, is_active)
VALUES
  ('e2222222-2222-4222-8222-222222220401', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220401', 'description', 'Issue description', 'LONG_TEXT', TRUE, NULL, NULL, 2, TRUE),
  ('e2222222-2222-4222-8222-222222220401', 'account_number', 'Account / invoice number', 'TEXT', TRUE, NULL, NULL, 3, TRUE),
  ('e2222222-2222-4222-8222-222222220401', 'urgency', 'Urgency', 'DROPDOWN', TRUE, '["Low","Medium","High","Urgent"]', NULL, 4, TRUE),
  ('e2222222-2222-4222-8222-222222220401', 'required_by', 'Required by date', 'DATE', TRUE, NULL, NULL, 5, TRUE),

  ('e2222222-2222-4222-8222-222222220402', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220402', 'description', 'Query details', 'LONG_TEXT', TRUE, NULL, NULL, 2, TRUE),
  ('e2222222-2222-4222-8222-222222220402', 'billing_period', 'Billing period', 'TEXT', TRUE, NULL, 'e.g. March 2026', 3, TRUE),
  ('e2222222-2222-4222-8222-222222220402', 'query_type', 'Query type', 'DROPDOWN', TRUE, '["Charge dispute","Credit request","Statement copy","Other"]', NULL, 4, TRUE),
  ('e2222222-2222-4222-8222-222222220402', 'required_by', 'Required by date', 'DATE', TRUE, NULL, NULL, 5, TRUE),

  ('e2222222-2222-4222-8222-222222220501', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220501', 'description', 'Issue description', 'LONG_TEXT', TRUE, NULL, NULL, 2, TRUE),
  ('e2222222-2222-4222-8222-222222220501', 'system_name', 'System / application', 'TEXT', TRUE, NULL, NULL, 3, TRUE),
  ('e2222222-2222-4222-8222-222222220501', 'impact', 'Impact', 'DROPDOWN', TRUE, '["Low","Medium","High","Critical"]', NULL, 4, TRUE),
  ('e2222222-2222-4222-8222-222222220501', 'required_by', 'Required by date', 'DATE', FALSE, NULL, NULL, 5, TRUE),

  ('e2222222-2222-4222-8222-222222220502', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220502', 'description', 'Change summary', 'LONG_TEXT', TRUE, NULL, NULL, 2, TRUE),
  ('e2222222-2222-4222-8222-222222220502', 'change_type', 'Change type', 'DROPDOWN', TRUE, '["Enhancement","Integration","New system","Process change"]', NULL, 3, TRUE),
  ('e2222222-2222-4222-8222-222222220502', 'business_owner', 'Business owner', 'TEXT', TRUE, NULL, NULL, 4, TRUE),
  ('e2222222-2222-4222-8222-222222220502', 'target_date', 'Target delivery date', 'DATE', TRUE, NULL, NULL, 5, TRUE)
ON CONFLICT (template_id, field_key) DO UPDATE SET
  label = EXCLUDED.label,
  field_type = EXCLUDED.field_type,
  is_required = EXCLUDED.is_required,
  options = EXCLUDED.options,
  help_text = EXCLUDED.help_text,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

COMMIT;
