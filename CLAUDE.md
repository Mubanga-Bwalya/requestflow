# RequestFlow Project Memory

> **Last updated:** 2026-06-04 — Read with [`AGENTS.md`](AGENTS.md) and [`docs/LOCAL_RUN.md`](docs/LOCAL_RUN.md).

## Persistent context

- **Monorepo:** `user-frontend`, `admin-frontend`, `backend`
- **Domain:** Internal request/progress tracking (not chat)
- **MVP departments:** HR + Marketing only

## Ports

| App | Port |
|-----|------|
| User portal | 3000 |
| Admin portal | 3001 |
| Backend API | 4000 |

## Run (minimal)

```bash
docker compose up -d
# psql: 001, 002, 004, 006, 007 on database requestflow
cd backend && npm run build && npm run start:dev
cd user-frontend && npm run dev      # .env.local → NEXT_PUBLIC_API_URL=http://localhost:4000
cd admin-frontend && npm run dev     # :3001
```

## Test accounts (password: requestflow)

| Email | Portal | DB role name |
|-------|--------|--------------|
| admin@requestflow.local | Admin :3001 | **Admin** (not "System Admin") |
| jane.employee@requestflow.local | User | Employee |
| henry.hr / mary.marketing | User | *Manager |
| helen.hr / mark.marketing | User | Team member |

## What works end-to-end

- Admin configures users, managers, templates/fields, system settings
- User creates requests (priority/uploads from settings), manager inbox, assign, milestones
- Requester approve when `COMPLETED` / `READY_FOR_REVIEW`
- Milestone average 100% auto-syncs request to `COMPLETED`

## Known implementation details

- **Auth:** JWT Bearer; roles from DB each request; `AuthProvider` in `auth-context.tsx` (both frontends)
- **Admin login** checks role `Admin` or `System Admin`
- **Admin hydration:** `authReady` before shell (avoids sidebar SSR mismatch)
- **Admin dev:** default `npm run dev` uses webpack; `dev:turbo` optional
- **OneDrive:** can corrupt `.next` — delete folder and avoid turbo on Windows synced paths
- **File length:** ≤ 250 lines for app source — `docs/CODE_STANDARDS.md`

## Production deploy

- Checklist: `docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md` — readiness 8/10 internal MVP (`docs/PRODUCTION_READINESS.md`)

## MVP limitations

- JWT in `localStorage` (not httpOnly); demo password `requestflow`
- File uploads: filename only
- No POST new template / role edit in admin UI

## Official brand palette

`#008542`, `#015217`, `#A9DD00`, `#FFFFFF`

## Prior sessions

- 2026-06-02: User request flow + assignments API
- 2026-06-03: Admin full integration, E2E docs, polish + bugfixes
