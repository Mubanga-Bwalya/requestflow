-- =============================================================================
-- RequestFlow — Step 2: Core MVP seed data
-- =============================================================================
-- Prerequisites: 001_create_schema.sql has been applied on database `requestflow`.
-- Idempotent: safe to re-run (uses fixed UUIDs + ON CONFLICT).
-- UUIDs use hex digits only (0-9, a-f): b=roles, c=users, d=departments, e=templates.
-- password_hash: bcrypt of demo password "requestflow" (cost 10).
--
-- If you see "current transaction is aborted" (SQL state 25P02), a previous run
-- failed mid-transaction. Run ROLLBACK; once, or re-run this whole file (starts
-- with ROLLBACK below).
-- =============================================================================

ROLLBACK;

BEGIN;

-- -----------------------------------------------------------------------------
-- Departments
-- -----------------------------------------------------------------------------

INSERT INTO departments (id, name, description, external_department_code, is_active)
VALUES
  ('d1111111-1111-4111-8111-111111110001', 'HR', 'Human Resources department', 'DEPT-HR', TRUE),
  ('d1111111-1111-4111-8111-111111110002', 'Marketing', 'Marketing and communications department', 'DEPT-MKT', TRUE)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  external_department_code = EXCLUDED.external_department_code,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Roles
-- -----------------------------------------------------------------------------

INSERT INTO roles (id, name, description, is_active)
VALUES
  ('b1111111-1111-4111-8111-111111110001', 'Admin', 'Full system configuration access', TRUE),
  ('b1111111-1111-4111-8111-111111110002', 'Employee', 'Create requests and view own progress', TRUE),
  ('b1111111-1111-4111-8111-111111110007', 'Manager', 'Review and assign requests for their department', TRUE),
  ('b1111111-1111-4111-8111-111111110003', 'HR Manager', 'Review and assign HR requests', TRUE),
  ('b1111111-1111-4111-8111-111111110004', 'Marketing Manager', 'Review and assign Marketing requests', TRUE),
  ('b1111111-1111-4111-8111-111111110005', 'HR Team Member', 'Execute HR assignments and milestones', TRUE),
  ('b1111111-1111-4111-8111-111111110006', 'Marketing Team Member', 'Execute Marketing assignments and milestones', TRUE)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Users (demo password: requestflow — stored as bcrypt)
-- -----------------------------------------------------------------------------

INSERT INTO users (id, full_name, email, password_hash, department_id, role_id, job_title, is_active)
VALUES
  ('c1111111-1111-4111-8111-111111110001', 'System Admin', 'admin@requestflow.local', '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110001', 'b1111111-1111-4111-8111-111111110001', 'System Administrator', TRUE),
  ('c1111111-1111-4111-8111-111111110002', 'Jane Employee', 'jane.employee@requestflow.local', '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110001', 'b1111111-1111-4111-8111-111111110002', 'General Employee', TRUE),
  ('c1111111-1111-4111-8111-111111110003', 'Henry HR Manager', 'henry.hr@requestflow.local', '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110001', 'b1111111-1111-4111-8111-111111110003', 'HR Manager', TRUE),
  ('c1111111-1111-4111-8111-111111110004', 'Mary Marketing Manager', 'mary.marketing@requestflow.local', '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110002', 'b1111111-1111-4111-8111-111111110004', 'Marketing Manager', TRUE),
  ('c1111111-1111-4111-8111-111111110005', 'Helen HR Officer', 'helen.hr@requestflow.local', '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110001', 'b1111111-1111-4111-8111-111111110005', 'HR Officer', TRUE),
  ('c1111111-1111-4111-8111-111111110006', 'Mark Marketing Designer', 'mark.marketing@requestflow.local', '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110002', 'b1111111-1111-4111-8111-111111110006', 'Graphic Designer', TRUE),
  ('c1111111-1111-4111-8111-111111110007', 'Musa Marketing Assistant', 'musa.marketing@requestflow.local', '$2b$10$z7FHlhnvAWYSK9tWSTbRFeKHzGKFWyDHk7jd4eFmbCU22VOWuHztK',
   'd1111111-1111-4111-8111-111111110002', 'b1111111-1111-4111-8111-111111110006', 'Marketing Assistant', TRUE)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  password_hash = EXCLUDED.password_hash,
  department_id = EXCLUDED.department_id,
  role_id = EXCLUDED.role_id,
  job_title = EXCLUDED.job_title,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Department managers
UPDATE departments SET manager_user_id = 'c1111111-1111-4111-8111-111111110003', updated_at = NOW()
WHERE name = 'HR';

UPDATE departments SET manager_user_id = 'c1111111-1111-4111-8111-111111110004', updated_at = NOW()
WHERE name = 'Marketing';

-- -----------------------------------------------------------------------------
-- Request templates
-- -----------------------------------------------------------------------------

INSERT INTO request_templates (id, department_id, name, description, is_active)
VALUES
  -- Marketing
  ('e2222222-2222-4222-8222-222222220201', 'd1111111-1111-4111-8111-111111110002',
   'Graphic Design Request', 'Posters, banners, and visual creative assets', TRUE),
  ('e2222222-2222-4222-8222-222222220202', 'd1111111-1111-4111-8111-111111110002',
   'Social Media Post Request', 'Channel-specific social content', TRUE),
  ('e2222222-2222-4222-8222-222222220203', 'd1111111-1111-4111-8111-111111110002',
   'Campaign Support Request', 'Multi-channel campaign planning and assets', TRUE),
  ('e2222222-2222-4222-8222-222222220204', 'd1111111-1111-4111-8111-111111110002',
   'Event Promotion Request', 'Promotion for internal or external events', TRUE),
  ('e2222222-2222-4222-8222-222222220205', 'd1111111-1111-4111-8111-111111110002',
   'Brand Asset Request', 'Logos, templates, and brand-compliant materials', TRUE),
  ('e2222222-2222-4222-8222-222222220206', 'd1111111-1111-4111-8111-111111110002',
   'Website Content Update Request', 'Updates to public or intranet web content', TRUE),
  -- HR
  ('e2222222-2222-4222-8222-222222220301', 'd1111111-1111-4111-8111-111111110001',
   'Recruitment Request', 'Hiring and vacancy support', TRUE),
  ('e2222222-2222-4222-8222-222222220302', 'd1111111-1111-4111-8111-111111110001',
   'Employee Onboarding Request', 'New hire onboarding coordination', TRUE),
  ('e2222222-2222-4222-8222-222222220303', 'd1111111-1111-4111-8111-111111110001',
   'Training Request', 'Training delivery and materials', TRUE),
  ('e2222222-2222-4222-8222-222222220304', 'd1111111-1111-4111-8111-111111110001',
   'Leave / Absence Support Request', 'Leave-related HR support', TRUE),
  ('e2222222-2222-4222-8222-222222220305', 'd1111111-1111-4111-8111-111111110001',
   'Employee Document Request', 'Letters, certificates, and HR documents', TRUE),
  ('e2222222-2222-4222-8222-222222220306', 'd1111111-1111-4111-8111-111111110001',
   'Policy / HR Support Request', 'Policy guidance and general HR queries', TRUE)
ON CONFLICT (department_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- -----------------------------------------------------------------------------
-- Template fields (aligned with MVP prototype + extended templates)
-- options stored as JSONB arrays where applicable
-- -----------------------------------------------------------------------------

INSERT INTO template_fields (template_id, field_key, label, field_type, is_required, options, help_text, display_order, is_active)
VALUES
  -- Graphic Design Request
  ('e2222222-2222-4222-8222-222222220201', 'title', 'Request title', 'TEXT', TRUE, NULL, 'Short summary of the design need', 1, TRUE),
  ('e2222222-2222-4222-8222-222222220201', 'description', 'Description / purpose', 'LONG_TEXT', TRUE, NULL, 'What you need and expected output', 2, TRUE),
  ('e2222222-2222-4222-8222-222222220201', 'dimensions', 'Required dimensions', 'TEXT', TRUE, NULL, 'e.g. A3 / 1080x1080', 3, TRUE),
  ('e2222222-2222-4222-8222-222222220201', 'delivery_format', 'Delivery format', 'DROPDOWN', TRUE, '["PNG","JPG","PDF","Print-ready PDF","Other"]', NULL, 4, TRUE),
  ('e2222222-2222-4222-8222-222222220201', 'deadline', 'Required by date', 'DATE', TRUE, NULL, NULL, 5, TRUE),
  ('e2222222-2222-4222-8222-222222220201', 'brand_guidelines', 'Follow brand guidelines', 'CHECKBOX', FALSE, NULL, NULL, 6, TRUE),
  ('e2222222-2222-4222-8222-222222220201', 'target_audience', 'Target audience', 'TEXT', FALSE, NULL, NULL, 7, TRUE),
  ('e2222222-2222-4222-8222-222222220201', 'assets', 'Attachments', 'FILE', FALSE, NULL, 'Reference images or brief documents', 8, TRUE),

  -- Social Media Post Request
  ('e2222222-2222-4222-8222-222222220202', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220202', 'description', 'Copy / message', 'LONG_TEXT', TRUE, NULL, 'Message to communicate', 2, TRUE),
  ('e2222222-2222-4222-8222-222222220202', 'channel', 'Channel', 'DROPDOWN', TRUE, '["Facebook","X (Twitter)","Instagram","LinkedIn"]', NULL, 3, TRUE),
  ('e2222222-2222-4222-8222-222222220202', 'publish_date', 'Publish date', 'DATE', TRUE, NULL, NULL, 4, TRUE),
  ('e2222222-2222-4222-8222-222222220202', 'tone', 'Tone', 'DROPDOWN', FALSE, '["Formal","Friendly","Promotional","Informative"]', NULL, 5, TRUE),
  ('e2222222-2222-4222-8222-222222220202', 'call_to_action', 'Call to action', 'TEXT', FALSE, NULL, NULL, 6, TRUE),
  ('e2222222-2222-4222-8222-222222220202', 'approval_needed', 'Manager approval required', 'CHECKBOX', FALSE, NULL, NULL, 7, TRUE),
  ('e2222222-2222-4222-8222-222222220202', 'assets', 'Attachments', 'FILE', FALSE, NULL, NULL, 8, TRUE),

  -- Campaign Support Request
  ('e2222222-2222-4222-8222-222222220203', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220203', 'description', 'Campaign overview', 'LONG_TEXT', TRUE, NULL, NULL, 2, TRUE),
  ('e2222222-2222-4222-8222-222222220203', 'campaign_name', 'Campaign name', 'TEXT', TRUE, NULL, NULL, 3, TRUE),
  ('e2222222-2222-4222-8222-222222220203', 'start_date', 'Campaign start date', 'DATE', TRUE, NULL, NULL, 4, TRUE),
  ('e2222222-2222-4222-8222-222222220203', 'end_date', 'Campaign end date', 'DATE', TRUE, NULL, NULL, 5, TRUE),
  ('e2222222-2222-4222-8222-222222220203', 'channels', 'Channels', 'MULTI_SELECT', TRUE, '["Email","SMS","Social Media","Print","Radio","Events"]', NULL, 6, TRUE),
  ('e2222222-2222-4222-8222-222222220203', 'budget_estimate', 'Estimated budget (ZMW)', 'NUMBER', FALSE, NULL, NULL, 7, TRUE),
  ('e2222222-2222-4222-8222-222222220203', 'assets', 'Attachments', 'FILE', FALSE, NULL, 'Briefs or reference materials', 8, TRUE),

  -- Event Promotion Request
  ('e2222222-2222-4222-8222-222222220204', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220204', 'description', 'Event description', 'LONG_TEXT', TRUE, NULL, NULL, 2, TRUE),
  ('e2222222-2222-4222-8222-222222220204', 'event_name', 'Event name', 'TEXT', TRUE, NULL, NULL, 3, TRUE),
  ('e2222222-2222-4222-8222-222222220204', 'event_date', 'Event date', 'DATE', TRUE, NULL, NULL, 4, TRUE),
  ('e2222222-2222-4222-8222-222222220204', 'venue', 'Venue / location', 'TEXT', TRUE, NULL, NULL, 5, TRUE),
  ('e2222222-2222-4222-8222-222222220204', 'target_audience', 'Target audience', 'TEXT', TRUE, NULL, NULL, 6, TRUE),
  ('e2222222-2222-4222-8222-222222220204', 'promotion_channels', 'Promotion channels', 'MULTI_SELECT', TRUE, '["Posters","Email","Social Media","Intranet","SMS"]', NULL, 7, TRUE),
  ('e2222222-2222-4222-8222-222222220204', 'assets', 'Attachments', 'FILE', FALSE, NULL, NULL, 8, TRUE),

  -- Brand Asset Request
  ('e2222222-2222-4222-8222-222222220205', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220205', 'description', 'Asset description', 'LONG_TEXT', TRUE, NULL, NULL, 2, TRUE),
  ('e2222222-2222-4222-8222-222222220205', 'asset_type', 'Asset type', 'DROPDOWN', TRUE, '["Logo","Template","Icon","Presentation","Other"]', NULL, 3, TRUE),
  ('e2222222-2222-4222-8222-222222220205', 'usage_context', 'Usage context', 'LONG_TEXT', TRUE, NULL, 'Where the asset will be used', 4, TRUE),
  ('e2222222-2222-4222-8222-222222220205', 'file_format', 'Preferred file format', 'DROPDOWN', TRUE, '["PNG","SVG","PDF","PPTX","AI"]', NULL, 5, TRUE),
  ('e2222222-2222-4222-8222-222222220205', 'deadline', 'Required by date', 'DATE', TRUE, NULL, NULL, 6, TRUE),
  ('e2222222-2222-4222-8222-222222220205', 'brand_compliant', 'Must be brand compliant', 'CHECKBOX', TRUE, NULL, NULL, 7, TRUE),
  ('e2222222-2222-4222-8222-222222220205', 'assets', 'Attachments', 'FILE', FALSE, NULL, NULL, 8, TRUE),

  -- Website Content Update Request
  ('e2222222-2222-4222-8222-222222220206', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220206', 'description', 'Summary of change', 'LONG_TEXT', TRUE, NULL, NULL, 2, TRUE),
  ('e2222222-2222-4222-8222-222222220206', 'page_url', 'Page URL', 'TEXT', TRUE, NULL, 'Link to the page to update', 3, TRUE),
  ('e2222222-2222-4222-8222-222222220206', 'update_type', 'Update type', 'DROPDOWN', TRUE, '["New content","Edit existing","Remove content","Structural change"]', NULL, 4, TRUE),
  ('e2222222-2222-4222-8222-222222220206', 'content_body', 'Proposed content', 'LONG_TEXT', TRUE, NULL, NULL, 5, TRUE),
  ('e2222222-2222-4222-8222-222222220206', 'go_live_date', 'Go-live date', 'DATE', TRUE, NULL, NULL, 6, TRUE),
  ('e2222222-2222-4222-8222-222222220206', 'seo_keywords', 'SEO keywords', 'TEXT', FALSE, NULL, NULL, 7, TRUE),
  ('e2222222-2222-4222-8222-222222220206', 'assets', 'Attachments', 'FILE', FALSE, NULL, NULL, 8, TRUE),

  -- Recruitment Request
  ('e2222222-2222-4222-8222-222222220301', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220301', 'description', 'Role summary', 'LONG_TEXT', TRUE, NULL, 'Role and key requirements', 2, TRUE),
  ('e2222222-2222-4222-8222-222222220301', 'headcount', 'Headcount', 'DROPDOWN', TRUE, '["1","2","3","4","5+"]', NULL, 3, TRUE),
  ('e2222222-2222-4222-8222-222222220301', 'role_level', 'Role level', 'DROPDOWN', TRUE, '["Junior","Mid","Senior","Manager"]', NULL, 4, TRUE),
  ('e2222222-2222-4222-8222-222222220301', 'department_area', 'Hiring department / area', 'TEXT', TRUE, NULL, NULL, 5, TRUE),
  ('e2222222-2222-4222-8222-222222220301', 'urgency', 'Urgency', 'DROPDOWN', TRUE, '["Low","Medium","High","Urgent"]', NULL, 6, TRUE),
  ('e2222222-2222-4222-8222-222222220301', 'target_start_date', 'Target start date', 'DATE', FALSE, NULL, NULL, 7, TRUE),
  ('e2222222-2222-4222-8222-222222220301', 'assets', 'Attachments', 'FILE', FALSE, NULL, 'Job description or org chart', 8, TRUE),

  -- Employee Onboarding Request
  ('e2222222-2222-4222-8222-222222220302', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220302', 'employee_name', 'New employee name', 'TEXT', TRUE, NULL, NULL, 2, TRUE),
  ('e2222222-2222-4222-8222-222222220302', 'start_date', 'Start date', 'DATE', TRUE, NULL, NULL, 3, TRUE),
  ('e2222222-2222-4222-8222-222222220302', 'role_title', 'Job title', 'TEXT', TRUE, NULL, NULL, 4, TRUE),
  ('e2222222-2222-4222-8222-222222220302', 'department_area', 'Department / area', 'TEXT', TRUE, NULL, NULL, 5, TRUE),
  ('e2222222-2222-4222-8222-222222220302', 'line_manager', 'Line manager', 'TEXT', TRUE, NULL, NULL, 6, TRUE),
  ('e2222222-2222-4222-8222-222222220302', 'equipment_needed', 'Equipment needed', 'MULTI_SELECT', FALSE, '["Laptop","Phone","Desk","Access card","Email account"]', NULL, 7, TRUE),
  ('e2222222-2222-4222-8222-222222220302', 'notes', 'Additional notes', 'LONG_TEXT', FALSE, NULL, NULL, 8, TRUE),

  -- Training Request
  ('e2222222-2222-4222-8222-222222220303', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220303', 'description', 'Training need', 'LONG_TEXT', TRUE, NULL, NULL, 2, TRUE),
  ('e2222222-2222-4222-8222-222222220303', 'preferred_date', 'Preferred training date', 'DATE', TRUE, NULL, NULL, 3, TRUE),
  ('e2222222-2222-4222-8222-222222220303', 'target_group', 'Target group', 'TEXT', TRUE, NULL, 'Who will attend', 4, TRUE),
  ('e2222222-2222-4222-8222-222222220303', 'training_type', 'Training type', 'DROPDOWN', TRUE, '["Compliance","Technical","Leadership","Onboarding","Other"]', NULL, 5, TRUE),
  ('e2222222-2222-4222-8222-222222220303', 'delivery_mode', 'Delivery mode', 'DROPDOWN', TRUE, '["In-person","Virtual","Hybrid"]', NULL, 6, TRUE),
  ('e2222222-2222-4222-8222-222222220303', 'duration_hours', 'Duration (hours)', 'NUMBER', FALSE, NULL, NULL, 7, TRUE),
  ('e2222222-2222-4222-8222-222222220303', 'assets', 'Attachments', 'FILE', FALSE, NULL, NULL, 8, TRUE),

  -- Leave / Absence Support Request
  ('e2222222-2222-4222-8222-222222220304', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220304', 'employee_name', 'Employee name', 'TEXT', TRUE, NULL, NULL, 2, TRUE),
  ('e2222222-2222-4222-8222-222222220304', 'leave_type', 'Leave type', 'DROPDOWN', TRUE, '["Annual","Sick","Maternity","Paternity","Unpaid","Other"]', NULL, 3, TRUE),
  ('e2222222-2222-4222-8222-222222220304', 'start_date', 'Start date', 'DATE', TRUE, NULL, NULL, 4, TRUE),
  ('e2222222-2222-4222-8222-222222220304', 'end_date', 'End date', 'DATE', TRUE, NULL, NULL, 5, TRUE),
  ('e2222222-2222-4222-8222-222222220304', 'reason', 'Reason / context', 'LONG_TEXT', TRUE, NULL, NULL, 6, TRUE),
  ('e2222222-2222-4222-8222-222222220304', 'cover_arrangements', 'Cover arrangements', 'LONG_TEXT', FALSE, NULL, NULL, 7, TRUE),
  ('e2222222-2222-4222-8222-222222220304', 'contact_email', 'Contact email', 'EMAIL', TRUE, NULL, NULL, 8, TRUE),

  -- Employee Document Request
  ('e2222222-2222-4222-8222-222222220305', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220305', 'employee_name', 'Employee name', 'TEXT', TRUE, NULL, NULL, 2, TRUE),
  ('e2222222-2222-4222-8222-222222220305', 'document_type', 'Document type', 'DROPDOWN', TRUE, '["Employment letter","Salary confirmation","Reference letter","Certificate","Other"]', NULL, 3, TRUE),
  ('e2222222-2222-4222-8222-222222220305', 'purpose', 'Purpose', 'LONG_TEXT', TRUE, NULL, 'Why the document is needed', 4, TRUE),
  ('e2222222-2222-4222-8222-222222220305', 'delivery_method', 'Delivery method', 'DROPDOWN', TRUE, '["Email","Collect in person","Internal mail"]', NULL, 5, TRUE),
  ('e2222222-2222-4222-8222-222222220305', 'urgency', 'Urgency', 'DROPDOWN', TRUE, '["Low","Medium","High","Urgent"]', NULL, 6, TRUE),
  ('e2222222-2222-4222-8222-222222220305', 'required_by', 'Required by date', 'DATE', TRUE, NULL, NULL, 7, TRUE),
  ('e2222222-2222-4222-8222-222222220305', 'assets', 'Attachments', 'FILE', FALSE, NULL, 'Supporting documents', 8, TRUE),

  -- Policy / HR Support Request
  ('e2222222-2222-4222-8222-222222220306', 'title', 'Request title', 'TEXT', TRUE, NULL, NULL, 1, TRUE),
  ('e2222222-2222-4222-8222-222222220306', 'description', 'Question / issue', 'LONG_TEXT', TRUE, NULL, NULL, 2, TRUE),
  ('e2222222-2222-4222-8222-222222220306', 'policy_area', 'Policy area', 'DROPDOWN', TRUE, '["Leave","Conduct","Benefits","Payroll","Recruitment","Other"]', NULL, 3, TRUE),
  ('e2222222-2222-4222-8222-222222220306', 'question_type', 'Question type', 'DROPDOWN', TRUE, '["Clarification","Exception request","Complaint","General enquiry"]', NULL, 4, TRUE),
  ('e2222222-2222-4222-8222-222222220306', 'urgency', 'Urgency', 'DROPDOWN', TRUE, '["Low","Medium","High","Urgent"]', NULL, 5, TRUE),
  ('e2222222-2222-4222-8222-222222220306', 'preferred_contact', 'Preferred contact email', 'EMAIL', TRUE, NULL, NULL, 6, TRUE),
  ('e2222222-2222-4222-8222-222222220306', 'reference_number', 'Reference number (if any)', 'TEXT', FALSE, NULL, NULL, 7, TRUE),
  ('e2222222-2222-4222-8222-222222220306', 'assets', 'Attachments', 'FILE', FALSE, NULL, NULL, 8, TRUE)
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
