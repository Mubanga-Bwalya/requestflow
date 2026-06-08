# Company system integration notes

> **Last updated:** 2026-06-04 — MVP uses JWT + PostgreSQL; company IdP is a future swap.

## Deferred (company-provided)

- **Authentication / SSO** — Replace or wrap `POST /auth/login` with company IdP (OIDC/SAML). Optionally move tokens from `localStorage` to httpOnly cookies.
- **User provisioning** — Map `external_employee_id` on `users` to HR directory records.
- **Department mapping** — `departments.external_department_code` is ready for org-structure sync.

## Current session contract (frontends)

JWT access token + profile stored in `localStorage`:

| Key | Portal |
|-----|--------|
| `requestflow_session` | User portal (:3000) |
| `requestflow_admin_session` | Admin portal (:3001) |

Shape (see `session.ts` in each frontend):

```json
{
  "accessToken": "jwt",
  "expiresAt": 1234567890,
  "userId": "uuid",
  "email": "string",
  "fullName": "string",
  "roleName": "string | null",
  "departmentName": "string | null"
}
```

API calls send **`Authorization: Bearer <accessToken>`**. The backend derives `userId`, role, and department from the token + database (`JwtStrategy`) — clients must **not** send spoofable `userId`, `actorUserId`, or `createdByUserId` query parameters.

Admin routes additionally require DB role `Admin` or `System Admin` (`AdminRoleGuard`).

## API integration points

| Area | Endpoints | Notes |
|------|-----------|--------|
| Auth | `POST /auth/login`, `GET /auth/me` | Rate-limited login; roles loaded from DB per request |
| Requests | `/requests`, `/requests/:id/status` | List: `tab`, `q`, pagination; detail/mutations enforce access policy |
| Assignments | `/assignments` | Member/manager authorization on detail and milestones |
| Admin config | `/admin/*`, `/users`, `/departments`, `/request-templates`, `/system-settings` | Admin JWT required |
| Settings | `/system-settings` | Single row `default` |

## Environment variables

| Variable | App | Purpose |
|----------|-----|---------|
| `NEXT_PUBLIC_API_URL` | Frontends | API base URL |
| `NEXT_PUBLIC_SHOW_DEMO_HINTS` | Frontends | `true` shows login demo credentials |
| `CORS_ORIGINS` | Backend | Comma-separated portal origins (required in production) |
| `DATABASE_URL` | Backend | PostgreSQL |
| `JWT_SECRET` | Backend | Signs JWTs (≥32 chars in production) |

## Recommended swap order

1. Company IdP or httpOnly cookie session (see [`docs/PRODUCTION_AUTH.md`](PRODUCTION_AUTH.md)).
2. User/department sync job using `external_*` fields.
3. Optional: webhook/event bus for request status changes.
