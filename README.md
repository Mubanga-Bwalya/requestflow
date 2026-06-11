# RequestFlow

Internal request and progress-tracking system for Zamtel departments. Employees submit structured requests to other departments; managers review, assign work, and track milestones; requesters approve completed work.

**Documentation:** [`docs/`](docs/) — architecture, API, security, setup, deployment, testing, and workflows.

---

## Who uses RequestFlow

| Audience | Portal | Port |
|----------|--------|------|
| Employees, department managers, assignees | User portal (`user-frontend`) | 3000 |
| System administrators | Admin portal (`admin-frontend`) | 3001 |
| All clients | NestJS API (`backend`) | 4000 |

---

## Main features

- Structured request forms (templates + fields configured in admin)
- Department-targeted requests with manager inbox
- Missing-information workflow
- Team assignment with milestones and progress tracking
- Requester review and approval
- In-app notifications
- Admin: users, departments, templates, settings, reports, system logs (`/logs`)
- Role-based access enforced on the **backend** (not UI-only)

---

## Tech stack

| Layer | Technology |
|-------|------------|
| User & admin UI | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| API | NestJS 11, TypeScript |
| ORM / client | Prisma 5 (PostgreSQL) |
| Database | PostgreSQL 16 |
| Cache (optional) | Redis 7 via `ioredis` |
| Email (optional) | Resend |

---

## Repository layout

```txt
.
├── backend/              # NestJS API, Prisma schema, SQL migrations, tests
├── user-frontend/      # Employee & manager portal
├── admin-frontend/     # Configuration & reporting portal
├── docker/             # docker-compose.yml (Postgres + Redis)
├── docs/               # Enterprise documentation (start here)
├── package.json        # Workspace scripts (optional convenience)
└── README.md
```

---

## Prerequisites

- Node.js **20.11+** (see `.nvmrc`)
- npm 10+
- Docker Desktop (recommended for Postgres and Redis)

---

## Quick start

Full steps: **[`docs/SETUP.md`](docs/SETUP.md)**

```bash
npm install
npm run docker:up
cp backend/.env.example backend/.env
bash backend/database/apply-migrations.sh   # Windows: .\backend\database\apply-migrations.ps1
cd backend && npm run prisma:generate && npm run db:seed -- --reset-passwords
npm run build --workspace=backend

# Three terminals from repo root:
npm run dev:api
npm run dev:user     # http://localhost:3000
npm run dev:admin    # http://localhost:3001
```

Copy `user-frontend/.env.example` → `.env.local` and `admin-frontend/.env.example` → `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:4000`.

**Demo login (development only):** password `requestflow` — see [`docs/SETUP.md`](docs/SETUP.md#demo-accounts).

---

## Useful commands

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Start NestJS API (:4000) |
| `npm run dev:user` | Start user portal (:3000) |
| `npm run dev:admin` | Start admin portal (:3001) |
| `npm run docker:up` | Start Postgres + Redis |
| `npm run docker:down` | Stop containers |
| `npm run build` | Build all workspaces |
| `npm run test` | Backend unit tests |
| `npm run test:e2e` | Backend e2e tests |
| `npm run lint` | Lint all workspaces |
| `npm run typecheck` | Typecheck all workspaces |

Backend-only: `npm run db:seed`, `npm run hash-passwords` — see [`docs/DATABASE.md`](docs/DATABASE.md).

---

## Documentation index

| Document | Purpose |
|----------|---------|
| [`docs/SETUP.md`](docs/SETUP.md) | Local development setup and troubleshooting |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design and code map |
| [`docs/API.md`](docs/API.md) | REST API reference |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Schema, SQL files, seeds, migrations |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Auth, authorization, known gaps |
| [`docs/USER_ROLES_AND_PERMISSIONS.md`](docs/USER_ROLES_AND_PERMISSIONS.md) | Who can do what |
| [`docs/REQUEST_WORKFLOW.md`](docs/REQUEST_WORKFLOW.md) | Request and assignment lifecycle |
| [`docs/TESTING.md`](docs/TESTING.md) | Automated and manual tests |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Production deployment plan |
| [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md) | Demo vs pilot readiness scores and limitations |
| [`docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md`](docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md) | Pre/post deploy checklist |
| [`docs/CODE_ORGANIZATION.md`](docs/CODE_ORGANIZATION.md) | Where rules live; module layout |
| [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md) | Code quality rules |
| [`docs/adr/`](docs/adr/) | Architecture decision records |

---

## Developer notes

- **Authorization is server-side.** UI gates are convenience only; never rely on hidden buttons for security. See [`docs/SECURITY.md`](docs/SECURITY.md).
- **Progress at 100% does not auto-complete a request.** Manager marks ready for review; requester approves. See [`docs/REQUEST_WORKFLOW.md`](docs/REQUEST_WORKFLOW.md).
- **Department-manager authority** is set manually per department (`manager_user_id`); manager **role name alone** does not grant inbox access. One user may manage multiple departments.
- **Secrets** belong in env/secret store only — never commit `.env` or API keys. **Demo hints** (`NEXT_PUBLIC_SHOW_DEMO_HINTS`) are development-only.
- **File length target:** ≤ 250 lines per application source file — [`docs/CODING_STANDARDS.md`](docs/CODING_STANDARDS.md).
- **Windows / OneDrive:** exclude `.next` and `node_modules` from sync; use `npm run dev` (webpack), not turbo, on synced paths.
- **Documentation upkeep:** any change to API, schema, env vars, permissions, or deployment must update the relevant `docs/` file in the same change.

---

## Brand palette

| Token | Hex |
|-------|-----|
| Primary Green | `#008542` |
| Dark Green | `#015217` |
| Lime Green | `#A9DD00` |
| White | `#FFFFFF` |

Assets: `user-frontend/public/brand/`, `admin-frontend/public/brand/`.
