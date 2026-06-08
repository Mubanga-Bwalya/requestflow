# Admin Frontend Agent Handover

> **Last updated:** 2026-06-04 — API-backed MVP for internal organisation deployment.

## Security model

- Login: `POST /auth/login?adminOnly=true` — DB role must be **Admin** (or System Admin).
- Session: JWT in `localStorage` via `src/lib/session.ts` — **accepted MVP risk**; see [`../docs/PRODUCTION_AUTH.md`](../docs/PRODUCTION_AUTH.md).
- Admin mutations require backend `AdminRoleGuard` + DB role on each request.
- Errors: `src/lib/api-error.ts` (generic in production).
- CSP `connect-src` follows `NEXT_PUBLIC_API_URL` at build time (`security-headers.mjs`).

## Integration

- API: `NEXT_PUBLIC_API_URL`
- Auth: `src/lib/auth-context.tsx` + `RequireAdminAuth` (`authReady` avoids hydration mismatch)
- Tables: `src/components/shared/data-table.tsx`

## Key routes

Dashboard, users, departments, roles (read-only), templates/fields, reports, settings — all via NestJS (`/admin/*`, `/users`, `/departments`, `/request-templates`, `/system-settings`).

## Local run

```bash
cd backend && npm run start:dev
cd admin-frontend && npm run dev   # :3001
```

Login: `admin@requestflow.local` / `requestflow` (dev seed). `NEXT_PUBLIC_SHOW_DEMO_HINTS=false` in production.

## Deployment

See [`../docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`](../docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md).
