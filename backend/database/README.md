# Database SQL files

Operational SQL scripts for RequestFlow. **Full documentation:** [`../../docs/DATABASE.md`](../../docs/DATABASE.md).

## Canonical apply order

Use the helper script (recommended):

```bash
# Linux / macOS / Git Bash / CI
PGHOST=localhost PGUSER=postgres PGPASSWORD=postgres PGDATABASE=requestflow \
  bash backend/database/apply-migrations.sh

# Windows PowerShell
.\backend\database\apply-migrations.ps1
```

Or from `backend/`: `npm run db:apply-sql` (requires bash).

Then seed users (local/demo):

```bash
cd backend
npm run prisma:generate
npm run db:seed                  # safe re-run; preserves existing passwords
npm run db:seed -- --reset-passwords   # intentionally reset demo passwords to requestflow
```

### Files applied by `apply-migrations.sh`

`001` → `004` → `006` → `007` → `008` → `009` → `010` → `013` → `014` → `015` → `002`

**Not included (dev-only / deprecated):**

| File | Reason |
|------|--------|
| `003_drop_all.sql` | Destructive local reset |
| `005_auth_passwords.sql` | Disabled — plaintext passwords |
| `011_reset_demo_data.sql` | Destructive SQL reset alternative to `db:seed:reset` |
| `012_add_billing_innovations.sql` | Superseded by `002` for new installs; use only when upgrading old DBs missing Billing/Innovations |

## Phase 2 changelog (2026-06-11)

- Single apply script aligns CI, docs, and local setup.
- Seeds no longer overwrite `password_hash` on SQL/Prisma re-run.
- `manager_user_id` is not unique (one user may manage multiple departments).
- `015` adds missing-info and attachment integrity constraints.

## Quick local start

```bash
npm run docker:up   # from repo root
bash backend/database/apply-migrations.sh
cd backend && npm run prisma:generate && npm run db:seed -- --reset-passwords
```
