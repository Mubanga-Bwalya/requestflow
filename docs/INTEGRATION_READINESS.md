# Integration readiness

> **Last updated:** 2026-06-18  
> **Audience:** Supervisors, internal IT, and integration teams

Related: [`SUPERVISOR_README.md`](SUPERVISOR_README.md) · [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`API.md`](API.md) · [`SECURITY.md`](SECURITY.md)

---

## Purpose

This document explains how RequestFlow can connect to Zamtel’s existing internal systems. It separates what is **already built** from what would need to be **connected during integration**.

RequestFlow is designed as a standalone internal application first, with clear integration points for later phases.

---

## Integration overview

```txt
┌─────────────────────────────────────────────────────────┐
│                    Zamtel internal systems               │
│  HR / staff directory · SSO · Email · Reporting · DMS   │
└────────────┬────────────────────────────────────────────┘
             │  Future connectors (not all built yet)
             ▼
┌─────────────────────────────────────────────────────────┐
│              RequestFlow API (NestJS :4000)              │
│   Auth · Users · Departments · Requests · Assignments    │
└────────────┬────────────────────────────────────────────┘
             │
     ┌───────┴───────┐
     ▼               ▼
 User portal     Admin portal
   :3000            :3001
```

---

## Integration points

### 1. Staff directory or HR system

| Aspect | Today | Integration path |
|--------|-------|------------------|
| User records | Auto-provisioned on first Zamtel sign-in, or created in admin portal | Sync from HR via scheduled job or API webhook |
| Departments | Managed in admin portal | Import org structure from HR master data |
| Manager appointment | Manual `manager_user_id` per department | Map from HR “reports to” or role data |
| Deactivation | Admin sets `isActive=false` | HR offboarding job deactivates accounts |

**Built APIs:** `POST /users`, `PATCH /users/:id`, `GET /users/by-email/:email`, `POST /departments`, `PATCH /departments/:id` (admin only).

---

### 2. Central staff authentication / SSO

| Aspect | Today | Integration path |
|--------|-------|------------------|
| Authentication | **Integrated** — staff sign in with GN (staff number) + AD password via Zamtel central staff auth (`ZAMTEL_AUTH_BASE_URL`); RequestFlow mints its own JWT | Extend to full OIDC/SAML bridge if required |
| User provisioning | **Automatic** — users created on first Zamtel sign-in (default role `Employee`), matched by `gn` → `email` | Map richer profile/department data from the directory |
| Admin login | Same flow with `adminOnly=true` gate; admin promotion is manual | Same IdP with role claims |
| Session storage | JWT in browser `localStorage` | Migrate to httpOnly cookies with CSRF |

**Integrated today:** `POST /auth/login` (GN + AD password → Zamtel), `GET /auth/me`, auto-provisioning, server-side role reload on every request. An email-only `POST /auth/dev-login` exists for offline/demo use and is hard-disabled when `NODE_ENV=production`.

**Not built:** Full OIDC/SAML SSO, token exchange, or HRIS-driven profile sync beyond first-sign-in provisioning.

---

### 3. Department structure from internal systems

| Aspect | Today | Integration path |
|--------|-------|------------------|
| Source of truth | RequestFlow `departments` table | Import/sync from HR or Active Directory OU structure |
| Manager assignment | Admin UI per department | Automated from HR hierarchy |

**Built today:** Full department CRUD via admin API and portal.

---

### 4. Email or SMS notifications

| Aspect | Today | Integration path |
|--------|-------|------------------|
| Email | Zamtel internal SMTP via nodemailer (`EMAIL_ENABLED=true`, `SMTP_HOST` set) | Point `SMTP_HOST` at the corporate relay or internal notification gateway |
| SMS | Not implemented | External SMS provider or internal messaging API |
| In-app | Built (`notifications` table) | No change required |

**Built today:** Email service with templates for key workflow events, delivered through Zamtel's internal SMTP relay (nodemailer) when configured. In-app notifications always work.

---

### 5. Internal reporting dashboards

| Aspect | Today | Integration path |
|--------|-------|------------------|
| Admin reports | Built in admin portal (`GET /admin/reports`) | Export to BI tool via API or database read replica |
| Activity audit | `activity_logs` table + admin UI | Forward to SIEM or log platform |
| System errors | `system_events` table + admin UI | Alerting integration |

**Built today:** JSON report API and admin dashboards. No pre-built Power BI or Grafana connectors.

---

### 6. Document management systems

| Aspect | Today | Integration path |
|--------|-------|------------------|
| Attachments | Filename metadata on requests/milestones (MVP) | Store files in corporate DMS; link by reference ID |
| Template fields | Text, select, date, etc. | File upload field type with DMS backend |

**Not built:** Binary file upload pipeline or DMS connector.

---

### 7. Internal audit or logging platforms

| Aspect | Today | Integration path |
|--------|-------|------------------|
| Business audit | `activity_logs` (non-blocking writes) | Ship to central log store |
| Operational errors | `system_events` (5xx, login failures) | SIEM alert rules |
| Request correlation | `X-Request-Id` on all API responses | Map to distributed tracing |

**Built today:** Database tables and admin **System Logs** page at `/logs`.

---

## What is ready for integration now

| Capability | Ready? | Notes |
|------------|--------|-------|
| REST API for users and departments | Yes | Admin-authenticated CRUD |
| REST API for requests and assignments | Yes | Workflow enforced server-side |
| Central staff authentication | Yes | Zamtel GN + AD password via `ZAMTEL_AUTH_BASE_URL`; RequestFlow-issued JWT |
| Role-based access control | Yes | Roles stored in database |
| Audit tables | Yes | `activity_logs`, `system_events` |
| Health check | Yes | `GET /health` |
| Environment-based configuration | Yes | See [`DEPLOYMENT.md`](DEPLOYMENT.md) |
| Internal network deployment | Yes | See [`LOCAL_SERVER_DEPLOYMENT.md`](LOCAL_SERVER_DEPLOYMENT.md) |

---

## What requires integration work

| Item | Effort | Owner |
|------|--------|-------|
| Full OIDC/SAML SSO (central staff auth already integrated) | Medium–high | IT security + dev |
| HR user provisioning sync | Medium | IT + HR |
| Corporate email relay | Low–medium | IT |
| File storage / DMS | Medium | IT + dev |
| Executive read-only dashboard | Low | Product + dev |
| Migration version tracking table | Low | Dev / DBA |

---

## Recommended integration phases

### Phase 1 — Pilot (current)

- Zamtel central staff auth (GN + AD password); users auto-provisioned on first sign-in
- Department setup and admin promotion via admin portal
- Optional email via Zamtel internal SMTP (nodemailer)
- Internal server deployment

### Phase 2 — Identity

- Full OIDC/SAML SSO via corporate IdP (extends current central staff auth)
- httpOnly session cookies
- Automated deactivation from HR offboarding feed

### Phase 3 — Data sync

- Nightly HR import for users and departments
- Manager mapping from org hierarchy
- Corporate SMTP for all notifications

### Phase 4 — Enterprise reporting

- Read replica or API export for BI
- Central log forwarding
- DMS for attachments

---

## API endpoints most useful for integrators

| Area | Endpoints | Auth |
|------|-----------|------|
| Users | `GET/POST/PATCH /users`, `GET /users/by-email/:email` | Admin |
| Departments | `GET/POST/PATCH /departments` | Admin (mutations) |
| Roles | `GET /roles` | Admin |
| Requests | `GET/POST /requests`, `PATCH /requests/:id/status` | Per policy |
| Health | `GET /health` | Public |

Full reference: [`API.md`](API.md).

---

## Security considerations for integration

- All integration jobs should use a dedicated **admin service account** with a strong password or future machine credential.
- Never expose the API to the public internet without VPN or internal network controls.
- Rotate `JWT_SECRET` and integration secrets through Zamtel’s secret management process.
- See [`SECURITY.md`](SECURITY.md) for rate limits, CORS, and audit behaviour.
