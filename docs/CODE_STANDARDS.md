# Code standards (maintainability)

> **Last updated:** 2026-06-04

## File length

- **Application source** (`backend/src`, `admin-frontend/src`, `user-frontend/src`): target **≤ 250 lines** per file.
- **Exceptions:** SQL under `backend/database/` (schema, seed, migrations) may exceed 250 lines when documented in `backend/database/README.md`.
- Prefer splitting large pages into `components/`, `hooks/`, and thin route containers.

## Naming

- **`auth-context.tsx`** — JWT session provider (`AuthProvider`, `useAuth`). Not mock data.
- **`session.ts`** — Token persistence in `localStorage` (MVP); see `docs/PRODUCTION_AUTH.md` for httpOnly migration.

## Stale patterns to avoid

- Do not reintroduce `mock-data.ts` or client-supplied `userId` / `actorUserId` on API calls.
- Identity comes from `Authorization: Bearer` and `@CurrentUser()` on the backend.
