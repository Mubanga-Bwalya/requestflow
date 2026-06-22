# API reference

> **Last updated:** 2026-06-11  
> Base URL: `http://localhost:4000` (development)

**OpenAPI / Swagger:** **Not implemented.** This document is the authoritative reference.

Related: [`SECURITY.md`](SECURITY.md) · [`USER_ROLES_AND_PERMISSIONS.md`](USER_ROLES_AND_PERMISSIONS.md) · [`REQUEST_WORKFLOW.md`](REQUEST_WORKFLOW.md)

---

## Conventions

| Topic | Detail |
|-------|--------|
| Auth | `Authorization: Bearer <JWT>` unless `@Public()` |
| Pagination | `?page=1&limit=20` (default limit 20, max 100) |
| Errors | `{ statusCode, message, errors?, requestId }` |
| Request ID | Response header `X-Request-Id` |
| Identity | Never send `userId` in body for authorization — server uses JWT |

---

## Auth

### `POST /auth/login` — Public

| | |
|-|-|
| **Purpose** | Authenticate staff via Zamtel central staff auth, then issue a RequestFlow JWT |
| **Query** | `adminOnly=true` — admin portal only |
| **Body** | `{ gn, password }` — staff number + AD password, forwarded to `${ZAMTEL_AUTH_BASE_URL}/api/auth/login` |
| **Behaviour** | Auto-provisions the user on first sign-in (default role `Employee`) |
| **Response** | `{ user, accessToken, expiresIn }` |
| **Errors** | 401 invalid credentials; 403 non-admin when `adminOnly`; 503 when Zamtel auth is unavailable |
| **Throttle** | 5/min |

### `POST /auth/dev-login` — Public (non-production only)

| | |
|-|-|
| **Purpose** | Offline/demo sign-in by email, no password — issues a RequestFlow JWT |
| **Body** | `{ email }` |
| **Response** | `{ user, accessToken, expiresIn }` |
| **Errors** | 401 unknown/inactive email; **hard-disabled (404/403) when `NODE_ENV=production`** |
| **Throttle** | 5/min |

### `GET /auth/me`

| | |
|-|-|
| **Auth** | Required |
| **Purpose** | Current user profile + `inboxDepartmentName` |
| **Roles** | Any active user |

---

## Health

### `GET /health` — Public

Returns API health. No database required in lightweight test variant.

---

## Workspace

### `GET /workspace`

| | |
|-|-|
| **Auth** | Required |
| **Purpose** | Dashboard stats + preview rows for current user |
| **Query** | `includeInbox=true` (managers) |
| **Roles** | Any user; inbox section managers only |

---

## Requests

### `POST /requests`

| | |
|-|-|
| **Auth** | Required |
| **Purpose** | Create request |
| **Body** | `CreateRequestDto` — `templateId`, `targetDepartmentName`, `fieldAnswers`, optional `priority` |
| **Roles** | Any authenticated user |
| **Status** | Sets `SUBMITTED`; `createdByUserId` from JWT |

### `GET /requests`

| | |
|-|-|
| **Auth** | Required |
| **Query** | `targetDepartmentName` (manager inbox), `tab`, `q`, `page`, `limit` |
| **Roles** | Default: own requests. Inbox: manager with matching inbox dept |

### `GET /requests/:id`

| | |
|-|-|
| **Auth** | Required |
| **Roles** | Admin, requester, target manager, assignment members |
| **Errors** | 404 if unauthorized |

### `PATCH /requests/:id/status`

| | |
|-|-|
| **Body** | `{ status: RequestStatus, note? }` |
| **Validation** | Status transition table + `AccessPolicyService` + assignment alignment |
| **Roles** | Varies by target status — see [`USER_ROLES_AND_PERMISSIONS.md`](USER_ROLES_AND_PERMISSIONS.md) |

### `POST /requests/:id/request-missing-information`

| | |
|-|-|
| **Body** | `{ items: [{ fieldKey?, reasonLabel }], note? }` |
| **Roles** | Target department manager |

### `POST /requests/:id/provide-information`

| | |
|-|-|
| **Body** | `{ fieldAnswers: [...], note? }` |
| **Roles** | Requester only; status must be `NEEDS_INFORMATION` |

---

## Assignments

### `GET /assignments`

| | |
|-|-|
| **Query** | `page`, `limit`, `tab`, `q` |
| **Roles** | Scoped to JWT user membership |

### `GET /assignments/:id`

| | |
|-|-|
| **Roles** | Admin, member, target manager, requester |
| **Errors** | 404 if unauthorized |

### `POST /assignments`

| | |
|-|-|
| **Body** | `{ requestId, memberUserIds[], description? }` |
| **Roles** | Manager; assigner `departmentId` must match request target |
| **Validation** | At least one member; request `SUBMITTED` or `ACCEPTED` |

### `PATCH /assignments/:id/status`

| | |
|-|-|
| **Body** | `{ status, note? }` |
| **Roles** | Member/manager mutate; `READY_FOR_REVIEW` manager-only |

### `POST /assignments/:id/milestones`

| | |
|-|-|
| **Body** | `{ title, ownerUserId, deadline?, description? }` |
| **Roles** | Member or target manager |
| **Validation** | Owner must be assignment member |

### `PATCH /assignments/:assignmentId/milestones/:milestoneId`

| | |
|-|-|
| **Body** | `{ title?, status?, progress? }` — progress 0–100 |
| **Roles** | Member or target manager |

---

## Users

### `GET /users`

| | |
|-|-|
| **Query** | `departmentName` (manager team list), `page`, `limit` |
| **Roles** | Admin (all) or manager (own dept team only) |

### `GET /users/by-email/:email`

| | |
|-|-|
| **Roles** | Admin only |

### `POST /users` / `PATCH /users/:id`

| | |
|-|-|
| **Roles** | Admin only |
| **Body** | `CreateUserDto` / `UpdateUserDto` — name, email, department, role, optional `gn` (staff number). No password field — staff authenticate via Zamtel |

---

## Departments

### `GET /departments`

| | |
|-|-|
| **Roles** | Any authenticated user |

### `GET /departments/:id`

| | |
|-|-|
| **Roles** | Admin only |

### `POST /departments` / `PATCH /departments/:id`

| | |
|-|-|
| **Roles** | Admin only |

---

## Roles

### `GET /roles`

| | |
|-|-|
| **Roles** | Admin only |
| **Note** | No dedicated roles page; assign roles via **Users** admin UI. API exists for integrations. |

---

## Request templates

### `GET /request-templates` / `GET /request-templates/:id`

| | |
|-|-|
| **Roles** | Any authenticated user (read for create form) |

### `GET /request-templates/:id/fields`

| | |
|-|-|
| **Roles** | Any authenticated user |

### `POST /request-templates` / `PATCH /request-templates/:id`

| | |
|-|-|
| **Roles** | Admin only |

### Field mutations

| Route | Roles |
|-------|-------|
| `POST /request-templates/:id/fields` | Admin |
| `PATCH /request-templates/:templateId/fields/:fieldId` | Admin |
| `PATCH .../deactivate` | Admin |

---

## Notifications

### `GET /notifications` / `GET /notifications/unread-count`

| | |
|-|-|
| **Roles** | Own notifications only |

### `PATCH /notifications/:id/read` / `PATCH /notifications/mark-all-read`

| | |
|-|-|
| **Roles** | Own notifications only |

---

## System settings

### `GET /system-settings`

| | |
|-|-|
| **Roles** | Any authenticated user |

### `PATCH /system-settings`

| | |
|-|-|
| **Roles** | Admin only |

---

## Admin

All routes: **`AdminRoleGuard`** + elevated read throttle.

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/admin/dashboard` | Stats + recent activity/errors |
| GET | `/admin/reports` | Aggregates; optional `departmentName` |
| GET | `/admin/activity` | Activity log (`page`, `limit`) |
| GET | `/admin/system-events` | Error log (`page`, `limit`, `level`) |
| POST | `/admin/client-events` | Authenticated client error reports |

---

## Diagnostics

### `POST /diagnostics/client-events`

| | |
|-|-|
| **Purpose** | Frontend error/diagnostic ingest |
| **Auth** | Valid Bearer JWT **or** header `X-Diagnostics-Ingest-Secret` when `DIAGNOSTICS_INGEST_SECRET` is set |
| **Throttle** | 90/min |
| **Body limits** | `class-validator` max lengths on `ClientEventDto` (e.g. message 2000, stack 4000) |

---

## Common error responses

| Code | Meaning |
|------|---------|
| 400 | Validation / illegal status transition |
| 401 | Missing or invalid JWT |
| 403 | Forbidden (explicit policy) |
| 404 | Not found or hidden (IDOR) |
| 409 | Optimistic concurrency conflict |
| 429 | Rate limited |
| 500 | Generic message in production; logged to `system_events` |
| 503 | Upstream dependency unavailable (e.g. Zamtel staff auth on `POST /auth/login`) |

---

## Further reference

- Full JSON shapes for each DTO: `backend/src/modules/*/dto/`
- OpenAPI/Swagger: not implemented; this document is authoritative
