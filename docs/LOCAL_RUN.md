# RequestFlow — Local run guide

> **Last updated:** 2026-06-04

Use this to run the full stack and test admin + user portals end-to-end.

**Production deploy:** see [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md).

## Prerequisites

- Node.js 18+
- Docker (PostgreSQL) or PostgreSQL 16
- Ports free: **5432**, **4000**, **3000**, **3001**

## 1. Database

```bash
docker compose up -d
```

Apply SQL (first time or after reset):

```bash
psql -U postgres -d postgres -f backend/database/000_create_database.sql
psql -U postgres -d requestflow -f backend/database/001_create_schema.sql
psql -U postgres -d requestflow -f backend/database/002_seed_core_data.sql
psql -U postgres -d requestflow -f backend/database/004_system_settings.sql
psql -U postgres -d requestflow -f backend/database/006_performance_indexes.sql
psql -U postgres -d requestflow -f backend/database/007_request_number_sequences.sql
psql -U postgres -d requestflow -f backend/database/008_system_events.sql
```

`006` adds list-query indexes (safe to re-run). `007` adds concurrency-safe request number counters (required for new installs). `008` adds the admin **System health** error log on the dashboard.

If the DB still has **plain-text** passwords (old seed), hash demo users:

```bash
cd backend
npm run hash-passwords
```

After pulling auth changes, **clear browser localStorage** on both portals (or log in again) so sessions include a JWT.

Skip `000` if Docker already created `requestflow`. See [`backend/database/README.md`](../backend/database/README.md).

## 2. Backend API

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npm run build
npm run start:dev
```

Health: http://localhost:4000/health

If you see `Cannot find module ... dist/main`, run `npm run build` first.

## 3. User portal (port 3000)

```bash
cd user-frontend
cp .env.example .env.local
npm install
npm run dev
```

http://localhost:3000

## 4. Admin portal (port 3001)

```bash
cd admin-frontend
cp .env.example .env.local
npm install
npm run dev
```

http://localhost:3001

Default dev uses **webpack** (stable on Windows/OneDrive). Optional: `npm run dev:turbo`.

## Test accounts

**Password for all demo users:** `requestflow`

| Email | Portal | Role (DB) |
|-------|--------|-----------|
| admin@requestflow.local | Admin :3001 | **Admin** |
| jane.employee@requestflow.local | User :3000 | Employee |
| henry.hr@requestflow.local | User | HR Manager |
| mary.marketing@requestflow.local | User | Marketing Manager |
| helen.hr@requestflow.local | User | HR Team Member |
| mark.marketing@requestflow.local | User | Marketing Team Member |

Note: admin user's **display name** is "System Admin"; the **role** stored in `roles.name` is `Admin`. Login uses `POST /auth/login` (admin portal adds `?adminOnly=true`).

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Settings page error in admin | Run `004_system_settings.sql` |
| Admin login fails | `admin@requestflow.local` / `requestflow`; role must be **Admin**; run `005_auth_passwords.sql` if passwords were never set |
| Invalid email or password | Run `002` or `005`; password is `requestflow` |
| Hydration / missing sidebar | Hard refresh; clear site data; ensure latest `auth-context` + `require-admin-auth` |
| Empty templates / users | Run `002` seed; API on :4000 |
| CORS / network errors | `NEXT_PUBLIC_API_URL=http://localhost:4000` in both `.env.local` |
| `dist/main` missing | `cd backend && npm run build` |
| `.next` ENOENT / tmp manifest | Stop dev server; `Remove-Item -Recurse -Force admin-frontend\.next`; `npm run dev` |
| Slow compiles | Exclude `node_modules` / `.next` from OneDrive sync |

## Full E2E test

See **Full E2E test** in [AGENTS.md](../AGENTS.md).

## Related docs

- [README.md](../README.md) — project overview
- [backend/README.md](../backend/README.md) — API list
- [admin-frontend/AGENTS.md](../admin-frontend/AGENTS.md) — admin handover
- [user-frontend/AGENTS.md](../user-frontend/AGENTS.md) — user handover
