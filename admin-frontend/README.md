# RequestFlow — Admin portal

Configuration UI for RequestFlow (users, departments, templates, system settings, reports).

## Quick start

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open **http://localhost:3001**. Backend must run on **http://localhost:4000**.

Login: `admin@requestflow.local` / password `requestflow`. Requires DB role **`Admin`** — see [`docs/LOCAL_RUN.md`](../docs/LOCAL_RUN.md).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server on port 3001 (webpack) |
| `npm run dev:turbo` | Turbopack (faster; may fail under OneDrive) |
| `npm run build` | Production build |
| `npm run start` | Production server |

## Agent handover

[`AGENTS.md`](AGENTS.md) — file map, known fixes, scope.
