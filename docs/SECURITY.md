# Security

> **Last updated:** 2026-06-18

Related: [`USER_ROLES_AND_PERMISSIONS.md`](USER_ROLES_AND_PERMISSIONS.md) · [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`DEPLOYMENT.md`](DEPLOYMENT.md) · [`LOCAL_SERVER_DEPLOYMENT.md`](LOCAL_SERVER_DEPLOYMENT.md)

---

## Summary for supervisors

RequestFlow is designed for **internal use only** on Zamtel’s network. Security is built in layers:

| Protection | What it means |
|------------|---------------|
| Login required | Users must sign in with email and password |
| Role-based access | Employees, managers, and admins see only what their role allows |
| Server-side enforcement | The API checks every request; the UI cannot bypass rules |
| Department boundaries | Managers only act on requests for departments they manage |
| Rate limiting | Login and write operations are throttled against abuse |
| Audit trail | Important actions and errors are logged |
| Safe errors | Users see generic messages; details go to system logs |

Full technical detail below. For deployment assumptions: [`LOCAL_SERVER_DEPLOYMENT.md`](LOCAL_SERVER_DEPLOYMENT.md).

---

## Authentication

| Aspect | Implementation |
|--------|----------------|
| Method | JWT Bearer (`Authorization: Bearer <token>`) |
| Login | `POST /auth/login` — bcrypt password verify |
| Admin login | `POST /auth/login?adminOnly=true` — role must be `Admin` or `System Admin` |
| Token storage (client) | `localStorage` (`requestflow_session` / `requestflow_admin_session`) — **pilot risk:** XSS could exfiltrate JWT; mitigate with CSP, internal network, and planned httpOnly cookie migration |
| Token expiry | `JWT_EXPIRES_IN` seconds (default 28800 = 8h) |
| Secret | `JWT_SECRET` — min 32 chars in production; weak defaults rejected at startup |
| Role in token | **Not trusted** — reloaded from DB in `JwtStrategy.validate()` |
| Inactive users | Blocked at login and on each JWT validation |
| Password hashing | bcrypt (10 rounds); policy min 12 chars for admin-created passwords |
| Demo password | `requestflow` — blocked as default in production (`ALLOW_DEMO_DEFAULT_PASSWORD`) |

---

## Authorization (server-side)

Central policy: `AccessPolicyService`.

| Pattern | Behaviour |
|---------|-----------|
| Request detail IDOR | Returns **404** if user cannot view |
| Assignment detail IDOR | Returns **404** if user cannot view |
| Notifications | Always scoped to `user.id` from JWT |
| Admin routes | `AdminRoleGuard` on `/admin/*` and selected mutations |
| Identity in body | **Never** accept `userId` / `role` from client for authorization |

Full matrix: [`USER_ROLES_AND_PERMISSIONS.md`](USER_ROLES_AND_PERMISSIONS.md).

---

## Input validation

| Layer | Detail |
|-------|--------|
| Global pipe | `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` |
| DTOs | `class-validator` on controllers |
| Errors | `{ statusCode, message, errors?, requestId }` |

---

## Rate limiting

| Throttle | Limit |
|----------|-------|
| Default | 200 req/min |
| Login | 5 req/min |
| Writes | 60 req/min on mutating routes |
| Admin reads | 600 req/min |

Bypass: `E2E_DISABLE_THROTTLE=true` (tests only).

**Account lockout:** Login throttle only (5 req/min). There is **no persistent lockout store** — repeated failures are rate-limited per window, not permanently blocked. Plan SSO or `tokenVersion`/lockout table for wider rollout.

---

## Security headers

| Layer | Headers |
|-------|---------|
| API | Helmet (CSP disabled for JSON API) |
| Frontends | `security-headers.mjs` — `X-Frame-Options`, `X-Content-Type-Options`, CSP with `connect-src` from `NEXT_PUBLIC_API_URL` |

Production frontend build **requires** `NEXT_PUBLIC_API_URL` for CSP.

---

## CORS

Explicit origin list via `CORS_ORIGINS`. Wildcard `*` **rejected** in production when credentials enabled.

---

## Secrets and environment variables

| Variable | Notes |
|----------|-------|
| `JWT_SECRET` | Required production; never commit |
| `DATABASE_URL` | Never commit |
| `RESEND_API_KEY` | Never commit; use empty placeholder in `.env.example`. Rotate in Resend if ever committed to git history |
| `DIAGNOSTICS_INGEST_SECRET` | Optional; when set, allows unauthenticated ingest via `X-Diagnostics-Ingest-Secret` header |
| `ALLOW_DEMO_DEFAULT_PASSWORD` | Must be false/unset in production |
| `ALLOW_LEGACY_PLAINTEXT_PASSWORDS` | Must be false/unset in production |

`.env`, `.env.local` are gitignored.

---

## Audit and logging

| System | Purpose |
|--------|---------|
| `activity_logs` | Business actions (requests, assignments, sign-in when enum applied) |
| `system_events` | 5xx errors, login failures, slow requests |
| `X-Request-Id` | Correlation on all API responses |
| Client diagnostics | `POST /diagnostics/client-events` — JWT required, or `X-Diagnostics-Ingest-Secret` when `DIAGNOSTICS_INGEST_SECRET` is set |

Audit writes are **non-blocking** (failures swallowed so primary flow continues).

---

## IDOR prevention

| Resource | Enforcement |
|----------|-------------|
| `GET /requests/:id` | `assertCanViewRequest` |
| `GET /assignments/:id` | `assertCanViewAssignment` |
| `PATCH /notifications/:id/read` | `userId` match |
| `GET /requests` (default) | `createdByUserId = JWT user` |

Covered by `backend/test/security.e2e-spec.ts`.

---

## Redis fail-open

If Redis is disabled or unreachable, API serves from PostgreSQL. No auth bypass; possible stale role cache up to ~45s when Redis enabled.

**Operations:** On Redis outage, API continues (fail-open). After Redis recovery, **restart the API** to re-establish the cache client. Redis status is not exposed on `GET /health` — monitor Redis process separately. See [`LOCAL_SERVER_DEPLOYMENT.md`](LOCAL_SERVER_DEPLOYMENT.md#redis-failure-procedure).

---

## Phase 3 changelog (2026-06-11)

**What changed:** Demo login hints and prefilled admin email require `NEXT_PUBLIC_SHOW_DEMO_HINTS=true`. Production Next.js builds fail if that flag is `true`. API URL localhost fallback is blocked in production without `NEXT_PUBLIC_API_URL`.

**Developer rules:** See `.gitignore` / `.cursorignore` for env and generated paths. Demo UI is not a security control — backend authorization remains authoritative.

---

## Phase 1 changelog (2026-06-11)

**What changed:** Tightened workflow authorization, unified department-manager checks, secured diagnostics ingest, and clarified secrets handling.

**Why:** Members could bypass manager review by forcing `COMPLETED` / `READY_FOR_REVIEW`; manager authority was inferred from role name + `departmentId` instead of `departments.manager_user_id`; diagnostics were public.

**Developer rules:**

- Use `isDepartmentManager()` / `user.managedDepartmentIds` for manager authority — **not** `isManagerRole()` + `departmentId`.
- Assignees must belong to the request target department (MVP).
- Members may only set assignment status to `IN_PROGRESS` and may only edit their own milestones.
- `100%` milestone progress syncs `progressPercentage` only — never auto-completes the request.
- Never commit real API keys; rotate any key that appeared in git history.

---

## Known gaps (honest assessment)

| Severity | Gap | Location |
|----------|-----|----------|
| **High** | JWT in `localStorage` — XSS can steal tokens | Both frontends |
| **Medium** | No token revocation / `tokenVersion` | Auth module |
| **Medium** | 45s auth user cache may serve stale role | `jwt.strategy.ts` + Redis |
| **Medium** | Admin login 403 reveals valid non-admin account | `auth.service.ts` |
| **Medium** | No OpenAPI; no automated dependency audit in CI | Tooling |
| **Low** | CSP `unsafe-inline` / `unsafe-eval` on frontends | `security-headers.mjs` |
| **Low** | Department list exposes manager emails to all users | `departments.service.ts` |
| **Low** | `backend/.env.example` must not contain real API keys | Rotate if committed |

### Planned mitigations

- httpOnly cookies + CSRF (documented, not implemented)
- Add `tokenVersion` on user record

---

## Security testing

See [`TESTING.md`](TESTING.md) — `security.e2e-spec.ts`, `regression.e2e-spec.ts`, `rate-limit.e2e-spec.ts`.
