# User Frontend Agent Handover

> **Last updated:** 2026-06-04 — API-backed MVP for internal organisation deployment.

## Security model

- Login: `POST /auth/login` → JWT; **roles loaded from DB on every API request** (not from client).
- Session: Bearer token in `localStorage` via `src/lib/session.ts` — **accepted MVP risk**; see [`../docs/PRODUCTION_AUTH.md`](../docs/PRODUCTION_AUTH.md).
- Do **not** send `userId`, `actorUserId`, or `createdByUserId` on API calls; backend uses `@CurrentUser()` from JWT.
- Errors: `src/lib/api-error.ts` shows generic messages in production builds.
- CSP `connect-src` follows `NEXT_PUBLIC_API_URL` at build time (`security-headers.mjs`).

## Integration

- API: `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`)
- Auth UI: `src/lib/auth-context.tsx` (`AuthProvider`, `authReady` before shell)
- Lists: server-side `tab`, `q`, `page`, `limit` on API routes

## Key routes

| Route | API |
|-------|-----|
| Login | `POST /auth/login` |
| Dashboard | `GET /workspace` |
| My requests | `GET /requests` (scoped to JWT user) |
| Department inbox | `GET /requests?targetDepartmentName=…` (managers only) |
| Tasks | `GET /assignments` (membership from JWT) |
| Create request | `POST /requests` |
| Request detail | `GET/PATCH /requests/:id`, missing-info endpoints |

## Local run

```bash
cd backend && npm run start:dev
cd user-frontend && npm run dev   # :3000
```

Copy `.env.example` → `.env.local`. Demo login: `jane.employee@requestflow.local` / `requestflow` (dev seed only). Set `NEXT_PUBLIC_SHOW_DEMO_HINTS=false` for production builds.

## Deployment

See [`../docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`](../docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md) and [`../docs/COMPANY_INTEGRATION.md`](../docs/COMPANY_INTEGRATION.md).
