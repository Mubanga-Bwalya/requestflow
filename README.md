# RequestFlow

RequestFlow is an internal request and progress tracking system for HR and Marketing departments. Employees submit structured requests, department managers review and assign work, assigned members track milestones, and requesters see progress and approve completion.

## MVP scope

- HR and Marketing only
- Structured request forms (templates + fields from DB)
- Manager review, missing-information workflow, team assignment
- Milestone-based progress tracking
- Admin configuration (users, departments, templates, settings, reports)
- No chat/comments in MVP

## Current status (2026-06-04)

| Layer | Status |
|-------|--------|
| **Backend** | NestJS + Prisma + PostgreSQL — JWT auth, access policy, rate limits, e2e security tests |
| **User portal** (`user-frontend`, :3000) | API-backed; Bearer JWT; settings-driven create-request |
| **Admin portal** (`admin-frontend`, :3001) | API-backed; admin role guard; configuration UI |
| **Auth** | Bcrypt + JWT; DB-loaded roles; `AccessPolicyService` on requests/assignments; rate limits; session in `localStorage` (see `docs/PRODUCTION_AUTH.md`) |

**Quick start:** see [`docs/LOCAL_RUN.md`](docs/LOCAL_RUN.md). **E2E test checklist:** [`AGENTS.md`](AGENTS.md).

## Tech stack

- Next.js 14, TypeScript, Tailwind CSS
- NestJS, Prisma, PostgreSQL 16

## Official brand palette

| Token | Hex |
|-------|-----|
| Primary Green | `#008542` |
| Dark Green | `#015217` |
| Lime Green | `#A9DD00` |
| White | `#FFFFFF` |

Both frontends use a dark-green sidebar and shared `BrandLogo` assets under `public/brand/`.

## Ports

| Service | Port |
|---------|------|
| User portal | 3000 |
| Admin portal | 3001 |
| API | 4000 |
| PostgreSQL | 5432 |

## Development setup

### 1. Database

```bash
docker compose up -d
psql -U postgres -d requestflow -f backend/database/001_create_schema.sql
psql -U postgres -d requestflow -f backend/database/002_seed_core_data.sql
psql -U postgres -d requestflow -f backend/database/004_system_settings.sql
psql -U postgres -d requestflow -f backend/database/006_performance_indexes.sql
psql -U postgres -d requestflow -f backend/database/007_request_number_sequences.sql
psql -U postgres -d requestflow -f backend/database/008_system_events.sql
psql -U postgres -d requestflow -f backend/database/010_performance_indexes.sql
```

Details: [`backend/database/README.md`](backend/database/README.md). `010` adds search indexes (`pg_trgm`) and list-query indexes — safe to re-run.

### 2. Backend

```bash
cd backend
cp .env.example .env   # set DATABASE_URL
npm install
npm run prisma:generate
npm run build          # required before start:dev if dist/ is missing
npm run start:dev
```

API: http://localhost:4000/health

### 3. Frontends

Copy `.env.example` → `.env.local` in each frontend (`NEXT_PUBLIC_API_URL=http://localhost:4000`).

```bash
cd user-frontend && npm install && npm run dev    # :3000
cd admin-frontend && npm install && npm run dev   # :3001
```

### Test accounts (local dev only — password: `requestflow`, bcrypt in seed)

Do not use the demo password in production. See [`docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md).

| Email | Use |
|-------|-----|
| `admin@requestflow.local` | Admin portal only — DB role name **`Admin`** |
| `jane@requestflow.local` | Create requests |
| `henry@requestflow.local` / `mary@requestflow.local` | Department inbox |
| `helen@requestflow.local` / `mark@requestflow.local` | Tasks / milestones |

## Folder structure

```txt
RequestFlow/
  user-frontend/     # Employee & manager portal
  admin-frontend/    # System configuration portal
  backend/           # NestJS API + database SQL
  docs/              # LOCAL_RUN.md
  AGENTS.md          # Agent handover + E2E playbook
  CLAUDE.md          # Project memory for AI sessions
```

## Documentation index

| File | Purpose |
|------|---------|
| [`docs/LOCAL_RUN.md`](docs/LOCAL_RUN.md) | Step-by-step local stack + troubleshooting |
| [`docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md) | **Deploy gate** — env, DB, builds, smoke, rollback |
| [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) | Readiness score (8/10 internal MVP), P0/P1, deferred items |
| [`docs/PRODUCTION_AUTH.md`](docs/PRODUCTION_AUTH.md) | JWT, CORS, password policy |
| [`docs/COMPANY_INTEGRATION.md`](docs/COMPANY_INTEGRATION.md) | Company SSO / HRIS integration notes |
| [`docs/CODE_STANDARDS.md`](docs/CODE_STANDARDS.md) | File length and naming conventions |
| [`backend/test/security.e2e-spec.ts`](backend/test/security.e2e-spec.ts) | Security regression e2e (IDOR, authZ, validation) |
| [`backend/test/workflow.e2e-spec.ts`](backend/test/workflow.e2e-spec.ts) | Workflow status guards e2e |
| [`backend/test/regression.e2e-spec.ts`](backend/test/regression.e2e-spec.ts) | Extended authZ/validation regression e2e |
| [`AGENTS.md`](AGENTS.md) | Integration maps, smoke tests, full E2E |
| [`CLAUDE.md`](CLAUDE.md) | Concise project memory |
| [`backend/README.md`](backend/README.md) | API endpoints |
| [`user-frontend/AGENTS.md`](user-frontend/AGENTS.md) | User portal handover |
| [`admin-frontend/AGENTS.md`](admin-frontend/AGENTS.md) | Admin portal handover |

## Dev notes (Windows / OneDrive)

- Both frontends default to **webpack** for `npm run dev` (Turbopack via `dev:turbo` only if needed). See [`docs/DEV_PERFORMANCE.md`](docs/DEV_PERFORMANCE.md) for OneDrive / slow dev fixes.
- Exclude `node_modules` and `.next` from OneDrive sync, or move the repo outside a synced folder, for best performance.
- If admin shows `ENOENT` under `.next`, delete `admin-frontend/.next` and restart dev.

## Out of scope (MVP)

- httpOnly cookies / refresh tokens / company SSO (see [`docs/PRODUCTION_AUTH.md`](docs/PRODUCTION_AUTH.md))
- POST new request templates from admin UI
- Role CRUD in admin UI
- Real file upload storage (filename-only in forms)
