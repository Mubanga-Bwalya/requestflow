# Production deployment checklist

> **Last updated:** 2026-06-11  
> Use with [`DEPLOYMENT.md`](DEPLOYMENT.md) and [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md).

---

## Pre-deploy

- [ ] No secrets in git (only `*.env.example` tracked)
- [ ] `JWT_SECRET` — 32+ random characters in secret store
- [ ] `ALLOW_DEMO_DEFAULT_PASSWORD` unset or `false`
- [ ] `ALLOW_LEGACY_PLAINTEXT_PASSWORDS` unset or `false`
- [ ] `CORS_ORIGINS` — exact user + admin portal URLs (no `*`)
- [ ] `NEXT_PUBLIC_API_URL` set before **both** frontend production builds
- [ ] `NEXT_PUBLIC_SHOW_DEMO_HINTS` unset or `false` (build fails if `true`)
- [ ] Demo accounts deactivated or passwords rotated (no `requestflow` in prod)

---

## Database

- [ ] PostgreSQL 16+ provisioned
- [ ] `bash backend/database/apply-migrations.sh` (or `apply-migrations.ps1`) on empty DB
- [ ] Order includes `013`, `014`, `015` then `002` seed data
- [ ] **Do not** run `003`, `005`, `011`, or `database/deprecated/*`
- [ ] Production users: admin-created via portal **or** one-time `db:seed` + immediate password rotation
- [ ] Department managers set manually per department in admin UI

---

## Build & deploy

- [ ] `cd backend && npm ci && npm run prisma:generate && npm run build`
- [ ] `NODE_ENV=production` for API process
- [ ] `cd user-frontend && npm ci && npm run build && npm run start`
- [ ] `cd admin-frontend && npm ci && npm run build && npm run start`
- [ ] Redis optional: `REDIS_ENABLED=true` if using cache layer
- [ ] Email optional: `EMAIL_ENABLED=true`, `RESEND_API_KEY` from secret store

---

## Post-deploy smoke

- [ ] `GET /health` returns OK
- [ ] Admin login (`adminOnly`) — non-admin users blocked on admin portal
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
