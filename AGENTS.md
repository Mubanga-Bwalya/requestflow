# RequestFlow Agent Handover

> **Last updated:** 2026-06-04 — Full-stack MVP on PostgreSQL (admin + user + API). Use this file so new sessions keep context.

## Current project state

| App | Port | Data source |
|-----|------|-------------|
| User-frontend | 3000 | NestJS API — requests, templates, assignments, notifications, settings |
| Admin-frontend | 3001 | NestJS API — users, departments, roles, templates/fields, settings, dashboard, reports |
| Backend | 4000 | PostgreSQL via Prisma |

- No `mock-data.ts` in either frontend.
- SQL: `backend/database/001`, `002`, **`004`**, **`006`** (indexes), **`007`** (request number sequences), **`008`** (system error log); **`005`** if DB predates bcrypt passwords.
- **CI / tests:** `.github/workflows/ci.yml` — Postgres service, SQL through `008`, `npm run test` + `test:e2e`, all three apps typecheck/lint/build. Security e2e: `backend/test/security.e2e-spec.ts`, rate limit: `rate-limit.e2e-spec.ts`.
- **Validation / ops log:** Global `ValidationPipe` + `ApiExceptionFilter` → JSON `{ statusCode, message, errors?, requestId }`; `X-Request-Id` on every response. 5xx persisted to `system_events` (needs `008`). Admin dashboard **System health** ← `GET /admin/system-events`. Frontends: `apiErrorMessage()` in `*/src/lib/api-error.ts` (shows 400/422 messages in prod).
- Session: JWT in `localStorage`; login `POST /auth/login` → `{ user, accessToken }` (demo password **`requestflow`**); API calls use `Authorization: Bearer`.
- **Pagination:** List endpoints accept `page` + `limit` (default 20). UIs use `PaginationBar`; workspace/dashboard uses DB counts + 30-row previews.

## Admin-frontend integration map

| Feature | API |
|---------|-----|
| Login (**Admin** role only) | `POST /auth/login?adminOnly=true` — role `Admin` or `System Admin` |
| Dashboard / activity / logs | `GET /admin/dashboard`, `GET /admin/activity`, `GET /admin/system-events?page&limit&level` — UI at **/logs** |
| Users CRUD | `GET/POST/PATCH /users` (`page`, `limit`, `departmentName`) |
| Departments | `GET/POST/PATCH /departments` (`page`, `limit` on list) |
| Roles (read-only UI) | `GET /roles` |
| Templates / fields | `GET/POST/PATCH /request-templates` (paginated list), field POST/PATCH/deactivate |
| Reports | `GET /admin/reports` |
| Settings | `GET/PATCH /system-settings` |

**Auth UX:** `auth-context` (`AuthProvider`) restores JWT session after mount (`authReady`) to avoid React hydration mismatch with sidebar.

## User-frontend integration map

| Feature | API |
|---------|-----|
| Login | `POST /auth/login` |
| System settings (create form) | `GET /system-settings` |
| Templates / create request | `/request-templates/*`, `POST /requests` |
| My requests / detail | `/requests?page&limit`, status PATCH, provide missing info |
| Department inbox (managers) | `/requests?targetDepartmentName&page&limit`, `POST /assignments` |
| Tasks / milestones | `/assignments?page&limit` |
| Notifications | `/notifications?page&limit`, `/notifications/unread-count` |
| Dashboard | `GET /workspace` — stats counts + preview rows (not full tables) |

**Gating:** `RequireAuth` + `authReady` on shell; Department Inbox for roles containing `Manager`; Approve/Reopen only when `COMPLETED` or `READY_FOR_REVIEW`.

## Local run

See **[`docs/LOCAL_RUN.md`](docs/LOCAL_RUN.md)** — Docker Postgres, SQL files, `.env.local` for both frontends, troubleshooting.

## Admin smoke test (6 steps)

Prerequisites: seeded DB, `004` applied, API :4000, `admin-frontend/.env.local`.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login `admin@requestflow.local` | Dashboard real counts |
| 2 | Users → Add user | Persists; user portal can login |
| 3 | Departments → Set manager | Manager sees Department Inbox |
| 4 | Templates → toggle / add field | User create form updates |
| 5 | Settings → Save | Reload persists; user create uses priority/uploads |
| 6 | Reports | Live aggregates |

## Full E2E test (admin + user)

Prerequisites: all three apps running, `004_system_settings.sql` applied.

| # | Portal | Action | Expected |
|---|--------|--------|----------|
| 1 | Admin (:3001) | Login `admin@requestflow.local` | Dashboard real counts |
| 2 | Admin | Settings → save → reload | User create reflects settings |
| 3 | Admin | Users → add / deactivate / reactivate | DB + user login |
| 4 | Admin | Departments → set Henry/Mary managers | Inbox available |
| 5 | Admin | Templates → deactivate type | Hidden on user create |
| 6 | Admin | Template detail → DROPDOWN options → edit | Options on user form |
| 7 | User (:3000) | Jane → create request | Default priority from settings |
| 8 | Manager | Inbox → Accept → Assign team | Assignment created |
| 9 | Assignee | Tasks → milestones → Ready for Review / 100% | `READY_FOR_REVIEW` or `COMPLETED` |
| 10 | Jane | Request detail → Approve | Buttons only when reviewable |
| 11 | Manager | Request missing info → Jane provides | Flow continues |
| 12 | Admin | Reports + dashboard activity | Matches activity |
| 13 | Both | Hard refresh | Session + data persist |

**Accounts:** same emails as above — password **`requestflow`** for all demo users.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Admin login: "Admin access required" | Use `admin@requestflow.local` / `requestflow`; role must be **Admin** |
| Invalid email or password | Run `cd backend && npm run hash-passwords` or re-run `002`; password is **`requestflow`**; clear stale localStorage and re-login |
| 401 on all API calls after upgrade | Log in again; ensure `JWT_SECRET` in `backend/.env` |
| Hydration error / missing `<aside>` | Both portals use `authReady` in `auth-context`; hard refresh; clear stale session |
| Settings page error | Run `004_system_settings.sql` |
| API / CORS errors | `NEXT_PUBLIC_API_URL=http://localhost:4000` in both `.env.local` |
| `dist/main` missing | `cd backend && npm run build` |
| Admin `.next` ENOENT | Delete `admin-frontend/.next`; use `npm run dev` (webpack default) |
| Duplicate React key `…` on dashboard | Fixed — skeleton cards use unique keys |

## Business guardrails

- MVP: HR + Marketing only; no chat/comments

## Official brand palette (Zamtel v01 / Business)

- Primary `#008542`, Dark `#015217`, Lime `#A9DD00`, Magenta `#E73189` (accent only), White `#FFFFFF`
- Logos & come-home device: `user-frontend/public/brand/`, `admin-frontend/public/brand/`

## Code standards

- Application source files target **≤ 250 lines** — see [`docs/CODE_STANDARDS.md`](docs/CODE_STANDARDS.md).
- SQL seed/schema files may exceed 250 lines when documented in `backend/database/README.md`.

## Production deploy

- **Checklist:** [`docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- **Readiness:** 8/10 internal company MVP — [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md)

## Latest session summary (2026-06-04)

- **Phase 5:** Deployment checklist, readiness summary, env examples, verification matrix
- **Phases 1–4:** Security policy, JWT, e2e tests, maintainability (`auth-context`, file splits)

## Next recommended (post-MVP)

- httpOnly cookies / SSO / `tokenVersion` — `docs/PRODUCTION_AUTH.md`
- CSP `connect-src` for production API host in both `next.config.mjs`
- Role CRUD in admin UI; real file upload pipeline; PostgreSQL RLS
