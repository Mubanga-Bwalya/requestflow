# Local server deployment guide

> **Last updated:** 2026-06-18  
> **Audience:** IT operators deploying RequestFlow on an internal Linux or Windows Server.

Related: [`DEPLOYMENT.md`](DEPLOYMENT.md) · [`BACKUP_AND_RECOVERY.md`](BACKUP_AND_RECOVERY.md) · [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md) · [`SECURITY.md`](SECURITY.md)

---

## Overview

This guide covers deploying RequestFlow on a **single internal server** (or small VM) without Kubernetes. **Linux is preferred** for production-like operation (systemd, Nginx, PM2). Windows Server is supported with NSSM or PM2 notes below.

| Service | Port | Start command |
|---------|------|---------------|
| User portal | 3000 | `npm run start:prod` in `user-frontend` |
| Admin portal | 3001 | `npm run start:prod` in `admin-frontend` |
| API | 4000 | `node dist/main` in `backend` (`npm run start:prod`) |
| PostgreSQL | 5432 | OS service or Docker (dev reference only) |
| Redis (optional) | 6379 | OS service or Docker |

---

## Prerequisites

| Software | Version |
|----------|---------|
| Node.js | 20.11+ (see `.nvmrc`) |
| npm | 10+ |
| PostgreSQL | 16+ |
| Redis | 7 (optional) |
| Nginx | Current stable (reverse proxy + TLS) |
| PM2 | Global install recommended (`npm i -g pm2`) |

---

## Server folder layout

```txt
/opt/requestflow/                 # or C:\RequestFlow
├── backend/
│   ├── dist/                     # compiled API
│   ├── .env                      # production secrets (not in git)
│   └── database/
├── user-frontend/
│   ├── .next/                    # production build output
│   └── .env.local                # build-time vars (keep for reference)
├── admin-frontend/
│   ├── .next/
│   └── .env.local
├── docs/
├── package.json
└── ecosystem.config.cjs          # copy from docs/ecosystem.config.cjs.example
```

Deploy by cloning or copying the release artifact to the server. Run `npm ci` at repo root (installs all workspaces).

---

## Environment files

### Backend (`backend/.env`)

Copy from `backend/.env.example`. Minimum for production:

```env
NODE_ENV=production
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/requestflow
JWT_SECRET=<32+ random characters>
JWT_EXPIRES_IN=28800
PORT=4000
CORS_ORIGINS=https://requests.company.local,https://admin-requests.company.local
REDIS_ENABLED=true
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
ALLOW_DEMO_DEFAULT_PASSWORD=false
```

### Frontends (before build)

Create `user-frontend/.env.local` and `admin-frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api-requests.company.local
# Or internal: http://SERVER_IP:4000 for LAN pilot without TLS on API
NEXT_PUBLIC_SHOW_DEMO_HINTS=false
```

**Build-time binding:** `NEXT_PUBLIC_API_URL` is embedded at `npm run build`. Changing the API URL requires **rebuild both frontends**.

---

## Database setup

1. Provision PostgreSQL 16 database `requestflow` and application user with DDL/DML rights.
2. **Backup empty DB** (optional baseline) — see [`BACKUP_AND_RECOVERY.md`](BACKUP_AND_RECOVERY.md).
3. Apply migrations:

```bash
cd /opt/requestflow
PGHOST=localhost PGUSER=requestflow PGPASSWORD=*** PGDATABASE=requestflow \
  bash backend/database/apply-migrations.sh
```

Windows: `.\backend\database\apply-migrations.ps1`

4. Generate Prisma client and seed policy:
   - **Preferred:** empty workflow + admin-created users via portal
   - **Pilot:** `cd backend && npm run db:seed -- --reset-passwords` once, then rotate all passwords

5. **Record applied SQL files** in an operator log (no version table in app).

---

## Build

From repo root:

```bash
npm ci
cd backend && npm run prisma:generate && npm run build && cd ..
cd user-frontend && npm run build && cd ..
cd admin-frontend && npm run build && cd ..
```

Or: `npm run build` at root (all workspaces).

---

## Start / restart

### Manual (verification)

```bash
# Terminal 1 — API
cd backend && NODE_ENV=production npm run start:prod

# Terminal 2 — User portal (:3000)
cd user-frontend && npm run start:prod

# Terminal 3 — Admin portal (:3001)
cd admin-frontend && npm run start:prod
```

### PM2 (recommended)

Copy `docs/ecosystem.config.cjs.example` to repo root as `ecosystem.config.cjs`, adjust `cwd` paths, then:

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # Linux — follow printed command for boot persistence
```

### systemd (Linux alternative)

Create three unit files pointing to the same commands as PM2, or wrap PM2 with `pm2 startup systemd`.

### Restart after frontend rebuild

**Critical:** After any `npm run build` on `user-frontend` or `admin-frontend`, restart those Node processes. Stale `next start` causes chunk 400 errors and blank pages.

```bash
pm2 restart user-frontend admin-frontend
# or restart individual systemd units
```

---

## PM2 ecosystem example (inline)

Save as `ecosystem.config.cjs` at repo root (also available at [`ecosystem.config.cjs.example`](ecosystem.config.cjs.example)):

```javascript
module.exports = {
  apps: [
    {
      name: "requestflow-api",
      cwd: "./backend",
      script: "dist/main.js",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production" },
      max_memory_restart: "512M",
    },
    {
      name: "requestflow-user",
      cwd: "./user-frontend",
      script: "npm",
      args: "run start:prod",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production", PORT: "3000" },
    },
    {
      name: "requestflow-admin",
      cwd: "./admin-frontend",
      script: "npm",
      args: "run start:prod",
      instances: 1,
      exec_mode: "fork",
      env: { NODE_ENV: "production", PORT: "3001" },
    },
  ],
};
```

---

## Nginx reverse proxy

Example server blocks (adjust hostnames and TLS certificates):

```nginx
# User portal
server {
    listen 443 ssl;
    server_name requests.company.local;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin portal
server {
    listen 443 ssl;
    server_name admin-requests.company.local;
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API
server {
    listen 443 ssl;
    server_name api-requests.company.local;
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Reload: `sudo nginx -t && sudo systemctl reload nginx`

---

## CORS and LAN access

1. Set `CORS_ORIGINS` in `backend/.env` to **exact** browser origins (scheme + host + port), comma-separated:
   - Production HTTPS portal URLs
   - For LAN pilot: `http://192.168.1.50:3000,http://192.168.1.50:3001`
2. Set `NEXT_PUBLIC_API_URL` to the URL **browsers** use to reach the API (not `127.0.0.1` on client devices).
3. Rebuild frontends after changing `NEXT_PUBLIC_API_URL`.
4. Wildcard `*` is **rejected** in production when credentials are enabled.

---

## Health checks

| Check | Command / URL | Expected |
|-------|---------------|----------|
| API liveness | `curl -s http://127.0.0.1:4000/health` | 200 OK |
| User portal | `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/login` | 200 |
| Admin portal | `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001/login` | 200 |
| PM2 status | `pm2 status` | All apps `online` |

Configure uptime monitor on `/health` and optionally portal login pages via Nginx.

---

## Smoke test (Playwright)

With all services running in **production mode** (`start:prod`):

```bash
npm run audit:deployment-smoke
```

Output: `scripts/deployment-smoke-output/`

Requires Playwright browsers: `npx playwright install chromium` (from repo root).

Full regression: `npm run audit:regression` — see [`TESTING.md`](TESTING.md).

---

## Rollback

| Layer | Procedure |
|-------|-----------|
| API | `pm2 stop requestflow-api`; redeploy previous `backend/dist`; `pm2 start requestflow-api` |
| Frontends | Redeploy previous `.next` build artifacts or previous git tag; **restart** processes |
| Database | **No down migrations** — forward-fix SQL or restore from backup |

See [`BACKUP_AND_RECOVERY.md`](BACKUP_AND_RECOVERY.md) before any schema change.

---

## Redis failure procedure

1. API continues operating (fail-open to PostgreSQL).
2. Dashboard may be slower; JWT user cache may be stale up to ~45s when Redis was previously enabled.
3. Alert ops; restore Redis service.
4. **Restart API** after Redis is healthy to re-establish cache client.
5. Verify `/health` and smoke test.

---

## Database unavailable procedure

1. API returns 5xx on data routes; `/health` may still respond depending on implementation.
2. Check PostgreSQL service: `pg_isready -h localhost -U requestflow -d requestflow`
3. Review disk space, connection limits, `DATABASE_URL` credentials.
4. If data corruption suspected, **stop API**, restore from latest `pg_dump` per [`BACKUP_AND_RECOVERY.md`](BACKUP_AND_RECOVERY.md), then restart.
5. Do **not** run `prisma migrate reset` on production.

---

## Windows Server notes

| Topic | Guidance |
|-------|----------|
| **PM2** | Works on Windows; use `pm2-startup install` for boot persistence |
| **NSSM** | Alternative — wrap `node dist/main.js` and `npm run start:prod` as Windows services |
| **Migrations** | Use `.\backend\database\apply-migrations.ps1` |
| **Nginx** | Nginx for Windows or IIS ARR as reverse proxy |
| **Paths** | Use `C:\RequestFlow` layout; avoid OneDrive-synced folders for `.next` and `node_modules` |
| **Firewall** | Open 443 (Nginx) externally; bind Node to `0.0.0.0` via `start:prod` scripts |

---

## Post-deploy checklist

- [ ] `GET /health` OK
- [ ] User and admin login (admin `adminOnly` gate)
- [ ] Admin `/logs` loads
- [ ] `npm run audit:deployment-smoke` PASS
- [ ] CORS from both portal URLs
- [ ] Demo passwords rotated
- [ ] Backup taken and migration log updated

See [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md).
