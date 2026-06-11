# Testing

> **Last updated:** 2026-06-11

Related: [`SECURITY.md`](SECURITY.md) · [`SETUP.md`](SETUP.md)

---

## Commands

| Command | Scope |
|---------|-------|
| `npm run test` | Backend unit tests (`backend/src/**/*.spec.ts`) |
| `npm run test:e2e` | Backend e2e (`backend/test/*.e2e-spec.ts`) |
| `npm run test:e2e:security` | Security e2e only |
| `npm run test:cov --workspace=backend` | Coverage report |
| `npm run lint` | All workspaces |
| `npm run typecheck` | All workspaces |
| `npm run build` | All workspaces |

**Frontends:** no automated tests currently (0 test files).

CI (`.github/workflows/ci.yml`): backend unit + e2e, all three apps lint/typecheck/build.

**Latest local run (2026-06-11):** unit **68/68**, e2e **44/44**, typecheck all workspaces pass. Frontends lint with warnings only (`no-img-element`, one `exhaustive-deps`). Backend ESLint may report pre-existing issues in unrelated files — see CI or run `npm run lint --workspace=backend`.

---

## Unit tests (backend)

| File | Covers |
|------|--------|
| `access-policy.service.spec.ts` | Permission matrix |
| `request-workflow-guards.spec.ts` | Status guards vs assignment progress |
| `password.service.spec.ts` | Bcrypt, password policy |
| `jwt-secret.spec.ts` / `production-env.spec.ts` | Boot security |
| `assignment.mapper.spec.ts` | Progress average; no auto-complete at 100% |
| `request-number.service.spec.ts` | RF-YYYY-NNNN formatting |
| `template-dto.validation.spec.ts` | Template DTO validation |
| Others | Pagination tabs, validation format, deadline util |

---

## E2E tests (backend)

| File | Covers |
|------|--------|
| `security.e2e-spec.ts` | IDOR, status authZ, milestone authZ, admin demotion, DTO validation |
| `regression.e2e-spec.ts` | Extended authZ, notifications isolation, structured errors |
| `workflow.e2e-spec.ts` | Missing-info guards; early COMPLETED blocked |
| `concurrency.e2e-spec.ts` | Race on assign/status/milestones |
| `rate-limit.e2e-spec.ts` | Login 429 after 5 failures |
| `app.e2e-spec.ts` | Health, login, `/auth/me` |

Requires PostgreSQL with seed data. `E2E_DISABLE_THROTTLE=true` in test env.

---

## Coverage gaps (priority)

| Area | Status |
|------|--------|
| Full happy path (create → approve) | **Missing** e2e |
| Manager REJECTED / requester REOPENED | **Missing** e2e |
| `adminOnly` login gate | **Missing** e2e |
| Expired / malformed JWT | **Missing** e2e |
| Admin CRUD 403 for employee JWT | **Partial** |
| 100% progress → request sync behaviour | **Missing** e2e |
| Write throttle 429 | **Missing** |
| Frontend (any) | **Missing** |
| 5xx → `system_events` persistence | **Missing** |
| Redis fail-open behaviour | **Manual only** |

---

## Manual test cases

### Critical permission tests

| # | Test | Expected |
|---|------|----------|
| P1 | Employee A `GET /requests/{B's id}` | 404 |
| P2 | Employee A `GET /assignments/{not member}` | 404 |
| P3 | HR manager inbox for Marketing dept | 403 |
| P4 | Employee `GET /admin/dashboard` | 403 |
| P5 | Employee `POST /users` | 403 |
| P6 | Requester `PATCH` own request to `ACCEPTED` | 403 |
| P7 | Non-manager `POST /assignments` | 403 |
| P8 | Notification read other user's id | 403/404 |

### Admin smoke (6 steps)

1. Login `admin@requestflow.local`
2. Users → add user
3. Departments → set manager
4. Templates → toggle field
5. Settings → save persists
6. Reports → live data

### Demo accounts (manual / Playwright)

| User | Email | Password | Role |
|------|-------|----------|------|
| Musa | `musa@requestflow.local` | `requestflow` | Marketing requester |
| Ivan | `mbwalya4477@gmail.com` | `requestflow` | Innovations manager |
| Iris | `iris@requestflow.local` | `requestflow` | Innovations assignee |
| Henry | `henry@requestflow.local` | `requestflow` | HR Manager |
| Helen | `helen@requestflow.local` | `requestflow` | HR team member |
| Admin | `admin@requestflow.local` | `requestflow` | Admin portal |

Jane (`jane@requestflow.local`) is **not** in the current database. Backend e2e tests use **Musa** as the employee requester.

### Full cross-portal E2E (13 steps)

| # | Action | Expected |
|---|--------|----------|
| 1 | Admin login | Dashboard counts |
| 2 | Settings save/reload | User create reflects settings |
| 3 | Add/deactivate user | DB + login behaviour |
| 4 | Set Henry/Mary as managers | Inbox available |
| 5 | Deactivate template | Hidden on user create |
| 6 | Edit dropdown options | User form updates |
| 7 | Musa creates request (e.g. to Innovations) | Default priority from settings |
| 8 | Ivan accepts + assigns Iris | Assignment created |
| 9 | Iris milestones to 100%; Ivan marks ready for review | `READY_FOR_REVIEW` (not auto-complete) |
| 10 | Musa approves | Only when reviewable |
| 11 | Missing info round-trip | Status flow continues |
| 12 | Admin reports match activity | Consistent counts |
| 13 | Hard refresh | Session persists |

### Redis fail-open (manual)

1. Start API with `REDIS_ENABLED=true` and Redis running.
2. Load dashboard (cache warm).
3. Stop Redis container.
4. API continues responding; workspace may be slower.
5. Restart Redis + API — caching resumes.

---

## Performance / load testing

Manual plan (formerly `PERFORMANCE_TEST_PLAN.md`):

```bash
cd backend
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-load-test.ts --requests=1000
```

Seed creates bare requests only — pair with workflow tests for inbox/tasks concurrency.

---

## Recommended next tests

1. `workflow-happy-path.e2e-spec.ts` — create through approve
2. `auth-admin-gate.e2e-spec.ts` — `adminOnly` + employee admin routes
3. Vitest smoke for `api-error.ts` and `auth-context.tsx` (both frontends)
4. CI: `npm audit`, coverage thresholds on `access-policy` and workflow guards
