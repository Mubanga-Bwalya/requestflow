# RequestFlow — Performance Test Plan (dev only)

Use this checklist after performance changes. Run against a **local/dev database only**.

## Prerequisites

- Docker Postgres (+ optional Redis: `docker compose up -d`)
- SQL migrations through `010_performance_indexes.sql`
- Backend `:4000`, user portal `:3000`, admin `:3001`
- Demo password: `requestflow`

## Optional load data

```bash
cd backend
# Dev-only — does not run automatically; review script before use
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-load-test.ts --requests=1000
```

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
