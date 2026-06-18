# Architecture

> **Last updated:** 2026-06-18

Related: [`API.md`](API.md) · [`SECURITY.md`](SECURITY.md) · [`REQUEST_WORKFLOW.md`](REQUEST_WORKFLOW.md) · [`DATABASE.md`](DATABASE.md) · [`PROJECT_STATUS.md`](PROJECT_STATUS.md)

---

## Plain-language overview

RequestFlow has three main parts that work together:

1. **User portal** — where employees and department managers work (create requests, inbox, tasks).
2. **Admin portal** — where administrators configure the system (users, departments, templates, reports).
3. **API server** — the brain of the system. All business rules, security checks, and data changes happen here.

Both portals talk to the API over HTTPS. The API stores data in **PostgreSQL**. **Redis** is optional and speeds up repeated reads; if Redis is unavailable, the system continues using PostgreSQL only.

**Important:** The portals are thin clients. Hiding a button in the UI does not remove access — the API enforces who can do what.

For supervisors: [`SUPERVISOR_README.md`](SUPERVISOR_README.md).

---

## System overview

```txt
┌─────────────────┐     ┌─────────────────┐
│  user-frontend  │     │ admin-frontend  │
│   (Next.js)     │     │   (Next.js)     │
│     :3000       │     │     :3001       │
└────────┬────────┘     └────────┬────────┘
         │    Bearer JWT         │
         └──────────┬────────────┘
                    │ HTTPS/HTTP
                    ▼
         ┌──────────────────────┐
         │   backend (NestJS)   │
         │        :4000         │
         └──────────┬───────────┘
                    │
         ┌──────────┴───────────┐
         ▼                      ▼
   ┌───────────┐          ┌──────────┐
   │ PostgreSQL│          │  Redis   │
   │  (required)│         │(optional)│
   └───────────┘          └──────────┘
```

Both frontends are **thin clients**. All business rules, authorization, and status transitions run in the NestJS API.

---

## Backend architecture

| Area | Location | Responsibility |
|------|----------|----------------|
| HTTP entry | `backend/src/main.ts` | Helmet, CORS, global `ValidationPipe`, port binding |
| Modules | `backend/src/modules/*` | Feature controllers + services |
| Access control | `backend/src/common/access-policy.service.ts` | Request/assignment view and mutation rules — **do not duplicate in frontends** |
| Department manager | `backend/src/common/department-manager.ts` | `isDepartmentManager()` — `departments.manager_user_id` only — **single source of truth** |
| Workflow rules | `backend/src/common/request-status-transitions.ts`, `assignment-status-transitions.ts`, `request-workflow-guards.ts` | Status changes and missing-info gates |
| Auth | `backend/src/modules/auth/` | Login, JWT issue, password hashing |
| JWT validation | `backend/src/modules/auth/jwt.strategy.ts` | **Reload role, department, and managed departments from DB** each request |
| Workflow guards | `backend/src/common/request-workflow-guards.ts` | Status alignment with assignment progress |
| Status transitions | `backend/src/common/request-status-transitions.ts`, `assignment-status-transitions.ts` | Allowed state changes |
| Errors | `backend/src/common/filters/api-exception.filter.ts` | JSON errors + `X-Request-Id`; 5xx → `system_events` |
| Cache | `backend/src/common/cache/cache.service.ts` | Redis JSON cache; fail-open to PostgreSQL |
| Audit | `backend/src/common/audit-log/audit-log.service.ts` | `activity_logs` writes (non-blocking) |
| Prisma | `backend/src/prisma/prisma.service.ts` | Database client |

**Global guards:** `JwtAuthGuard` + `ConditionalThrottlerGuard` on all routes except `@Public()`.

---

## Frontend architecture

### User portal (`user-frontend`)

| Area | Location |
|------|----------|
| Routes | `src/app/(portal)/*` — dashboard, requests, create, inbox, tasks, settings |
| Auth | `src/lib/auth-context.tsx`, `src/lib/session.ts` (JWT in `localStorage`) |
| API client | `src/lib/api.ts` + domain modules (`requests-api.ts`, `assignments-api.ts`, …) |
| Role UI gates | `src/lib/role-utils.ts`, `sidebar-nav.tsx` (cosmetic only) |

### Admin portal (`admin-frontend`)

| Area | Location |
|------|----------|
| Routes | `src/app/(portal)/*` — dashboard, users, departments, templates, reports, **logs**, settings |
| Auth | `RequireAdminAuth` (login + **Admin/System Admin role**) + `auth-context.tsx` |
| API client | `src/lib/api.ts`, `src/lib/admin-api.ts` |
| Error UX | `ApiErrorBanner` — list/dashboard hooks surface API failures instead of fake-empty data |

### Admin logs (`/logs`)

- **Route:** `admin-frontend/src/app/(portal)/logs/page.tsx`
- **Tabs:** System events (HTTP failures from `system_events`) and Activity audit (`activity_logs`)
- **Components:** `components/admin-logs/*`, hooks `use-admin-activity-logs.ts`, `use-admin-system-logs.ts`
- **Migrations:** `008_system_events.sql`, `013_activity_admin_actions.sql`

### Admin forms (client validation)

| Form | Rules |
|------|--------|
| Settings | System name required (1–120 chars); upload limit **1–500 MB** (matches backend DTO) |
| Department | Name required on add/edit; **manager chosen manually** on edit from department members |
| Templates / users | Validated in respective hooks (existing) |

---

## Database architecture

- **Source of truth:** numbered SQL files in `backend/database/` (not Prisma Migrate).
- **Prisma:** client generation and type-safe queries (`backend/prisma/schema.prisma`).
- Details: [`DATABASE.md`](DATABASE.md).

---

## Authentication flow

1. Client `POST /auth/login` with email + password.
2. `AuthService` verifies bcrypt hash; inactive users rejected.
3. JWT signed with `sub` (user id), `email`, and **informational** role claims.
4. On each request, `JwtStrategy.validate()` **reloads** `roleName`, `departmentId`, and `inboxDepartmentName` from PostgreSQL (optional 45s Redis cache).
5. `@CurrentUser()` decorator supplies `RequestUser` to controllers.

Admin portal: `POST /auth/login?adminOnly=true` — requires DB role `Admin` or `System Admin`.

---

## Authorization flow

1. Controller receives authenticated `RequestUser`.
2. Service loads access context (`loadRequestAccessContext` / `loadAssignmentAccessContext`).
3. `AccessPolicyService` asserts view/mutate permission.
4. Lifecycle services apply status transition tables + workflow guards.
5. Unauthorized detail access returns **404** (not 403) to reduce ID enumeration.

Full matrix: [`USER_ROLES_AND_PERMISSIONS.md`](USER_ROLES_AND_PERMISSIONS.md).

---

## Request lifecycle (summary)

See [`REQUEST_WORKFLOW.md`](REQUEST_WORKFLOW.md).

`SUBMITTED` → manager `ACCEPTED` / `REJECTED` / `NEEDS_INFORMATION` → assign → `IN_PROGRESS` → manager `READY_FOR_REVIEW` → requester `APPROVED` / `REOPENED`.

---

## Task / progress lifecycle

1. Manager creates **assignment** with one or more members.
2. Members create/update **milestones** (0–100% each).
3. Assignment `progressPercentage` = **average** of milestone progress (`assignment.mapper.ts`).
4. **100% milestone progress does not auto-complete** the request or assignment.
5. Manager explicitly sets assignment `READY_FOR_REVIEW`; request syncs to `READY_FOR_REVIEW`.
6. Manager or workflow may set `COMPLETED`; requester approves.

---

## Notification flow

`NotificationsService` creates rows in `notifications` table on workflow events (assignment, status changes, missing info). Optional email via Resend when `EMAIL_ENABLED=true` (`backend/src/common/email/`).

Notifications are written **outside** database transactions (committed work may exist without a notification if email/insert fails).

---

## Redis / cache usage

| Key pattern | TTL | Purpose |
|-------------|-----|---------|
| Auth user | ~45s | Cached `RequestUser` after DB load |
| Workspace summary | varies | Dashboard counts per user |
| Admin stats | varies | Admin dashboard aggregates |

When `REDIS_ENABLED=false` or Redis is unreachable, all reads go to PostgreSQL. No request is rejected due to cache miss.

---

## Important code locations

| Concern | Path |
|---------|------|
| Request create | `backend/src/modules/requests/requests-create.service.ts` |
| Request status | `backend/src/modules/requests/requests-lifecycle.service.ts` |
| Assignment create | `backend/src/modules/assignments/assignments-mutation.service.ts` |
| Milestones | `backend/src/modules/assignments/assignments-milestones.service.ts` |
| Manager inbox | `backend/src/common/manager-inbox.ts` |
| Admin dashboard | `backend/src/modules/admin/admin.service.ts` |
| System settings | `backend/src/modules/system-settings/` |
| Frontend diagnostics ingest | `POST /diagnostics/client-events` (JWT or ingest secret, rate-limited) |

---

## Planned / not implemented

| Item | Status |
|------|--------|
| Company SSO / httpOnly cookies | Planned — see [`SECURITY.md`](SECURITY.md) |
| OpenAPI / Swagger | **Not implemented** |
| Admin `/logs` page | **Implemented** — system events + activity audit tabs |
| Shared frontend package | Not implemented — duplication documented in [`CODE_ORGANIZATION.md`](CODE_ORGANIZATION.md); drift fixes applied per portal |
| Prisma Migrate | Not used — manual SQL |
