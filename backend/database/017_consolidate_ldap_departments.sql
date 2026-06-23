-- 017_consolidate_ldap_departments.sql
--
-- One-off consolidation of the department list after the initial LDAP directory
-- sync created many near-duplicate / variant departments from raw AD values.
--
-- Strategy: keep a curated canonical set (the operating 15 plus the genuinely
-- large real AD departments), fold every variant into its canonical department
-- (reassigning users, templates, requests and assignments first), then delete
-- the now-empty variant rows.
--
-- Idempotent: on a database without the variant rows it simply does nothing.
-- The same source→canonical mapping is mirrored in the backend LDAP sync
-- (department-aliases.ts) so future syncs stay on the canonical set.

BEGIN;

CREATE TEMP TABLE dept_alias (src text, canon text) ON COMMIT DROP;
INSERT INTO dept_alias (src, canon) VALUES
  ('Audit',                              'Internal Audit'),
  ('Audit & Risk Department',            'Internal Audit'),
  ('Senior Risk and Compliance Specialist', 'Risk and Compliance'),
  ('Commercail',                         'Commercial'),
  ('Commerical',                         'Commercial'),
  ('Commericla',                         'Commercial'),
  ('Commercial Zamtel',                  'Commercial'),
  ('Corporate Communications',           'Customer Experience and Public Relations'),
  ('Customer Experience',                'Customer Experience and Public Relations'),
  ('Corporate Shared Services',          'Shared Services'),
  ('Corporate Support Services',         'Shared Services'),
  ('Corporate Strategy & Planning',      'Shared Services'),
  ('Credit Control Officer',             'Finance'),
  ('Enterprise Sales',                   'Zamtel Business'),
  ('Enterprise Zamtel Business',         'Zamtel Business'),
  ('Fixed Enterprise & Consumer Sales',  'Sales and Distribution'),
  ('Fixed Sales',                        'Sales and Distribution'),
  ('Mobile Sales',                       'Sales and Distribution'),
  ('Sales',                              'Sales and Distribution'),
  ('Sales & Contribution',               'Sales and Distribution'),
  ('Sales & Distributions',              'Sales and Distribution'),
  ('Trade Development Representative',    'Sales and Distribution'),
  ('FNO Specialists',                    'Technical'),
  ('FO',                                 'Technical'),
  ('NOC',                                'Technical'),
  ('Technician',                         'Technical'),
  ('Technical & Information Services',   'Technical'),
  ('Information Services',               'Information Technology'),
  ('IT',                                 'Information Technology'),
  ('Innovations',                        'Information Technology'),
  ('Legal & Corporate Services',         'Legal'),
  ('Mobile Money',                       'Zamtel Money'),
  ('Money Money',                        'Zamtel Money'),
  ('Procurement',                        'Supply Chain');

-- Resolve src/canon names to ids once.
CREATE TEMP TABLE dept_move (src_id uuid, canon_id uuid) ON COMMIT DROP;
INSERT INTO dept_move (src_id, canon_id)
SELECT s.id, c.id
FROM dept_alias a
JOIN departments s ON lower(s.name) = lower(a.src)
JOIN departments c ON lower(c.name) = lower(a.canon)
WHERE s.id <> c.id;

-- Reassign every dependent record from variant → canonical.
UPDATE users u            SET department_id        = m.canon_id FROM dept_move m WHERE u.department_id        = m.src_id;
UPDATE request_templates t SET department_id       = m.canon_id FROM dept_move m WHERE t.department_id        = m.src_id;
UPDATE requests r         SET target_department_id = m.canon_id FROM dept_move m WHERE r.target_department_id = m.src_id;
UPDATE requests r         SET source_department_id = m.canon_id FROM dept_move m WHERE r.source_department_id = m.src_id;
UPDATE assignments asg    SET department_id        = m.canon_id FROM dept_move m WHERE asg.department_id      = m.src_id;

-- Drop manager pointers on the variant rows so the delete is unobstructed.
UPDATE departments d SET manager_user_id = NULL FROM dept_move m WHERE d.id = m.src_id;

-- Remove the now-empty variant departments.
DELETE FROM departments d USING dept_move m WHERE d.id = m.src_id;

COMMIT;
