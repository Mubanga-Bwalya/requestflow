# Backup and recovery

> **Last updated:** 2026-06-18  
> **Audience:** Database administrators and IT operators.

Related: [`DATABASE.md`](DATABASE.md) · [`DEPLOYMENT.md`](DEPLOYMENT.md) · [`LOCAL_SERVER_DEPLOYMENT.md`](LOCAL_SERVER_DEPLOYMENT.md)

---

## Policy

1. **Take a backup before every migration** on staging and production.
2. **Never** run `prisma migrate reset` on production.
3. Migrations are **forward-only** — there are no automated down migrations.
4. For major rollback, **restore from backup** and redeploy a known-good application build.
5. Test restore on a non-production database at least once per quarter.

---

## What to back up

| Asset | Method |
|-------|--------|
| PostgreSQL database | `pg_dump` (primary) |
| `backend/.env` | Secret store / encrypted ops vault (not git) |
| Frontend `.env.local` | Document `NEXT_PUBLIC_API_URL` in runbook |
| Application builds | Git tag or artifact retention (optional; rebuild from source) |

Redis cache is **not** backed up — it is rebuildable.

---

## Naming convention

```
requestflow_<environment>_<YYYYMMDD>_<HHMMSS>.dump
requestflow_<environment>_<YYYYMMDD>_<HHMMSS>.sql
```

Examples:

- `requestflow_prod_20260618_143000.dump`
- `requestflow_staging_20260618_090000.sql`

`<environment>`: `prod`, `staging`, `pilot`, `dev`.

---

## Storage location

| Tier | Recommendation |
|------|----------------|
| Primary | Server-local path outside web root, e.g. `/var/backups/requestflow/` (Linux) or `D:\Backups\RequestFlow\` (Windows) |
| Secondary | Network share or object storage (S3-compatible, Azure Blob) on a **different** host |
| Retention | Minimum 30 days daily; keep pre-migration dumps until next successful migration verified |
| Access | DBA + designated ops lead only; encrypted at rest where possible |

---

## Backup commands

Set connection variables (adjust for your environment):

```bash
export PGHOST=localhost
export PGUSER=requestflow
export PGDATABASE=requestflow
# PGPASSWORD via .pgpass or prompt
```

### Custom format (recommended — compressed, parallel restore)

```bash
pg_dump -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" \
  -Fc -f "/var/backups/requestflow/requestflow_prod_$(date +%Y%m%d_%H%M%S).dump"
```

### Plain SQL (human-readable)

```bash
pg_dump -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" \
  --no-owner --no-acl \
  -f "/var/backups/requestflow/requestflow_prod_$(date +%Y%m%d_%H%M%S).sql"
```

### Windows (PowerShell)

```powershell
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$env:PGPASSWORD = "***"
pg_dump -h localhost -U requestflow -d requestflow -Fc -f "D:\Backups\RequestFlow\requestflow_prod_$ts.dump"
```

---

## Restore commands

**Stop the API** before restore to prevent writes during recovery.

### From custom format

```bash
# Drop and recreate database (DESTRUCTIVE — staging/recovery only)
psql -h "$PGHOST" -U postgres -c "DROP DATABASE IF EXISTS requestflow;"
psql -h "$PGHOST" -U postgres -c "CREATE DATABASE requestflow OWNER requestflow;"

pg_restore -h "$PGHOST" -U "$PGUSER" -d requestflow \
  --no-owner --no-acl \
  /var/backups/requestflow/requestflow_prod_20260618_143000.dump
```

### From plain SQL

```bash
psql -h "$PGHOST" -U postgres -c "DROP DATABASE IF EXISTS requestflow;"
psql -h "$PGHOST" -U postgres -c "CREATE DATABASE requestflow OWNER requestflow;"

psql -h "$PGHOST" -U "$PGUSER" -d requestflow \
  -f /var/backups/requestflow/requestflow_prod_20260618_143000.sql
```

After restore:

```bash
cd backend && npm run prisma:generate
# Restart API and frontends
```

---

## Who performs restore

| Role | Responsibility |
|------|----------------|
| **Primary:** DBA or senior ops | Executes `pg_restore` / `psql` restore |
| **Secondary:** Application owner | Confirms app version matches backup era |
| **Approver:** IT manager | Authorizes production restore (data loss window) |

Document named contacts in your internal runbook.

---

## Verify restore

1. `psql -d requestflow -c "SELECT COUNT(*) FROM users;"`
2. `psql -d requestflow -c "SELECT COUNT(*) FROM requests;"`
3. Start API: `GET /health` → 200
4. Admin login → dashboard counts match expectations
5. Spot-check a known request ID and user email
6. Run `npm run audit:deployment-smoke` against restored environment (staging)

---

## Migration failure response

1. **Stop** further migration steps immediately.
2. Capture error output from `apply-migrations.sh` / `psql`.
3. Assess: partial apply vs complete failure (check which SQL file failed).
4. **If forward-fix is unclear:** restore from pre-migration backup (see above).
5. **If forward-fix is safe:** write corrective SQL (new numbered file); backup again; apply fix only.
6. Update operator migration log with failure reason and resolution.
7. **Never** run `003_drop_all.sql`, `011_reset_demo_data.sql`, or `prisma migrate reset` on production.

---

## Forward-only migrations warning

RequestFlow uses hand-applied SQL files without a `schema_migrations` table. Operators must:

- Apply files in canonical order only (`apply-migrations.sh`)
- Record each filename and timestamp in an operator log
- Skip files already applied (script is mostly idempotent for enums/indexes, but **do not** re-run `002` seed on production without policy)

Safe next engineering step: add `schema_migrations` table + runner — see [`DATABASE.md`](DATABASE.md).

---

## Pre-migration checklist

- [ ] Backup completed and file size verified (> 0 bytes)
- [ ] Backup copied to secondary storage
- [ ] API traffic drained or maintenance window announced
- [ ] Operator log ready for new SQL filenames
- [ ] Rollback owner identified

---

## Related procedures

- Redis failure: [`LOCAL_SERVER_DEPLOYMENT.md`](LOCAL_SERVER_DEPLOYMENT.md#redis-failure-procedure)
- DB unavailable: [`LOCAL_SERVER_DEPLOYMENT.md`](LOCAL_SERVER_DEPLOYMENT.md#database-unavailable-procedure)
- Deploy checklist: [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md)
