# Production readiness summary

> **Last updated:** 2026-06-11  
> **Audience:** Supervisors, internal IT, and developers preparing a demo or pilot.

Related: [`DEPLOYMENT.md`](DEPLOYMENT.md) · [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md) · [`SECURITY.md`](SECURITY.md)

---

## What RequestFlow is

**RequestFlow** is an **internal company request and task management system**. Employees submit structured requests to other departments; appointed department managers review incoming work, assign team members, and track milestones; requesters approve completed work. Admins configure users, departments, templates, and system settings.

It is **not** a public multi-tenant SaaS product.

---

## Readiness scores (2026-06-11)

| Audience | Score | Meaning |
|----------|-------|---------|
| **Supervisor / internal demo** | **8.5 / 10** | End-to-end workflow works locally; admin logs, error UX, and security fixes in place; manual smoke path documented. |
| **Real internal company deployment** | **7.5 / 10** | Suitable for a **controlled pilot** on internal network with rotated secrets, applied migrations, and manual QA. Not turnkey production (no app Dockerfiles, SSO, or HRIS sync). |

Scores assume: migrations applied via `apply-migrations.sh`, demo passwords rotated or accounts admin-created, `NEXT_PUBLIC_SHOW_DEMO_HINTS` unset in production builds.

---

## Behaviour supervisors should know

| Topic | Correct behaviour |
|-------|-------------------|
| **100% progress** | Does **not** auto-complete the request. Manager marks assignment ready for review; requester approves. |
| **Department manager** | Authority comes from **manual** `manager_user_id` on each department (admin UI). |
| **Manager role name** | Does **not** alone grant inbox or assignment powers. |
| **Multiple departments** | One user **can** manage several departments. |
| **Admins** | `Admin` / `System Admin` have global access (backend-enforced). |
| **Secrets** | Never commit `.env`, API keys, or `JWT_SECRET` — examples only in `*.env.example`. |
| **Demo hints** | Login prefill/hints require `NEXT_PUBLIC_SHOW_DEMO_HINTS=true` (dev only; production build fails if true). |

---

## What is fixed (phases 1–7)

- Server-side authorization for workflow, milestones, cross-dept assignment, diagnostics ingest
- Department manager from `departments.manager_user_id` only (not role name)
- Migration order unified; seeds preserve passwords on re-run; integrity constraints (`015`)
- Demo hints and API URL production guards on frontends
- Admin `/logs` page (system events + activity audit)
- API error banners (no fake-empty data on failure)
- Admin role gate UX for non-admin sessions
- Service splits and documentation (`CODE_ORGANIZATION.md`)

---

## What remains (safe to mention as limitations)

| Item | Risk if ignored |
|------|-----------------|
| No SSO / corporate IdP | Users manage passwords in-app |
| JWT in `localStorage` | XSS could steal session — CSP + internal network mitigate |
| No frontend automated tests | Regressions need manual smoke tests |
| No migration version table | Operators must use `apply-migrations.sh` in order |
| No production Dockerfiles for apps | Manual Node deploy or custom packaging |
| Partial e2e coverage | Some paths (full happy path, throttle) lack e2e |
| Backend lint (6 ESLint errors) | `cache.service.ts`, throttler guard, `admin.service.ts`, `template-fields.service.ts` — unused vars; non-blocking for runtime |

---

## Risks before full company rollout

**Must fix / verify:**

1. Rotate all demo passwords; set `ALLOW_DEMO_DEFAULT_PASSWORD=false`
2. Strong `JWT_SECRET` (32+ chars) in secret store
3. `CORS_ORIGINS` set to real portal URLs only
4. `NEXT_PUBLIC_API_URL` set at frontend build time
5. Run full manual checklist — [`TESTING.md`](TESTING.md) and [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md)

**Should plan:**

- SSO and httpOnly cookies ([`SECURITY.md`](SECURITY.md))
- HRIS user provisioning ([`COMPANY_INTEGRATION.md`](COMPANY_INTEGRATION.md))
- Monitoring on `GET /health` and admin system events

---

## Quick verification before a demo

```bash
npm run docker:up
bash backend/database/apply-migrations.sh
cd backend && npm run prisma:generate && npm run db:seed -- --reset-passwords
npm run build --workspace=backend
npm run test
npm run dev:api    # terminal 1
npm run dev:user   # terminal 2
npm run dev:admin  # terminal 3
```

Smoke: admin dashboard → user creates request → manager inbox → assign → milestones → ready for review → requester approves. Admin **System Logs** at `/logs`.
