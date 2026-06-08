# RequestFlow — Performance Test Plan (dev only)

Use this checklist after performance changes. Run against a **local/dev database only**.

## Prerequisites

- Docker Postgres (+ optional Redis: `docker compose up -d`)
- SQL migrations through `010_performance_indexes.sql`
- Backend `:4000`, user portal `:3000`, admin `:3001`
- Demo password: `requestflow`

## Optional load data (dev database only)

**Safety:** `seed-load-test.ts` refuses `NODE_ENV=production`, does **not** delete data, and labels rows `RF-{year}-LT{n}`. Use only on a local/dev database — never on pilot or production data.

| Volume | Command | Notes |
|--------|---------|-------|
| 100 | `--requests=100` | Quick smoke (~seconds) |
| 1,000 | `--requests=1000` | Default pilot load test |
| 10,000 | `--requests=10000` | Sequential inserts; expect several minutes |

```bash
cd backend
# Confirm NODE_ENV is not production; confirm DATABASE_URL points at dev DB
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-load-test.ts --requests=1000
```

Seed creates bare requests only (no assignments, milestones, or notifications). Pair with manual workflow tests for inbox/tasks concurrency.

## Manual tests

| # | Test | Steps | Expected |
|---|------|-------|----------|
| 1 | Login | User + admin login | < 500ms perceived; no errors |
| 2 | Sidebar nav | Click Dashboard → Requests → Tasks | No shell flicker; instant nav feedback |
| 3 | Dashboard | Open `/dashboard` | Stats load; preview rows ≤ 10 |
| 4 | My Requests | `/requests` with 100 / 1k / 10k rows (seed) | Paginated (20/page); search debounced ~300ms |
| 5 | Tasks | `/tasks` | Paginated; debounced search |
| 6 | Create request | Submit new request | Button loading; single submit |
| 7 | Request detail | Open request; approve/reopen | Loading on action buttons |
| 8 | Department inbox | Manager inbox + search | Debounced API calls |
| 9 | Admin users | `/users` | Paginated; client filter debounced |
| 10 | Concurrent assign | Two managers assign same request (two tabs) | One 201, one **409 Conflict** |
| 11 | Concurrent status | Two status updates on same request | Second gets **409** if state changed |
| 12 | Notifications | Bell badge | Poll ~45s; count updates after read |
| 13 | Redis off | `REDIS_ENABLED=false` | App works normally |
| 14 | Redis on | `REDIS_ENABLED=true`, Redis running | Cache hits in dev logs; login/dashboard OK |
| 15 | Redis down | Enable Redis then stop container | App falls back to PostgreSQL; no crash |
| 16 | Admin dashboard | Admin login → `/dashboard` | Stats load; activity feed live; after mutation counts update within ~60s (Redis) or immediately (Redis off) |
| 17 | Admin reports | `/reports` | Department cards load; switch department; cache invalidates after request/assignment changes |
| 18 | Milestone concurrency | Two tabs update same milestone | Progress consistent; one tab may get **409** on assignment status if racing |

Tests 10–11 and 18 are also covered by `backend/test/concurrency.e2e-spec.ts` in CI.

## Automated checks

```bash
cd backend && npm run typecheck && npm run test && npm run test:e2e
cd user-frontend && npm run lint && npm run typecheck
cd admin-frontend && npm run lint && npm run typecheck
```

**Note:** `npm run build` on OneDrive-synced paths may fail with `.next/trace EPERM` — environment lock, not application code.

## Targets (internal MVP)

- List pages: paginated, no full-table load
- Dashboard workspace: < 1s p95 on dev hardware with 1k requests
- Auth: JWT validate cached 45s when Redis enabled (DB still authoritative on miss)
- Admin dashboard/reports: Redis aggregate cache 60s (optional); activity feed not cached
- Automated concurrency tests: `backend/test/concurrency.e2e-spec.ts`

## Production slow-request logging

Set in `backend/.env` for pilot deployments:

```env
SLOW_REQUEST_LOGGING_ENABLED=true
SLOW_REQUEST_MS=500
```

Logs method, path, status, duration, and `X-Request-Id` only — no body or tokens.
