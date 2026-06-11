# Local setup

> **Last updated:** 2026-06-11

Step-by-step guide to run RequestFlow on a developer machine.

Related: [`DATABASE.md`](DATABASE.md) · [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`SECURITY.md`](SECURITY.md)

---

## 1. Required software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.11+ (`.nvmrc`) | All apps |
| npm | 10+ | Package management |
| Docker Desktop | Current | Postgres 16 + Redis 7 |
| psql (optional) | — | Manual SQL if not using Prisma execute |

Ports must be free: **5432**, **6379**, **4000**, **3000**, **3001**.

---

## 2. Clone and install

```bash
git clone <repo-url> RequestFlow
cd RequestFlow
npm install
```

This installs dependencies for `backend`, `user-frontend`, and `admin-frontend` (npm workspaces).

---

## 3. Start infrastructure

```bash
npm run docker:up
```

Starts:

- **PostgreSQL 16** — database `requestflow`, user/password `postgres`/`postgres`, port 5432
- **Redis 7** — port 6379 (optional; backend works with `REDIS_ENABLED=false`)

Verify Postgres: `docker exec requestflow-postgres pg_isready -U postgres -d requestflow`

---

## 4. Database setup

See [`DATABASE.md`](DATABASE.md) for the full SQL file list.

**First-time quick path:**

```bash
bash backend/database/apply-migrations.sh
# Windows: .\backend\database\apply-migrations.ps1

cd backend
npm run prisma:generate
npm run db:seed -- --reset-passwords
```

This applies all schema SQL (including templates in `002`) and seeds demo users. Re-running `db:seed` without `--reset-passwords` preserves existing passwords.

**Do not run** `005_auth_passwords.sql` (disabled; wrote plaintext passwords historically).

---

## 5. Backend environment

```bash
cp backend/.env.example backend/.env
```

Minimum for local dev:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/requestflow
JWT_SECRET=dev-only-change-me-to-32-chars-minimum!!
JWT_EXPIRES_IN=28800
REDIS_ENABLED=false
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
EMAIL_ENABLED=false
```

See [`SECURITY.md`](SECURITY.md) for all variables.

```bash
npm run prisma:generate --workspace=backend
npm run build --workspace=backend
npm run dev:api
```

Health check: http://localhost:4000/health

---

## 6. Frontend environment

In **both** `user-frontend` and `admin-frontend`:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SHOW_DEMO_HINTS=true
```

**Demo login hints** are baked in at dev-server start. If hints do not appear on `/login`, confirm `.env.local` exists with `NEXT_PUBLIC_SHOW_DEMO_HINTS=true` and **restart** `npm run dev`. Hints never appear in production builds (the build fails if the flag is `true`).

| Portal | Hint content (when enabled) |
|--------|----------------------------|
| User (:3000) | Musa, Ivan (`mbwalya4477@gmail.com`), Iris — password `requestflow` |
| Admin (:3001) | `admin@requestflow.local` — password `requestflow` |

```bash
npm run dev:user    # :3000
npm run dev:admin   # :3001
```

---

## 7. Optional Redis cache

```bash
docker compose -f docker/docker-compose.yml up -d redis
```

In `backend/.env`:

```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

Restart the API. If Redis stops, the API **continues serving from PostgreSQL** (fail-open). Restart Redis and the API to re-enable caching.

---

## Demo accounts

**Development only.** Password: `requestflow` (bcrypt in seed) unless noted.

> **Live database note:** Jane (`jane@requestflow.local`) was removed from the current demo DB. Ivan (Innovations manager) uses `mbwalya4477@gmail.com` for email-server testing — not `ivan@requestflow.local`. Seed/SQL files are updated to match; your DB may differ until you re-apply seeds.

| Email | Portal | Role / use |
|-------|--------|------------|
| `admin@requestflow.local` | Admin (:3001) | System Admin |
| `musa@requestflow.local` | User (:3000) | Marketing team member — **default requester** for demos |
| `mbwalya4477@gmail.com` | User (:3000) | Ivan — Innovations manager (inbox / assign) |
| `iris@requestflow.local` | User (:3000) | Innovations assignee |
| `henry@requestflow.local` | User (:3000) | HR Manager |
| `helen@requestflow.local` | User (:3000) | HR team member (non-manager) |
| `mary@requestflow.local` | User (:3000) | Marketing Manager |
| `mark@requestflow.local` / `mia@requestflow.local` | User (:3000) | Marketing team members |

**Supervisor demo workflow:** Musa creates a request → Ivan reviews/accepts/assigns → Iris updates milestones → Musa views progress → Admin uses admin portal for configuration.

Set `NEXT_PUBLIC_SHOW_DEMO_HINTS=false` (or unset) before `npm run build` — production builds **fail** if it is `true`.

---

## Phase 3 changelog (2026-06-11)

**What changed:** Demo login hints and admin email prefill are gated behind `NEXT_PUBLIC_SHOW_DEMO_HINTS=true` only. Production builds reject `NEXT_PUBLIC_SHOW_DEMO_HINTS=true`. Removed unused `roles-api.ts` and dead throttle helper. Added `.cursorignore`.

**Developer rules:**

- Never ship production with `NEXT_PUBLIC_SHOW_DEMO_HINTS=true`.
- Commit `.env.example` files only — never `.env` or `.env.local`.
- Localhost API fallback is development-only; production requires `NEXT_PUBLIC_API_URL`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Admin login: "Admin access required" | Use `admin@requestflow.local`; DB role must be **Admin** |
| Invalid email or password | `npm run db:seed --workspace=backend -- --reset-passwords`; or `npm run hash-passwords` only for legacy plaintext DBs; clear browser `localStorage` |
| 401 on all API calls | Log in again; check `JWT_SECRET` in `backend/.env` |
| CORS / network errors | `NEXT_PUBLIC_API_URL=http://localhost:4000` in both `.env.local` files |
| `dist/main` missing | `npm run build --workspace=backend` |
| Hydration error / missing sidebar | Hard refresh; clear stale session; ensure `authReady` in auth context |
| Admin `.next` ENOENT | Delete `admin-frontend/.next`; use `npm run dev` (webpack) |
| Slow dev on Windows / OneDrive | Exclude `.next` and `node_modules` from sync; see performance notes below |
| Too many test requests in DB | `npm run cleanup-dev-requests --workspace=backend` |

### Windows / OneDrive performance

- Prefer `npm run dev` (webpack default); avoid `dev:turbo` on OneDrive-synced folders.
- Move the repo outside OneDrive or exclude `.next/` from sync.
- After workflow actions, frontends invalidate API cache; dashboard refreshes within seconds.

---

## Smoke test (5 minutes)

1. Admin login → dashboard shows counts; **System Logs** (`/logs`) loads system events and activity tabs
2. User login → create a request
3. Manager login → department inbox → accept → assign
4. Assignee → tasks → update milestone progress
5. Requester → approve when status is `READY_FOR_REVIEW` or `COMPLETED`

Full manual checklist: [`TESTING.md`](TESTING.md).

**Pilot / production:** [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) · [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md).
