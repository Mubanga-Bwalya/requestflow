# Production readiness summary

> **Last updated:** 2026-06-04 — After Phases 1–5 (security, tests, maintainability, deployment gate).

## Score

| Audience | Before (audit) | After Phases 1–5 | Notes |
|----------|----------------|------------------|-------|
| Public internet / multi-tenant | 4/10 | **Not supported** | No RLS, JWT in localStorage |
| **Internal company MVP** (trusted users, VPN/private network) | 4/10 | **8/10** | AuthZ, tests, CI, deployment checklist |

**8/10** means deployable for a controlled pilot with documented compensating controls. **10/10** requires httpOnly/SSO, token revocation, monitoring, and real file storage.

---

## P0 / P1 closure

| ID | Issue | Status | Compensating control |
|----|-------|--------|----------------------|
| P0-1 | IDOR on request/assignment detail | **Closed** | `AccessPolicyService` + e2e tests |
| P0-2 | Unauthorized status / milestone / missing-info | **Closed** | Policy matrix + e2e tests |
| P0-3 | Weak / plain-text passwords in prod | **Closed** | Bcrypt + production env flags |
| P0-4 | JWT role spoofing from payload | **Closed** | DB reload in `JwtStrategy` |
| P0-5 | No rate limiting on login | **Closed** | 5/min throttle + e2e |
| P1-1 | Missing DTO validation | **Closed** | class-validator on sensitive DTOs |
| P1-2 | Request number races | **Closed** | `007` sequences + P2002 retry |
| P1-3 | Stale mock/local-only docs | **Closed** | README, AGENTS, COMPANY_INTEGRATION |
| P1-4 | JWT in localStorage (XSS theft) | **Deferred** | Short TTL; CSP headers; private network pilot — see `PRODUCTION_AUTH.md` |
| P1-5 | No immediate token revoke on role change | **Partial** | DB role on each request; demoted admin blocked — token version post-MVP |
| P1-6 | CSP `connect-src` localhost only | **Documented** | Must edit `next.config.mjs` before prod URL — checklist §2.4 |
| P1-7 | PostgreSQL RLS | **Deferred** | App-layer authorization only |
| P1-8 | File upload pipeline | **Deferred** | Filename only; no AV/storage |

---

## Verification matrix (Phase 5)

Automated script (repo root):

```powershell
powershell -File scripts/verify-production-readiness.ps1
```

Run before sign-off (see [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md)):

| Check | Command |
|-------|---------|
| Backend unit tests | `cd backend && npm run test` |
| Backend e2e | `cd backend && npm run test:e2e` |
| Backend build | `cd backend && npm run build` |
| User build | `cd user-frontend && npm run build` |
| Admin build | `cd admin-frontend && npm run build` |
| Lint / typecheck | `npm run lint` + `npm run typecheck` per app |
| Audit | `npm audit --audit-level=high` per app |
| Health | `GET /health` — no secrets |
| Secrets in git | Only `*.env.example` tracked |

---

## Post-MVP (explicitly not hidden)

| Item | Priority | Doc |
|------|----------|-----|
| httpOnly cookies / refresh tokens | High | `PRODUCTION_AUTH.md` |
| Company SSO (OIDC/SAML) | High | `COMPANY_INTEGRATION.md` |
| `tokenVersion` on users | Medium | `PRODUCTION_AUTH.md` |
| PostgreSQL RLS | Medium | — |
| Real file upload (S3/blob + AV scan) | Medium | — |
| Centralized logging / APM / alerts | Medium | — |
| Role CRUD in admin UI | Low | `AGENTS.md` |
| POST new templates from admin UI | Low | MVP scope |
| Native mobile / email notifications | Low | — |

---

## Security headers responsibility

| Layer | Owner |
|-------|--------|
| API | `helmet()` in `backend/src/main.ts` |
| Next.js portals | `next.config.mjs` security headers |
| Production TLS / HSTS | **Reverse proxy** (nginx, ALB, Cloudflare, etc.) — required for real HTTPS |

---

## Health endpoint contract

`GET /health` (public, not throttled):

```json
{ "status": "ok", "service": "RequestFlow API" }
```

No database connectivity, version, or user data exposed (by design for load balancers).
