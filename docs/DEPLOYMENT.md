# Deployment

> **Last updated:** 2026-06-18  
> **Status:** Deployment **plan and checklist** — not a finished production pipeline (no Dockerfiles for app services in repo).

Related: [`SECURITY.md`](SECURITY.md) · [`DATABASE.md`](DATABASE.md) · [`SETUP.md`](SETUP.md) · [`LOCAL_SERVER_DEPLOYMENT.md`](LOCAL_SERVER_DEPLOYMENT.md) · [`BACKUP_AND_RECOVERY.md`](BACKUP_AND_RECOVERY.md) · [`PROJECT_STATUS.md`](PROJECT_STATUS.md)

---

## Readiness target

See **[`PROJECT_STATUS.md`](PROJECT_STATUS.md)** for current scores (supervisor demo **8.5/10**, internal pilot **7.5/10**) and remaining risks.

Use **[`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md)** for sign-off steps.

---

## Pre-flight

| Check | Pass criteria |
|-------|---------------|
| No secrets in git | Only `*.env.example` tracked |
| CI green on `main` | Backend test + e2e; all builds |
| Zamtel auth configured | `ZAMTEL_AUTH_BASE_URL` set to the live staff-auth service |
| Dev-login disabled | `NODE_ENV=production` (hard-disables `POST /auth/dev-login`) |
| SQL migrations applied | Full `apply-migrations.sh` sequence including `013`, `014`, `015`, `016` |

---

## Environment variables

Complete reference for all services. Copy from `*.env.example` files; never commit real secrets.

### Backend (`backend/.env`)

| Variable | Required | Example | Purpose | Used by |
|----------|----------|---------|---------|---------|
| `DATABASE_URL` | Yes | `postgresql://user:pass@localhost:5432/requestflow` | PostgreSQL connection string | API |
| `JWT_SECRET` | Yes (prod) | 32+ random characters | Signs login tokens | API |
| `JWT_EXPIRES_IN` | Recommended | `28800` (8 hours) | Token lifetime in seconds | API |
| `ZAMTEL_AUTH_BASE_URL` | Yes (prod) | `http://10.3.104.141:7071` | Zamtel central staff auth base URL; staff GN + AD password forwarded to `${ZAMTEL_AUTH_BASE_URL}/api/auth/login` | API |
| `NODE_ENV` | Yes (prod) | `production` | Enables production guards; hard-disables `POST /auth/dev-login` | API |
| `PORT` | Optional | `4000` | API listen port | API |
| `CORS_ORIGINS` | Yes (prod) | `https://requests.local,https://admin.local` | Allowed portal origins (no `*`) | API |
| `REDIS_ENABLED` | Optional | `true` / `false` | Enable Redis cache | API |
| `REDIS_HOST` | If Redis on | `127.0.0.1` | Redis hostname | API |
| `REDIS_PORT` | If Redis on | `6379` | Redis port | API |
| `REDIS_PASSWORD` | Optional | *(empty or secret)* | Redis auth | API |
| `REDIS_DB` | Optional | `0` | Redis database index | API |
| `EMAIL_ENABLED` | Optional | `true` / `false` | Send email notifications | API |
| `SMTP_HOST` | If email on | `webmail.zamtel.co.zm` | SMTP relay host (unset → emails logged, not sent) | API |
| `SMTP_PORT` | Optional | `25` | SMTP port | API |
| `SMTP_SSL` | Optional | `false` | Implicit TLS (SMTPS, usually port 465) | API |
| `SMTP_USER` | If relay needs auth | *(from secret store)* | SMTP username | API |
| `SMTP_PASS` | If relay needs auth | *(from secret store)* | SMTP password | API |
| `SMTP_FROM` | If email on | `no-reply@zamtel.co.zm` | Sender address | API |
| `SMTP_FROM_NAME` | Optional | `RequestFlow` | Sender display name | API |
| `APP_BASE_URL` | If email on | `https://requests.company.local` | Links in notification emails | API |
| `DIAGNOSTICS_INGEST_SECRET` | Optional | Random string | Allows unauthenticated client error ingest | API |
| `SLOW_REQUEST_LOGGING_ENABLED` | Optional | `true` | Log slow requests in production | API |
| `SLOW_REQUEST_MS` | Optional | `500` | Threshold for slow request logging | API |
| `E2E_DISABLE_THROTTLE` | Test only | `true` | Disables rate limits in e2e tests | API |

### User portal (`user-frontend/.env.local`)

| Variable | Required | Example | Purpose | Used by |
|----------|----------|---------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000` | API base URL; also used for CSP at build | User portal |
| `NEXT_PUBLIC_ENABLE_DEV_LOGIN` | Dev only | `true` | Show email-only Developer sign-in tab (server-side dev-login still hard-disabled in prod) | User portal |
| `NEXT_PUBLIC_SHOW_DEMO_HINTS` | Dev only | `true` | Show demo login hints / Developer tab (build fails if `true` in prod) | User portal |
| `NEXT_PUBLIC_DEV_LAN_HOST` | Optional | `10.0.0.5` | LAN IP for phone testing CSP | User portal |

### Admin portal (`admin-frontend/.env.local`)

| Variable | Required | Example | Purpose | Used by |
|----------|----------|---------|---------|---------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:4000` | API base URL; also used for CSP at build | Admin portal |
| `NEXT_PUBLIC_ENABLE_DEV_LOGIN` | Dev only | `true` | Show email-only Developer sign-in tab (server-side dev-login still hard-disabled in prod) | Admin portal |
| `NEXT_PUBLIC_SHOW_DEMO_HINTS` | Dev only | `true` | Show demo login hints / Developer tab (build fails if `true` in prod) | Admin portal |
| `NEXT_PUBLIC_DEV_LAN_HOST` | Optional | `10.0.0.5` | LAN IP for phone testing CSP | Admin portal |

CSP `connect-src` derives from `NEXT_PUBLIC_API_URL` via `security-headers.mjs`.

---

## Build commands

```bash
# Backend
cd backend && npm ci && npm run prisma:generate && npm run build
# Start: NODE_ENV=production node dist/main

# User portal (:3000)
cd user-frontend && npm ci && npm run build && npm run start:prod

# Admin portal (:3001 — start:prod binds port 3001)
cd admin-frontend && npm ci && npm run build && npm run start:prod
```

Or from root: `npm run build` (all workspaces).

**Restart after frontend rebuild:** Always restart `next start` / PM2 processes after `npm run build` on either frontend. Stale servers cause chunk 400 errors and blank pages.

---

## Database (production)

1. Provision PostgreSQL 16+.
2. **Backup first** — [`BACKUP_AND_RECOVERY.md`](BACKUP_AND_RECOVERY.md) (`pg_dump` before every migration).
3. Apply SQL: `bash backend/database/apply-migrations.sh` (or equivalent on Windows).
4. **Migration tracking:** Record each applied SQL filename and timestamp in an operator log (no `schema_migrations` table yet). See checklist in [`DATABASE.md`](DATABASE.md).
5. Seed policy:
   - **Preferred:** empty DB — staff are auto-provisioned on first Zamtel sign-in (default role **Employee**); promote admins manually in the admin portal
   - Demo seed users have no password and sign in only via dev-login, which is disabled when `NODE_ENV=production`
6. Do **not** run `005_auth_passwords.sql`, `003_drop_all.sql`, `011_reset_demo_data.sql`, or anything under `database/deprecated/`.
7. Ensure `014` has run if the DB was created when Prisma had `@unique` on `manager_user_id`.

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
| 5 | Smoke test login (user + admin) — staff GN + AD password via Zamtel |
| 5b | `npm run audit:deployment-smoke` (Playwright — requires prod-mode frontends) |
| 6 | Run manual permission tests — [`TESTING.md`](TESTING.md) |
| 7 | Confirm `NODE_ENV=production` (dev-login disabled) and `ZAMTEL_AUTH_BASE_URL` reachable |
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
| Kubernetes / PM2 manifests | Example only — [`ecosystem.config.cjs.example`](ecosystem.config.cjs.example); see [`LOCAL_SERVER_DEPLOYMENT.md`](LOCAL_SERVER_DEPLOYMENT.md) |
| Managed secrets (Vault, etc.) | Operator responsibility |
| Full SSO (OIDC/SAML) | Planned — [`SECURITY.md`](SECURITY.md). Central staff auth (GN + AD) already integrated |
| HRIS integration | Planned — [`INTEGRATION_READINESS.md`](INTEGRATION_READINESS.md) |

### Company integration (deferred)

- Central staff authentication (Zamtel GN + AD password): **integrated** via `ZAMTEL_AUTH_BASE_URL` — see [`INTEGRATION_READINESS.md`](INTEGRATION_READINESS.md)
- Full OIDC/SAML SSO with httpOnly cookies: **not implemented**
- HRIS user sync: **not implemented** (users auto-provisioned on first Zamtel sign-in)
- Email via corporate relay: yes (Zamtel internal SMTP via nodemailer; optional)

---

## Local Docker reference

Development only: `docker/docker-compose.yml` — **not** production deployment manifest.
