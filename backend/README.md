# RequestFlow API (NestJS)

> **Last updated:** 2026-06-03 — Prisma client aligned with `backend/database/001_create_schema.sql`.

## Setup

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run build
npm run start:dev
```

Ensure PostgreSQL has schema + seed + `004_system_settings.sql` applied. See [`database/README.md`](database/README.md).

Base URL: **http://localhost:4000**

## Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | `{ status: "ok", service: "RequestFlow API" }` |

## Users & roles

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List users (`?departmentName=HR` filters by dept) |
| GET | `/users/by-email/:email` | Profile lookup (not for login) |
| POST | `/users` | Create user (optional `password`; defaults to `requestflow`) |
| PATCH | `/users/:id` | Update user (optional `password`) |
| GET | `/roles` | List roles |

## Auth

All routes except `/health` and `POST /auth/login` require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Returns `{ user, accessToken, expiresIn }` (passwords bcrypt; demo `requestflow`) |
| POST | `/auth/login?adminOnly=true` | Same; `403` if role is not Admin / System Admin |
| GET | `/auth/me` | Current user profile from JWT |

Migrate plain-text DB passwords: `npm run hash-passwords`

## Departments & templates

| Method | Path | Description |
|--------|------|-------------|
| GET | `/departments` | List (`?activeOnly=false`) |
| GET | `/departments/:id` | Detail |
| PATCH | `/departments/:id` | Update manager, etc. |
| GET | `/request-templates` | List (`?departmentName=`, `?departmentId=`) |
| GET | `/request-templates/:id` | Template + fields |
| GET | `/request-templates/:id/fields` | Fields only |
| PATCH | `/request-templates/:id` | e.g. `isActive` |
| POST | `/request-templates/:id/fields` | Add field |
| PATCH | `/request-templates/:templateId/fields/:fieldId` | Update field |
| PATCH | `/request-templates/:templateId/fields/:fieldId/deactivate` | Deactivate field |

## Requests

| Method | Path | Description |
|--------|------|-------------|
| POST | `/requests` | Create request |
| GET | `/requests` | List (`?createdByUserId=`, `?targetDepartmentName=`, `?status=`) |
| GET | `/requests/:id` | Detail |
| PATCH | `/requests/:id/status` | Status transition |
| POST | `/requests/:id/request-missing-information` | Manager asks for info |
| POST | `/requests/:id/provide-information` | Requester supplies info |

## Assignments & milestones

| Method | Path | Description |
|--------|------|-------------|
| GET | `/assignments` | List (`?userId=`, `?requestId=`) |
| GET | `/assignments/:id` | Detail + milestones |
| POST | `/assignments` | Create assignment |
| PATCH | `/assignments/:id/status` | e.g. `READY_FOR_REVIEW`, `COMPLETED` |
| POST | `/assignments/:id/milestones` | Add milestone |
| PATCH | `/assignments/:assignmentId/milestones/:milestoneId` | Update milestone |

When assignment progress reaches 100% via milestones, request status syncs to `COMPLETED`.

## Notifications & settings

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | User notifications (`?userId=`) |
| PATCH | `/notifications/:id/read` | Mark read |
| PATCH | `/notifications/mark-all-read` | Mark all read |
| GET | `/system-settings` | Public settings row |
| PATCH | `/system-settings` | Admin update |

## Admin analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard` | Summary cards |
| GET | `/admin/reports` | Report cards (`?departmentName=`) |
| GET | `/admin/activity` | Recent activity (`?limit=`) |

## Environment

`DATABASE_URL` in `.env` must point at database `requestflow` (see `.env.example`).

## Auth (MVP)

JWT auth: `POST /auth/login` returns `accessToken`; frontends store it in `localStorage` and send `Authorization: Bearer`. Passwords are bcrypt (`requestflow` for demo users).
