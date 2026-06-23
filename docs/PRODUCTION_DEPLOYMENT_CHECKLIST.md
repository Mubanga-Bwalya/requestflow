# Production deployment checklist

> **Last updated:** 2026-06-18  
> Use with [`DEPLOYMENT.md`](DEPLOYMENT.md), [`PROJECT_STATUS.md`](PROJECT_STATUS.md), [`LOCAL_SERVER_DEPLOYMENT.md`](LOCAL_SERVER_DEPLOYMENT.md), and [`BACKUP_AND_RECOVERY.md`](BACKUP_AND_RECOVERY.md).

---

## Pre-deploy

- [ ] No secrets in git (only `*.env.example` tracked)
- [ ] `JWT_SECRET` — 32+ random characters in secret store
- [ ] `ZAMTEL_AUTH_BASE_URL` set to the live staff-auth service and reachable from the API host
- [ ] `NODE_ENV=production` (hard-disables `POST /auth/dev-login`)
- [ ] `CORS_ORIGINS` — exact user + admin portal URLs (no `*`)
- [ ] `NEXT_PUBLIC_API_URL` set before **both** frontend production builds
- [ ] `NEXT_PUBLIC_SHOW_DEMO_HINTS` unset or `false` (build fails if `true`)
- [ ] `NEXT_PUBLIC_ENABLE_DEV_LOGIN` unset or `false` (Developer sign-in tab hidden)

---

## Database

- [ ] PostgreSQL 16+ provisioned
- [ ] **Backup taken** before migration — [`BACKUP_AND_RECOVERY.md`](BACKUP_AND_RECOVERY.md)
- [ ] `bash backend/database/apply-migrations.sh` (or `apply-migrations.ps1`) on empty DB
- [ ] **Migration tracking:** operator log lists each applied SQL file + date (001→016→002 order)
- [ ] Order includes `013`, `014`, `015`, `016` then `002` seed data
- [ ] **Do not** run `003`, `005`, `011`, or `database/deprecated/*`
- [ ] Production users: auto-provisioned on first Zamtel sign-in (default role **Employee**); promote admins manually
- [ ] Department managers set manually per department in admin UI

---

## Build & deploy

- [ ] `cd backend && npm ci && npm run prisma:generate && npm run build`
- [ ] `NODE_ENV=production` for API process
- [ ] `cd user-frontend && npm ci && npm run build && npm run start:prod` (port **3000**)
- [ ] `cd admin-frontend && npm ci && npm run build && npm run start:prod` (port **3001**)
- [ ] **Restart** user/admin processes after any frontend rebuild (PM2/systemd/NSSM)
- [ ] Redis optional: `REDIS_ENABLED=true` if using cache layer
- [ ] Email optional: `EMAIL_ENABLED=true`, `SMTP_HOST` set, `SMTP_USER`/`SMTP_PASS` from secret store

---

## Post-deploy smoke

- [ ] `GET /health` returns OK
- [ ] `npm run audit:deployment-smoke` passes (API + `start:prod` on :3000/:3001)
- [ ] Staff login (GN + AD password) succeeds via Zamtel; admin login (`adminOnly`) blocks non-admin users
- [ ] `POST /auth/dev-login` rejected in production (dev-login disabled)
- [ ] User login and dashboard load (no silent zero stats on API failure)
- [ ] Create request → manager inbox (appointed manager only) → assign → milestone progress
- [ ] 100% milestone progress does **not** auto-complete request
- [ ] Manager marks ready for review → requester approves
- [ ] Cross-user request ID returns 404 (not 403)
- [ ] Admin `/logs` — system events tab loads
- [ ] CORS works from both portal origins
- [ ] No demo hint text on login pages

---

## Security spot-check

- [ ] `POST /diagnostics/client-events` requires JWT or ingest secret when configured
- [ ] `POST /auth/login?adminOnly=true` rejects non-admin roles
- [ ] Upload limit in settings respects 1–500 MB (client + server)
- [ ] 5xx errors recorded in `system_events` (verify after intentional test error)

---

## Rollback notes

- API / frontends: redeploy previous artifact
- Database: forward-fix SQL only — restore from backup for major rollback

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Developer | | |
| IT / Ops | | |
| Business owner | | |
