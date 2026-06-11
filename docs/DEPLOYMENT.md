# Deployment

> **Last updated:** 2026-06-11  
> **Status:** Deployment **plan and checklist** — not a finished production pipeline (no Dockerfiles for app services in repo).

Related: [`SECURITY.md`](SECURITY.md) · [`DATABASE.md`](DATABASE.md) · [`SETUP.md`](SETUP.md)

---

## Readiness target

See **[`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md)** for current scores (supervisor demo **8.5/10**, internal pilot **7.5/10** as of 2026-06-11) and remaining risks.

Use **[`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md)** for sign-off steps.

---

## Pre-flight

| Check | Pass criteria |
|-------|---------------|
| No secrets in git | Only `*.env.example` tracked |
| CI green on `main` | Backend test + e2e; all builds |
| Demo passwords rotated | No `requestflow` in production |
| SQL migrations applied | Full `apply-migrations.sh` sequence including `013`, `014`, `015` |

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Production | Required |
|----------|------------|----------|
| `NODE_ENV` | `production` | Yes |
| `DATABASE_URL` | Managed Postgres URL | Yes |
| `JWT_SECRET` | 32+ random chars | Yes |
| `JWT_EXPIRES_IN` | e.g. `28800` | Recommended |
| `CORS_ORIGINS` | Comma-separated portal URLs, no `*` | Yes |
| `PORT` | e.g. `4000` | Optional |
| `REDIS_ENABLED` | `true` if using cache | Optional |
| `REDIS_HOST` / `PORT` / `PASSWORD` | Redis connection | If enabled |
| `EMAIL_ENABLED` | `true` if sending mail | Optional |
| `RESEND_API_KEY` | From secret store | If email on |
| `EMAIL_FROM` | Verified sender | If email on |
| `APP_BASE_URL` | User portal URL for email links | If email on |
| `ALLOW_DEMO_DEFAULT_PASSWORD` | **unset / false** | Must not be true |
| `ALLOW_LEGACY_PLAINTEXT_PASSWORDS` | **unset / false** | Must not be true |

### Frontends (build-time)

Set in `.env.local` **before** `npm run build`:

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_API_URL` | Yes (production build fails without) |
| `NEXT_PUBLIC_SHOW_DEMO_HINTS` | `false` or unset (production **build fails** if `true`) |

CSP `connect-src` derives from `NEXT_PUBLIC_API_URL` via `security-headers.mjs`.

---

## Build commands

```bash
# Backend
cd backend && npm ci && npm run prisma:generate && npm run build
# Start: NODE_ENV=production node dist/main

# User portal
cd user-frontend && npm ci && npm run build && npm run start

# Admin portal
cd admin-frontend && npm ci && npm run build && npm run start
```

Or from root: `npm run build` (all workspaces).

---

## Database (production)

1. Provision PostgreSQL 16+.
2. Apply SQL: `bash backend/database/apply-migrations.sh` (or equivalent on Windows).
3. Seed policy:
   - **Preferred:** empty DB + admin-created users via admin portal
   - **Pilot:** `npm run db:seed` once with `--reset-passwords`, then rotate all passwords before go-live
4. Do **not** run `005_auth_passwords.sql`, `003_drop_all.sql`, `011_reset_demo_data.sql`, or anything under `database/deprecated/`.
5. Ensure `014` has run if the DB was created when Prisma had `@unique` on `manager_user_id`.

---

## Redis (production)

Optional but recommended for dashboard cache at scale.

- Set `REDIS_ENABLED=true`
- API fails open if Redis unavailable — monitor and alert
- Restart API after Redis recovery to re-enable client

---

## Deployment checklist

| Step | Action |
|------|--------|
| 1 | Apply database SQL + verify enums (`013`) |
| 2 | Set all backend env vars; verify startup guards |
| 3 | Build backend; run `GET /health` |
| 4 | Build both frontends with production `NEXT_PUBLIC_API_URL` |
| 5 | Smoke test login (user + admin) |
| 6 | Run manual permission tests — [`TESTING.md`](TESTING.md) |
| 7 | Deactivate demo accounts or change passwords |
| 8 | Verify CORS from both portal origins |
| 9 | Confirm 5xx appear in `system_events` (admin API) |

---

## Health checks

| Endpoint | Use |
|----------|-----|
| `GET /health` | Load balancer / uptime monitor |
| `GET /admin/system-events?level=ERROR` | Post-deploy error scan (admin JWT) |

---

## Rollback

| Layer | Approach |
|-------|----------|
| API | Redeploy previous build artifact; JWT remains valid until expiry |
| Frontends | Redeploy previous static/Node build |
| Database | **No automated down migrations** — forward-fix SQL only; restore from backup for major rollback |

---

## Post-deployment verification

- [ ] Admin dashboard loads real counts
- [ ] User can create request end-to-end
- [ ] Manager inbox scoped to correct department
- [ ] Cross-user request access returns 404
- [ ] Email notifications (if enabled)
- [ ] No demo hints on login pages

---

## Infrastructure gaps (TODO)

| Item | Status |
|------|--------|
| Production Dockerfiles for API/frontends | Not in repo |
| Kubernetes / PM2 manifests | Not in repo (`ecosystem.config.js` not present) |
| Managed secrets (Vault, etc.) | Operator responsibility |
| SSO / company auth | Planned — [`SECURITY.md`](SECURITY.md) |
| HRIS integration | Planned — was `COMPANY_INTEGRATION.md` |

### Company integration (deferred)

- SSO via corporate IdP: **not implemented**
- HRIS user sync: **not implemented**
- Email via corporate relay: partial (Resend optional)

---

## Local Docker reference

Development only: `docker/docker-compose.yml` — **not** production deployment manifest.
