# Code organization

> **Last updated:** 2026-06-11

Related: [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`CODING_STANDARDS.md`](CODING_STANDARDS.md)

---

## Where business rules live (single source of truth)

| Concern | Location | Notes |
|---------|----------|--------|
| **Authorization** | `backend/src/common/access-policy.service.ts` | View/mutate rules for requests and assignments |
| **Department manager** | `backend/src/common/department-manager.ts` | `isDepartmentManager()` — `departments.manager_user_id` only |
| **Manager inbox HTTP gate** | `backend/src/common/auth-helpers.ts`, `manager-inbox.ts` | Uses department-manager helper |
| **Request status transitions** | `backend/src/common/request-status-transitions.ts` | Allowed status changes |
| **Assignment status transitions** | `backend/src/common/assignment-status-transitions.ts` | Allowed assignment changes |
| **Workflow guards** | `backend/src/common/request-workflow-guards.ts` | Status/progress alignment, missing-info gates |
| **JWT role reload** | `backend/src/modules/auth/jwt.strategy.ts` | DB is authoritative each request |

Frontend role checks (`role-utils.ts`, `RequireAdminAuth`, sidebar) are **UX only**. Never duplicate authorization logic in the client.

---

## Backend module layout

Controllers stay thin. Feature modules use **facade services** that delegate to focused services:

| Module | Facade | Query | Mutation / lifecycle |
|--------|--------|-------|----------------------|
| Requests | `requests.service.ts` | `requests-query.service.ts` | `requests-create.service.ts`, `requests-lifecycle.service.ts` → `requests-status-lifecycle.service.ts`, `requests-missing-info-lifecycle.service.ts` |
| Assignments | `assignments.service.ts` | `assignments-query.service.ts` | `assignments-mutation.service.ts` → `assignments-create.service.ts`, `assignments-status-mutation.service.ts`, `assignments-milestones.service.ts` |
| Users | `users.service.ts` | `users-query.service.ts` | `users-mutation.service.ts` (+ `users-resolve.helpers.ts`) |
| Departments | `departments.service.ts` | `departments-query.service.ts` | `departments-mutation.service.ts` (+ `departments.mapper.ts`) |

Shared lifecycle cache helper: `requests-lifecycle-cache.ts`.

---

## Frontend layout

| Portal | Path | Role |
|--------|------|------|
| User | `user-frontend/src/app/(portal)/*` | Employee/manager workflows |
| Admin | `admin-frontend/src/app/(portal)/*` | Configuration and reporting |
| Shared patterns | `src/lib/*-api.ts`, `src/hooks/*`, `src/components/ui/*`, `src/components/shared/*` | Per-portal copies (see duplication plan below) |

Large hooks split validation/build helpers into `src/lib/`:

- `admin-users-form.ts` — admin user form state and validation
- `create-request-build.ts` — request payload field-answer builder

Styles per app (monolithic — both portals keep identical copies):

- `src/app/globals.css` — `@tailwind` directives, `:root` design tokens, body/a11y rules, and `@layer components` `.rf-*` classes in one file

A split into `src/styles/requestflow-*.css` was tried and reverted: `@import` between `@tailwind` directives is skipped by `postcss-import`, so tokens and component styles never loaded (login and shared UI broke).

---

## Duplication between portals (documented)

`user-frontend` and `admin-frontend` intentionally mirror structure. There is **no shared npm package** yet (`package.json` workspaces: backend + two Next apps only).

### Identical or near-identical (safe to extract later)

| Area | Files | Future action |
|------|-------|---------------|
| API client | `lib/api.ts`, `lib/api-error.ts`, `lib/api-base-url.ts` | `packages/frontend-core` |
| UI kit | `components/ui/*` (12 files), `button-link`, `pagination-bar`, `loading-screen`, `api-error-banner` | `packages/ui` |
| Config | `security-headers.mjs`, `next.config.mjs` | Root or `packages/frontend-config` |
| Styles | `src/app/globals.css` (identical in both apps) | Shared Tailwind preset or `packages/ui` styles when workspaces are added |

### Intentionally different (keep per portal)

| Area | Why |
|------|-----|
| `lib/session.ts` | Different `localStorage` keys (`requestflow_session` vs `requestflow_admin_session`) |
| `lib/auth-api.ts` | Admin uses `adminOnly` login |
| `lib/auth-context.tsx` | User has profile/avatar/department; admin has accessibility-only extras |
| `components/shared/status-badge.tsx` | User = workflow statuses; admin = entity active/inactive |

### Drift fixes applied (Phase 5)

- Admin `query-cache.ts` — `cacheEpoch` guard (matches user portal)
- Admin `auth-context.tsx` — `invalidateApiCache()` on `SET_SESSION`
- Admin `data-table.tsx` — stable row keys via `row.id`

### Future extraction plan

1. Add `packages/frontend-core` with api client, query-cache, session-events, api-error
2. Add `packages/ui` with identical UI + shared components
3. Keep portal-specific auth/session in each app
4. Parameterize `report-client-error.ts` with `portal: "user" | "admin"`

Estimated effort: medium (workspace wiring, Tailwind preset sharing, CI typecheck paths). Deferred until a third consumer or frequent drift pain justifies it.

---

## TypeScript strictness

| Workspace | Strict | Notes |
|-----------|--------|-------|
| `user-frontend`, `admin-frontend` | `strict: true` | Maintain; avoid `any` on public APIs |
| `backend` | Partial strict | Incremental path: enable `strictNullChecks` module-by-module; no repo-wide flip in one PR |

See [`CODING_STANDARDS.md`](CODING_STANDARDS.md) for file-size targets.
