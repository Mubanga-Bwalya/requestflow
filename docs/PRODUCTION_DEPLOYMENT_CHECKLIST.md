# Production deployment checklist

> **Last updated:** 2026-06-04 — Phase 1 deployment blockers (CSP env, production env guards).  
> **Readiness target:** 8/10 for a controlled internal deployment (not public internet multi-tenant).

Use this document in order. Do not skip environment validation or database SQL steps.

---

## 1. Pre-flight (repository)

| Check | Command / action | Pass criteria |
|-------|------------------|---------------|
| No secrets in git | `git ls-files \| findstr /i "\.env"` (Windows) or `git ls-files \| grep -E '^\.env$'` | Only `*.env.example` files tracked; no `backend/.env`, `.env.local` |
| `.gitignore` | Root + each app | `.env`, `.env.local`, `.env.*.local`, `node_modules`, `.next`, `dist` ignored |
| CI green | GitHub Actions `CI` workflow on `main` | Backend: build, unit + e2e tests, lint; both frontends: typecheck, lint, build |

---

## 2. Environment variables

### 2.1 Backend (`backend/.env` — never commit)

Copy from `backend/.env.example` and set:

| Variable | Production example (not real secrets) | Required | Startup fails if |
|----------|----------------------------------------|----------|----------------|
| `NODE_ENV` | `production` | **Yes** | — (guards apply when set) |
| `DATABASE_URL` | `postgresql://app_user:REPLACE_ME@db.internal:5432/requestflow` | **Yes** | DB connection fails |
| `JWT_SECRET` | 40+ random chars, e.g. `k8Jm2…` (generate with `openssl rand -base64 48`) | **Yes** | Missing, &lt; 32 chars, or known weak values (`change_this_secret`, `requestflow`, etc.) |
| `JWT_EXPIRES_IN` | `28800` (8 hours, seconds only) | Recommended | — |
| `CORS_ORIGINS` | `https://requests.company.com,https://admin-requests.company.com` | **Yes** | Missing, empty, `*`, or any origin containing `*` |
| `PORT` | `4000` | Optional | — |
| `ALLOW_DEMO_DEFAULT_PASSWORD` | **unset** or `false` | **Must not be `true`** | `true` in production |
| `ALLOW_LEGACY_PLAINTEXT_PASSWORDS` | **unset** or `false` | **Must not be `true`** | `true` in production |

**Production password policy (enforced):**

- Demo password `requestflow` cannot be used as the default for **new** admin-created users (`allowDemoDefaultPassword()` is always off in production).
- Plain-text password verification is disabled unless you mis-set `ALLOW_LEGACY_PLAINTEXT_PASSWORDS=true`, which **blocks API startup**.
- Run `npm run hash-passwords` after seed if upgrading legacy DBs; do **not** run `005_auth_passwords.sql` in production.

**Do not** set `ALLOW_DEMO_DEFAULT_PASSWORD=true` or `ALLOW_LEGACY_PLAINTEXT_PASSWORDS=true` in production.

### 2.2 User portal (`user-frontend/.env.local` — never commit)

Set **before** `npm run build` in production (CSP is computed at build time):

| Variable | Production example | Required | Build fails if |
|----------|-------------------|----------|--------------|
| `NEXT_PUBLIC_API_URL` | `https://api.company.com` (no trailing path; no `*`) | **Yes** (prod build) | Missing when `NODE_ENV=production`; invalid URL; wildcards |
| `NEXT_PUBLIC_SHOW_DEMO_HINTS` | `false` | Recommended | — |

Development: `NEXT_PUBLIC_API_URL=http://localhost:4000` (default in `.env.example`). CSP also allows `http://127.0.0.1:4000` in non-production builds.

### 2.3 Admin portal (`admin-frontend/.env.local`)

Same as user portal. Use the **same** `NEXT_PUBLIC_API_URL` unless admin and user APIs differ (unusual).

### 2.4 CSP `connect-src` (automatic)

Both portals read `security-headers.mjs`, which sets CSP `connect-src` to:

- `'self'`
- The **origin** of `NEXT_PUBLIC_API_URL` (e.g. `https://api.company.com`)
- In **development** only: `http://localhost:4000` and `http://127.0.0.1:4000`

You do **not** edit `next.config.mjs` by hand for each deploy. Set `NEXT_PUBLIC_API_URL` and rebuild both frontends after any API host change.

---

## 3. Database setup

### 3.1 New production database

Run on PostgreSQL 16+ (database `requestflow`):

```bash
psql -U postgres -d requestflow -f backend/database/001_create_schema.sql
psql -U postgres -d requestflow -f backend/database/002_seed_core_data.sql
psql -U postgres -d requestflow -f backend/database/004_system_settings.sql
psql -U postgres -d requestflow -f backend/database/006_performance_indexes.sql
psql -U postgres -d requestflow -f backend/database/007_request_number_sequences.sql
psql -U postgres -d requestflow -f backend/database/008_system_events.sql
```

`002` is idempotent for re-runs but **not** a full data migration tool — use only for initial MVP seed or documented refresh.

### 3.2 Seed policy (production)

| Policy | Recommendation |
|--------|----------------|
| Demo seed (`002`) | **Pilot only** — HR/Marketing demo users with password `requestflow` |
| Production | Prefer **empty DB + admin-created users** OR seed once then **change all passwords** |
| Re-seed | Requires maintenance window; may duplicate rows where `ON CONFLICT` applies |

### 3.3 First admin password change

1. Log in to admin portal as `admin@requestflow.local` (if seeded) **only on a private network**.
2. **Users** → edit admin (or create new admin user with strong password).
3. Set password ≥ 12 characters; cannot be `requestflow` in production.
4. Deactivate or change password on demo accounts before wider rollout.
5. Optional: `cd backend && npm run hash-passwords` if upgrading from plain-text legacy DB.

---

## 4. Build commands

```bash
# Backend
cd backend
npm ci
npm run prisma:generate
npm run build
# Start: npm run start:prod  (NODE_ENV=production, .env set)

# User portal (set NEXT_PUBLIC_API_URL in .env.local first)
cd user-frontend
npm ci
# Production example: set env then build
#   set NEXT_PUBLIC_API_URL=https://api.company.com   (Windows cmd)
#   export NEXT_PUBLIC_API_URL=https://api.company.com  (bash)
npm run build
# Start: npm run start  (port 3000 default)

# Admin portal
cd admin-frontend
npm ci
npm run build
# Start: npm run start  (port 3001 — set PORT=3001 if needed)
```

---

## 5. Test commands (verify before deploy)

**Windows (all three apps):**

```powershell
powershell -File scripts/verify-production-readiness.ps1
```

**Manual:**

```bash
cd backend
npm run typecheck
npm run lint
npm run test
npm run test:e2e          # requires Postgres + seed; see test/e2e-env.ts

cd ../user-frontend
npm run typecheck
npm run lint
npm run build

cd ../admin-frontend
npm run typecheck
npm run lint
npm run build
```

### npm audit (all packages)

```bash
cd backend && npm audit --audit-level=high
cd ../user-frontend && npm audit --audit-level=high
cd ../admin-frontend && npm audit --audit-level=high
```

| Package | Expected |
|---------|----------|
| Backend | 0 high/critical (runtime deps) |
| Frontends | Critical Next/axios addressed via pinned versions; remaining highs often **dev** (eslint/glob) — document as accepted for MVP or run `npm audit fix` without `--force` |

---

## 6. Security controls (verify)

| Control | Implementation | Compensating control if N/A |
|---------|----------------|-----------------------------|
| CORS | `CORS_ORIGINS` explicit; startup fails if missing, `*`, or wildcard substring in production | Reverse proxy must not add `*` |
| Demo / plaintext passwords | Startup fails if `ALLOW_DEMO_DEFAULT_PASSWORD=true` or `ALLOW_LEGACY_PLAINTEXT_PASSWORDS=true` in production | Bcrypt-only auth |
| Frontend CSP | `connect-src` from `NEXT_PUBLIC_API_URL` at build time | Rebuild frontends after API URL change |
| JWT | DB-loaded roles; inactive users rejected | Demoted admin: role checked per request (no token version yet) |
| Rate limit | Login 5/min; writes 60/min | WAF at proxy optional |
| API headers | `helmet()` on NestJS (`main.ts`) | Terminate TLS at load balancer |
| Frontend headers | `next.config.mjs` — X-Frame-Options, CSP, etc. | Proxy can add HSTS |
| Health | `GET /health` → `{ status, service }` only | No DB version, no secrets |
| Secrets | `.env` gitignored | Use platform secret manager in prod |
| File uploads | Filename metadata only | No virus scan / object storage (post-MVP) |
| RLS | Application-level `AccessPolicyService` | PostgreSQL RLS not enabled (post-MVP) |

---

## 7. Deployment commands (generic)

Exact hosting varies (VM, Docker, Kubernetes, PaaS). Minimum process model:

| Service | Command | Port |
|---------|---------|------|
| API | `node backend/dist/main.js` | 4000 |
| User UI | `next start` in `user-frontend` | 3000 |
| Admin UI | `PORT=3001 next start` in `admin-frontend` | 3001 |

**Reverse proxy (recommended):** TLS termination, HSTS, request size limits, optional WAF. Proxy must forward `Authorization` header and preserve CORS origins list on the API.

**Docker Postgres:** See root `docker-compose.yml` for local/staging only — use managed Postgres in production.

---

## 8. Rollback notes

| Layer | Rollback |
|-------|----------|
| API | Deploy previous `dist/` or container image; keep `JWT_SECRET` unchanged or all users must re-login |
| Frontends | Deploy previous `.next` build artifact or static export |
| Database | **No automatic down migration** — restore from backup taken before deploy |
| Config | Revert `CORS_ORIGINS` / env in platform; restart services |

Before schema changes: `pg_dump` backup of `requestflow`.

---

## 9. Post-deployment smoke tests

### 9.1 Automated (API)

```bash
curl -s http://localhost:4000/health
# Expect: {"status":"ok","service":"RequestFlow API"}

curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/workspace
# Expect: 401 (no token)
```

### 9.2 Manual E2E (15–20 min)

Prerequisites: all three apps running, DB seeded, demo or real accounts.

| # | Actor | Action | Expected |
|---|--------|--------|----------|
| 1 | Admin | Login → dashboard | Real counts, no errors |
| 2 | Jane (user) | Create HR request | 201, request number `RF-YYYY-NNNN` |
| 3 | Henry (HR mgr) | Inbox → Accept | Status accepted |
| 4 | Henry | Assign Helen | Assignment visible to Helen |
| 5 | Helen | Tasks → add/update milestone | Progress updates |
| 6 | Jane | Request detail → Approve (when reviewable) | Status approved |
| 7 | Any | Hard refresh | Session persists (JWT) |
| 8 | Admin | Reports | Aggregates load |

Full table: [`AGENTS.md`](../AGENTS.md) — Full E2E test.

---

## 10. Sign-off

| Role | Item | Date |
|------|------|------|
| Engineering | Builds + tests + audit documented | |
| Security | P0/P1 closed or compensating control approved | |
| Ops | DB backup + rollback path understood | |
| Product | Demo seed policy accepted or users provisioned | |

---

## Related docs

- [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) — Score, P0/P1 status, deferred post-MVP items
- [`PRODUCTION_AUTH.md`](PRODUCTION_AUTH.md) — JWT, cookies, token version roadmap
- [`LOCAL_RUN.md`](LOCAL_RUN.md) — Developer setup
- [`COMPANY_INTEGRATION.md`](COMPANY_INTEGRATION.md) — SSO / HRIS later
