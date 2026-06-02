# RequestFlow

RequestFlow is an internal request and progress tracking system for HR and Marketing departments. Employees submit structured requests, department managers review and assign work, assigned members break work into milestones, and overall progress is shown to the requester.

## MVP Scope
- HR and Marketing only
- Structured request forms
- Manager review
- Missing information workflow
- Assignment to one or many people
- Manager can assign themselves
- Milestone-based progress tracking
- Requester progress view
- Admin configuration area
- No chat/comments in MVP

## Tech Stack
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- NestJS
- Prisma
- PostgreSQL

## Official Brand Palette
- Primary Green: `#008542`
- Dark Green: `#015217`
- Lime Green: `#A9DD00`
- White: `#FFFFFF`

Reusable design tokens:
- `--color-primary-green`
- `--color-dark-green`
- `--color-lime-green`
- `--color-white`

Brand implementation notes:
- Both frontends use a dark-green sidebar shell and a shared `BrandLogo` placeholder component to reserve space for the official Zamtel logo (no external logo URLs used).

Frontend prototype notes:
- Both frontends currently run as **local-state clickable prototypes** (mock data + in-memory store). Behaviour resets on page refresh until backend APIs are connected.

Dev performance (Windows / OneDrive):
- `npm run dev` uses **Turbopack** (`next dev --turbo`) for faster compiles. Use `npm run dev:webpack` if Turbopack causes issues.
- Projects under **OneDrive** (`Desktop\RequestFlow`) are often slow because OneDrive syncs `node_modules` and `.next`. For best speed: exclude those folders from OneDrive sync, or move the repo to a non-synced path (e.g. `C:\dev\RequestFlow`).
- First visit to a route may still show `Compiling /...` in the terminal — that is normal; later navigations are faster.

## Folder Structure
```txt
requestflow/
  user-frontend/
  admin-frontend/
  backend/
  README.md
  .gitignore
  docker-compose.yml
  .env.example
```

## Development Setup
Install dependencies:

```bash
cd user-frontend && npm install
cd ../admin-frontend && npm install
cd ../backend && npm install
```

Start PostgreSQL:

```bash
docker compose up -d
```

Run backend (port 4000):

```bash
cd backend
npm run start:dev
```

Run user frontend (port 3000):

```bash
cd user-frontend
npm run dev
```

Run admin frontend (port 3001):

```bash
cd admin-frontend
npm run dev
```

## Database
PostgreSQL is used for MVP development. The architecture is designed to stay adaptable to enterprise databases such as Microsoft SQL Server.

