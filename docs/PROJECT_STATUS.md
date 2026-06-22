# Project status and readiness

> **Last updated:** 2026-06-18  
> **Audience:** Supervisors, internal IT, project owners, and developers

Related: [`SUPERVISOR_README.md`](SUPERVISOR_README.md) · [`DEPLOYMENT.md`](DEPLOYMENT.md) · [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md) · [`TESTING.md`](TESTING.md)

---

## Summary

RequestFlow is **ready for internal demonstration** and **suitable for a controlled pilot** on Zamtel’s internal network. It is not yet a fully turnkey enterprise rollout without IT configuration, secret rotation, and manual quality assurance.

---

## Readiness scores

| Audience | Score | Meaning |
|----------|-------|---------|
| **Supervisor / internal demo** | **8.5 / 10** | End-to-end workflow works locally; admin logs, error handling, and security controls in place. |
| **Controlled internal pilot** | **7.5 / 10** | Deployable on internal infrastructure with rotated secrets, applied migrations, and manual QA. Not turnkey production (no app Dockerfiles, SSO, or HRIS sync). |

Scores assume: SQL migrations applied via `apply-migrations.sh`, `ZAMTEL_AUTH_BASE_URL` configured for staff sign-in, `NODE_ENV=production` (dev-login disabled), `NEXT_PUBLIC_SHOW_DEMO_HINTS` unset in production builds.

---

## Core features — built and verified

| Feature | Status |
|---------|--------|
| Authentication (Zamtel central staff auth — GN + AD) and role-based access | Built — server-enforced |
| Employee request creation (templates) | Built |
| Department manager inbox | Built |
| Approve, reject, missing-information flows | Built |
| Team assignment and milestones | Built |
| Requester review and approval | Built |
| Admin dashboard, users, departments | Built |
| Request templates and system settings | Built |
| Reports and system logs (`/logs`) | Built |
| In-app notifications | Built |
| Health check (`GET /health`) | Built |
| Optional Redis cache (fail-open) | Built |
| Backend unit and e2e tests | Built |
| Playwright deployment smoke audit | Built |
| Local server deployment documentation | Built |

---

## Behaviour that must be understood

| Topic | Correct behaviour |
|-------|-------------------|
| **100% progress** | Does **not** auto-complete the request. Manager marks assignment ready for review; requester approves. |
| **Department manager** | Authority comes from **manual** appointment per department (`manager_user_id`). |
| **Manager role name** | Does **not** alone grant inbox or assignment powers. |
| **Multiple departments** | One user **can** manage several departments. |
| **Admins** | `Admin` / `System Admin` have global access (backend-enforced). |
| **Secrets** | Never commit `.env`, API keys, or `JWT_SECRET`. |
| **Authentication** | Staff sign in with GN + AD password via Zamtel; users auto-provisioned as `Employee`; admin promotion is manual. |
| **Demo hints / dev-login** | Email-only dev-login and login prefill require `NEXT_PUBLIC_ENABLE_DEV_LOGIN`/`NEXT_PUBLIC_SHOW_DEMO_HINTS` and are disabled in production. |

---

## Known limitations

| Item | Risk if ignored |
|------|-----------------|
| No full OIDC/SAML SSO | Central staff auth (Zamtel GN + AD) is integrated; full SSO still planned |
| JWT in `localStorage` | XSS could steal session — mitigate with CSP and internal network |
| No frontend automated unit tests | UI regressions need manual or Playwright smoke |
| No migration version table | Operators must apply SQL files in order and log what was applied |
| No production Dockerfiles for apps | Manual Node.js deploy — see [`LOCAL_SERVER_DEPLOYMENT.md`](LOCAL_SERVER_DEPLOYMENT.md) |
| Partial e2e coverage | Some workflow paths lack automated e2e tests |
| No HRIS sync | Manual user provisioning — see [`INTEGRATION_READINESS.md`](INTEGRATION_READINESS.md) |

---

## Risks before wider rollout

**Must fix or verify:**

1. `ZAMTEL_AUTH_BASE_URL` configured and reachable; `NODE_ENV=production` so dev-login is disabled
2. Strong `JWT_SECRET` (32+ characters) in secret store
3. `CORS_ORIGINS` set to real portal URLs only
4. `NEXT_PUBLIC_API_URL` set at frontend build time
5. Run full manual checklist — [`TESTING.md`](TESTING.md) and [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md)

**Should plan:**

- SSO and httpOnly cookies — [`SECURITY.md`](SECURITY.md)
- HRIS user provisioning — [`INTEGRATION_READINESS.md`](INTEGRATION_READINESS.md)
- Monitoring on `GET /health` and admin system events

---

## Quick verification before a demo

```bash
npm install
npm run docker:up
bash backend/database/apply-migrations.sh
cd backend && npm run prisma:generate && npm run db:seed
npm run build --workspace=backend
npm run test
npm run dev:api    # terminal 1
npm run dev:user   # terminal 2
npm run dev:admin  # terminal 3
```

**Smoke path:** Admin dashboard → user creates request → manager inbox → assign → milestones → ready for review → requester approves. Check admin **System Logs** at `/logs`.

**Automated smoke (production mode):** `npm run audit:deployment-smoke` — see [`TESTING.md`](TESTING.md).

---

## Recommended next steps

| Step | Action | Owner |
|------|--------|-------|
| 1 | Supervisor review using [`SUPERVISOR_README.md`](SUPERVISOR_README.md) | Management |
| 2 | IT provisions server per [`LOCAL_SERVER_DEPLOYMENT.md`](LOCAL_SERVER_DEPLOYMENT.md) | IT |
| 3 | Complete [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md) | IT + project owner |
| 4 | Pilot with one department | Business + IT |
| 5 | Plan SSO and HR integration per [`INTEGRATION_READINESS.md`](INTEGRATION_READINESS.md) | IT |
