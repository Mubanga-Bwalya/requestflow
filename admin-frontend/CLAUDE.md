# Admin Frontend Session Memory

> **Last updated:** 2026-06-04

## Brand palette

`#008542`, `#015217`, `#A9DD00`, `#FFFFFF`

## Ports

- Admin: **3001**
- API: **4000** — `NEXT_PUBLIC_API_URL` in `.env.local`

## Integration

All pages use NestJS: dashboard, users, departments, roles (read-only), templates + fields, reports, settings.

## Login

- Email: `admin@requestflow.local`
- Role in DB: **`Admin`** (user's full name is "System Admin")
- `users-api.ts` accepts `Admin` or `System Admin`

## Auth / hydration

- `AuthProvider` (`auth-context.tsx`): initial state logged out; `useEffect` loads JWT + sets `authReady`
- `RequireAdminAuth`: shows "Loading…" until `authReady`, then shell or redirect

## Dev

```bash
cd backend && npm run start:dev
cd admin-frontend && npm run dev
```

`npm run dev` = webpack (OneDrive-safe). `npm run dev:turbo` if needed.

## Docs

[`AGENTS.md`](../AGENTS.md), [`docs/LOCAL_RUN.md`](../docs/LOCAL_RUN.md)
