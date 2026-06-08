# RequestFlow PostgreSQL Database Package

> **Last updated:** 2026-06-03

Manual SQL setup for the RequestFlow MVP. NestJS/Prisma use these tables at runtime (`backend/prisma/schema.prisma` aligned with `001_create_schema.sql`).

## Local connection defaults

| Setting  | Value        |
|----------|--------------|
| Database | `requestflow` |
| User     | `postgres`   |
| Password | `postgres`   |
| Port     | `5432`       |
| Host     | `localhost`  |

With Docker Compose from the repo root:

```bash
docker compose up -d
```

This starts PostgreSQL 16 with database `requestflow` already created. You can skip `000_create_database.sql` when using Docker and go straight to schema + seed.

## SQL files

| File | Purpose |
|------|---------|
| `000_create_database.sql` | Creates the `requestflow` database. **Run only while connected to `postgres` (or another maintenance DB), not inside `requestflow`.** |
| `001_create_schema.sql` | Extensions, enums, tables, constraints, indexes, `updated_at` triggers. **Run while connected to `requestflow`.** |
| `002_seed_core_data.sql` | MVP seed: departments, roles, users, managers, templates, template fields. Idempotent. |
| `004_system_settings.sql` | Admin system settings table + default row. Run after schema on existing DBs. |
| `005_auth_passwords.sql` | Legacy: plain-text `requestflow` (pre-bcrypt). Prefer `npm run hash-passwords` after pull. |
| `006_performance_indexes.sql` | List-query indexes (safe to re-run). |
| `007_request_number_sequences.sql` | Per-year atomic counters for request numbers. |
| `008_system_events.sql` | Admin-visible error/operational log table. |
| `003_drop_all.sql` | Local reset: drops all tables, triggers, functions, and enums. |

## How to run manually

### Option A — psql (recommended)

**1. Create database** (skip if using Docker Compose):

```bash
psql -U postgres -d postgres -f backend/database/000_create_database.sql
```

**2. Create schema:**

```bash
psql -U postgres -d requestflow -f backend/database/001_create_schema.sql
```

**3. Seed core data:**

```bash
psql -U postgres -d requestflow -f backend/database/002_seed_core_data.sql
```

**4. System settings (admin portal):**

```bash
psql -U postgres -d requestflow -f backend/database/004_system_settings.sql
psql -U postgres -d requestflow -f backend/database/006_performance_indexes.sql
psql -U postgres -d requestflow -f backend/database/007_request_number_sequences.sql
psql -U postgres -d requestflow -f backend/database/008_system_events.sql
```

(`005` only needed if users were seeded before bcrypt passwords were added.)

### Option B — pgAdmin

1. Connect to server as `postgres`.
2. Run `000_create_database.sql` in Query Tool on database **`postgres`**.
3. Connect to database **`requestflow`**.
4. Run `001`, `002`, `004`, `006`, `007`, `008` (and `005` only if upgrading an old DB without bcrypt passwords).

### Local full reset

```bash
psql -U postgres -d requestflow -f backend/database/003_drop_all.sql
psql -U postgres -d requestflow -f backend/database/001_create_schema.sql
psql -U postgres -d requestflow -f backend/database/002_seed_core_data.sql
psql -U postgres -d requestflow -f backend/database/004_system_settings.sql
psql -U postgres -d requestflow -f backend/database/006_performance_indexes.sql
psql -U postgres -d requestflow -f backend/database/007_request_number_sequences.sql
```

## Tables created

| Table | Purpose |
|-------|---------|
| `departments` | HR and Marketing (MVP) |
| `roles` | Admin, Employee, managers, team members |
| `users` | Demo users; `password_hash` = bcrypt of `requestflow` (see `002` or `npm run hash-passwords`) |
| `request_templates` | 6 Marketing + 6 HR templates |
| `template_fields` | Structured form fields per template |
| `requests` | Submitted work requests |
| `request_field_answers` | Answers per template field |
| `missing_information_requests` | Manager “needs info” rounds |
| `missing_information_items` | Specific fields or reasons missing |
| `assignments` | One assignment per request (MVP) |
| `assignment_members` | One or many assignees per assignment |
| `milestones` | Sub-tasks with 0–100% progress |
| `attachments` | Files on request or milestone |
| `notifications` | Per-user alerts (no chat) |
| `activity_logs` | Audit trail of key actions |

**Not included by design:** comments, chat, discussion threads, or messaging tables.

## Seed data included

- **Departments:** HR, Marketing  
- **Roles:** `Admin`, Employee, HR Manager, Marketing Manager, HR Team Member, Marketing Team Member  
- **Users:** `admin@requestflow.local` (full name "System Admin", **role** `Admin`), Jane Employee, Henry HR Manager, Mary Marketing Manager, Helen HR Officer, Mark Marketing Designer, Musa Marketing Assistant  
- **Managers:** Henry → HR, Mary → Marketing  
- **Templates:** 6 Marketing + 6 HR (see `002_seed_core_data.sql`)  
- **Template fields:** 8 fields per template (96 fields total), aligned with MVP prototypes  

Re-run `002_seed_core_data.sql` safely; it uses `ON CONFLICT` to avoid duplicates.

Seed UUID prefixes (hex only): `d` departments, `b` roles, `c` users, `e` templates.

## Design notes

### Request numbers

Allocated in NestJS via `request_number_sequences` (SQL `007`) using an atomic per-year counter, format:

`RF-YYYY-NNNN` — e.g. `RF-2026-0001`

Unique constraint on `requests.request_number` remains; the API retries on rare collisions.

### Progress calculation

Done in **NestJS**, not database triggers:

1. Average milestone `progress_percentage` → assignment progress  
2. Assignment progress → request `progress_percentage`  
3. Optional manual override may be added later  

### Auth

Demo password is **`requestflow`** (stored as bcrypt in `password_hash`). Login: `POST /auth/login` → JWT. New installs: `002` includes bcrypt hashes. Existing DBs with plain text: `cd backend && npm run hash-passwords` (or log in once for lazy rehash).

### Prisma / NestJS alignment

`backend/prisma/schema.prisma` matches this SQL package. After schema changes, run `npm run prisma:generate` in `backend/`. Manual SQL remains the source of truth for new environments.

### Security regression tests

With a seeded database and `DATABASE_URL` set:

```bash
cd backend
npm run test:e2e
```

CI applies `001`, `002`, `004`, `006`, and `007` automatically before e2e runs.

### Microsoft SQL Server portability

- UUIDs map to `uniqueidentifier`  
- `JSONB` → `NVARCHAR(MAX)` with JSON validation or native JSON where supported  
- `TIMESTAMPTZ` → `DATETIMEOFFSET`  
- PostgreSQL ENUMs → lookup tables or SQL Server ENUM equivalents  

## Verify seed

```sql
SELECT name FROM departments ORDER BY name;
SELECT name FROM roles ORDER BY name;
SELECT full_name, email FROM users ORDER BY email;
SELECT d.name AS dept, t.name AS template, COUNT(f.id) AS fields
FROM request_templates t
JOIN departments d ON d.id = t.department_id
LEFT JOIN template_fields f ON f.template_id = t.id
GROUP BY d.name, t.name
ORDER BY d.name, t.name;
```

Expected: 2 departments, 6 roles, 7 users, 12 templates, 8 fields each.

### "current transaction is aborted" (25P02)

This means an **earlier statement failed** inside a transaction and PostgreSQL is waiting for `ROLLBACK`.

**Fix (pgAdmin Query Tool):**

```sql
ROLLBACK;
```

Then run `002_seed_core_data.sql` again (the file now starts with `ROLLBACK;` to clear stuck sessions automatically).

### pgAdmin / psql NOTICE messages

On a **first** run of `001_create_schema.sql`, you may see harmless `NOTICE: ... does not exist, skipping` lines from older script versions that used `DROP ... IF EXISTS` before creating triggers. That is **not an error** — the script still completes successfully.

The current `001` script creates the manager FK and `updated_at` triggers only when they are missing, so a fresh install should be quiet. Re-run `003_drop_all.sql` then `001` if you need a clean reinstall.
