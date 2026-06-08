-- Adds generic Manager role for admin user assignment (Employee / Manager / Admin).
-- Safe to re-run.

INSERT INTO roles (id, name, description, is_active)
VALUES
  ('b1111111-1111-4111-8111-111111110007', 'Manager', 'Review and assign requests for their department', TRUE)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
