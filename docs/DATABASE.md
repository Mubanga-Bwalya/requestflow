# Database

> **Last updated:** 2026-06-18

Related: [`SETUP.md`](SETUP.md) · [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`BACKUP_AND_RECOVERY.md`](BACKUP_AND_RECOVERY.md)

---

## Plain-language overview

RequestFlow stores all organisational and workflow data in **PostgreSQL**. Think of the database as the permanent record for:

| Data | Examples |
|------|----------|
| People and access | Users, roles, which department someone belongs to |
| Organisation | Departments and appointed managers |
| Request definitions | Templates and form fields |
| Live work | Requests, assignments, milestones, status history |
| Accountability | Activity logs, system error logs, notifications |
| Configuration | System name, upload limits, and settings |

The database schema is applied using numbered SQL files (not Prisma Migrate). Operators run `apply-migrations.sh` in the documented order. A full backup should be taken before any migration on production.

For supervisors: [`SUPERVISOR_README.md`](SUPERVISOR_README.md).

---

## Phase 2 changelog (2026-06-11)

**What changed:** Unified SQL apply order via `apply-migrations.sh`; disabled plaintext password script; seeds preserve credentials on re-run; added integrity constraints (`015`); fixed `003_drop_all` completeness; CI applies `009`, `013`, `014`, `015`.

**Developer rules:**

- Use `apply-migrations.sh` / `apply-migrations.ps1` — do not hand-pick a subset in CI or docs.
- Never run `005_auth_passwords.sql` or `deprecated/` scripts.
- SQL and Prisma seed re-runs must **not** overwrite `password_hash` unless `--reset-passwords` or `db:seed:reset`.
- Do not add `UNIQUE` on `departments.manager_user_id` — one user may manage multiple departments.

---

## Strategy

| Aspect | Approach |
|--------|----------|
| Schema source of truth | Numbered SQL in `backend/database/` |
| Prisma | Client + types (`backend/prisma/schema.prisma`); **not** `prisma migrate` |
| Apply helper | `backend/database/apply-migrations.sh` (used by CI) |
| User/org seed | `npm run db:seed` (`backend/prisma/seed.ts`) |

**Limitation:** No migration version table. Operators must apply SQL files in documented order. **Safe next step:** add a `schema_migrations` table + runner script that records applied filenames (lightweight, no Prisma Migrate required).

### Migration tracking (operator checklist)

After each apply on staging/production, record in an operator log:

| Field | Example |
|-------|---------|
| Environment | `pilot` |
| Date/time (UTC) | `2026-06-18T14:30:00Z` |
| SQL files applied | `001 … 015, 002` |
| Operator | name |
| Pre-migration backup file | `requestflow_pilot_20260618_143000.dump` |
| Notes | first deploy / upgrade from X |

See [`BACKUP_AND_RECOVERY.md`](BACKUP_AND_RECOVERY.md) — **backup before every migration**.

---

## Backup and recovery

Production backups use `pg_dump`. Full procedures, naming, restore, and migration-failure response: **[`BACKUP_AND_RECOVERY.md`](BACKUP_AND_RECOVERY.md)**.

Quick reference:

```bash
pg_dump -h localhost -U requestflow -d requestflow -Fc \
  -f "/var/backups/requestflow/requestflow_prod_$(date +%Y%m%d_%H%M%S).dump"
```

Never run `prisma migrate reset` on production.

## Connection (local Docker)

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5432` |
| Database | `requestflow` |
| User / password | `postgres` / `postgres` |

`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/requestflow`

---

## SQL files

| File | Purpose |
|------|---------|
| `000_create_database.sql` | Create DB (connect to `postgres` DB first) |
| `001_create_schema.sql` | Enums, tables, FKs, CHECK constraints, triggers |
| `002_seed_core_data.sql` | Departments, roles, templates, demo users (password preserved on re-run) |
| `003_drop_all.sql` | **Dev only** — destructive drop of all app objects |
| `004_system_settings.sql` | Settings table + default row |
| `005_auth_passwords.sql` | **Disabled** — see `deprecated/` |
| `006_performance_indexes.sql` | List-query indexes |
| `007_request_number_sequences.sql` | Per-year atomic counters |
| `008_system_events.sql` | Operational error log (idempotent) |
| `009_manager_role.sql` | Generic `Manager` role |
| `010_performance_indexes.sql` | Search (`pg_trgm`) + extra indexes |
| `011_reset_demo_data.sql` | **Dev only** — SQL alternative to `db:seed:reset` |
| `012_add_billing_innovations.sql` | Legacy upgrade only (included in `002` for new installs) |
| `013_activity_admin_actions.sql` | Activity enum values for sign-in / admin audit (idempotent) |
| `014_allow_multi_department_manager.sql` | Drop Prisma unique on `manager_user_id` if present |
| `015_data_integrity_constraints.sql` | One OPEN missing-info per request; attachment XOR parent |

### Canonical apply order

```bash
bash backend/database/apply-migrations.sh
cd backend && npm run prisma:generate && npm run db:seed
```

Applied sequence: **001 → 004 → 006 → 007 → 008 → 009 → 010 → 013 → 014 → 015 → 002**

CI uses the same script, then `npm run db:seed -- --reset-passwords` on a fresh database.

---

## Main models (Prisma)

| Model | Purpose |
|-------|---------|
| `Department` | Org units; `managerUserId` optional (**not unique** — multi-dept managers) |
| `User` | Accounts; `roleId`, `departmentId`, `isActive` |
| `Role` | Named roles |
| `RequestTemplate` / `TemplateField` | Form definitions |
| `Request` | Core request record + status |
| `Assignment` / `AssignmentMember` | Work package for a request |
| `Milestone` | Sub-task progress |
| `MissingInformationRequest` / `Item` | Clarification rounds |
| `Notification` | Per-user alerts |
| `ActivityLog` | Audit trail |
| `SystemSetting` | Singleton app config |
| `SystemEvent` | HTTP/ops errors |

`request_number_sequences` exists in SQL only (no Prisma model).

---

## Constraints and indexes

| Constraint | Location |
|------------|----------|
| Progress 0–100 | CHECK on requests, assignments, milestones (`001`) |
| One OPEN missing-info per request | Partial unique index (`015`) |
| Attachment parent XOR | `request_id` OR `milestone_id`, not both (`001` + `015`) |
| `manager_user_id` | **Not unique** — index only (`idx_departments_manager_user_id`) |
| List/inbox indexes | `006`, `010` |

---

## Seed process

### Prisma seed (preferred for users)

```bash
cd backend
npm run db:seed                      # upsert org; preserves existing password_hash
npm run db:seed -- --reset-passwords # reset demo passwords to requestflow (local only)
npm run db:seed:reset                # clear workflow data + reseed with demo passwords
```

**Demo password:** `requestflow` — **local development only.** Production must use admin-created users and rotated passwords (`ALLOW_DEMO_DEFAULT_PASSWORD` must be false).

### SQL seed (`002`)

Inserts bcrypt hashes on **first** insert only. `ON CONFLICT (email)` updates profile fields but **not** `password_hash`.

### Legacy plaintext migration

```bash
npm run hash-passwords --workspace=backend   # one-time; hashes plaintext @requestflow.local rows
```

**Never run** `005_auth_passwords.sql` or scripts under `database/deprecated/`.

---

## Safe development reset

**Light reset (keeps schema):**

```bash
cd backend && npm run db:seed:reset
```

**Full local wipe:**

```bash
psql -U postgres -d requestflow -f backend/database/003_drop_all.sql
bash backend/database/apply-migrations.sh
cd backend && npm run db:seed -- --reset-passwords
```

**Production:** do not run `003`, `011`, or demo seed without explicit policy. See [`DEPLOYMENT.md`](DEPLOYMENT.md).

---

## Prisma commands

```bash
npm run prisma:generate --workspace=backend
npm run prisma:validate --workspace=backend
```

---

## Schema drift notes (resolved / remaining)

| Item | Status |
|------|--------|
| CI missing `013` enum values | **Fixed** — in apply script |
| Plaintext `005` script | **Disabled** |
| Seed overwrites passwords | **Fixed** — SQL + Prisma |
| `manager_user_id` unique | **Removed** (Prisma + `014`) |
| Migration runner / version table | **Not implemented** — documented gap |
