# RequestFlow — Supervisor overview

> **Audience:** Supervisors, managers, and internal IT leadership  
> **Last updated:** 2026-06-18  
> **Start here** before technical setup or deployment guides.

---

## What RequestFlow is

**RequestFlow** is Zamtel’s internal request and task management system. Employees submit structured requests to other departments. Department managers review incoming work, approve or reject requests, assign team members, and track progress. Requesters follow status updates and approve completed work. Administrators manage users, departments, request templates, reports, and system settings.

RequestFlow is **not** a public internet service. It is designed for deployment on Zamtel’s internal network.

---

## Why it matters

| Benefit | What it means in practice |
|---------|---------------------------|
| Fewer lost requests | Requests are recorded digitally with a reference number and status |
| Better cross-department visibility | Requesters and managers see where work stands |
| Clear approval process | Managers accept, reject, or request more information before work starts |
| Accountability | Assignments, milestones, and activity logs create an audit trail |
| Management oversight | Admin dashboard and reports show volume and activity |
| Digital transformation | Replaces informal email or chat-only request handling |
| Integration ready | Can connect to HR, SSO, and internal systems when Zamtel is ready |

---

## Who uses RequestFlow

| Role | Portal | What they do |
|------|--------|--------------|
| **Employee** | User portal (port 3000) | Create requests, answer missing-information questions, track own requests, update assigned milestones |
| **Department manager** | User portal | Review department inbox, approve/reject requests, assign work, mark assignments ready for review |
| **Admin** | Admin portal (port 3001) | Manage users, departments, templates, settings, reports, and system logs |
| **Executive viewer** | Not implemented | No separate read-only executive role exists today; admins and managers use reports |

Full permission details: [`USER_ROLES_AND_PERMISSIONS.md`](USER_ROLES_AND_PERMISSIONS.md).

---

## How the workflow works

1. Employee logs in to the user portal.
2. Employee creates a request using a template and selects the target department.
3. Request is submitted with status **Submitted**.
4. The appointed department manager sees it in the **Department inbox**.
5. Manager accepts, rejects, cancels, or requests missing information.
6. Manager assigns team members; work moves to **Assigned** / **In progress**.
7. Assignees update milestones and progress.
8. Manager marks the assignment **Ready for review** when work is complete.
9. Requester reviews and approves (or reopens) the request.
10. Request reaches **Completed** or another terminal status.
11. Admins monitor activity via dashboard, reports, and **System Logs**.

Detailed lifecycle: [`REQUEST_WORKFLOW.md`](REQUEST_WORKFLOW.md).

---

## What has been built

| Area | Status |
|------|--------|
| User and admin web portals | Built |
| REST API with role-based security | Built |
| PostgreSQL database with migrations | Built |
| Optional Redis cache (fail-open) | Built |
| Request templates and dynamic fields | Built |
| Department manager inbox | Built |
| Assignments and milestones | Built |
| Missing-information workflow | Built |
| In-app notifications | Built |
| Admin reports and system logs | Built |
| Health check endpoint | Built |
| Local server deployment guide | Documented |
| Automated backend tests | Built |
| Playwright deployment smoke audit | Built |

---

## Current readiness

| Audience | Score | Meaning |
|----------|-------|---------|
| **Supervisor demo** | **8.5 / 10** | End-to-end workflow works; suitable for internal demonstration |
| **Controlled pilot** | **7.5 / 10** | Suitable on internal network with rotated secrets and manual QA |

Full status, limitations, and risks: [`PROJECT_STATUS.md`](PROJECT_STATUS.md).

---

## Behaviour supervisors should know

| Topic | Correct behaviour |
|-------|-------------------|
| **100% progress** | Does **not** auto-complete a request. Manager marks ready for review; requester approves. |
| **Department manager** | Authority comes from **manual appointment** per department in the admin portal. |
| **Manager job title** | A role name containing “Manager” does **not** alone grant inbox access. |
| **Multiple departments** | One person **can** manage several departments. |
| **Security** | Access rules are enforced on the server, not only by hiding buttons in the UI. |

---

## Integration with internal systems

RequestFlow can integrate with Zamtel systems when required. Today, users and departments are managed in the admin portal. Future integration points include staff directory/HR, single sign-on, corporate email, and reporting platforms.

What is built vs what needs connection: [`INTEGRATION_READINESS.md`](INTEGRATION_READINESS.md).

---

## How to deploy internally

RequestFlow runs on a standard internal server:

| Component | Requirement |
|-----------|-------------|
| Node.js | 20.11 or newer |
| PostgreSQL | 16 or newer (required) |
| Redis | Optional (recommended for performance) |
| Reverse proxy | Nginx recommended for HTTPS |

Operator guide: [`LOCAL_SERVER_DEPLOYMENT.md`](LOCAL_SERVER_DEPLOYMENT.md)  
Pre-deploy checklist: [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md)  
Backup policy: [`BACKUP_AND_RECOVERY.md`](BACKUP_AND_RECOVERY.md)

---

## Current limitations

| Limitation | Impact |
|------------|--------|
| No full OIDC/SAML SSO | Staff sign in with their GN (staff number) + AD password via Zamtel central staff auth; full SSO planned |
| No HR system sync | Users auto-provisioned on first sign-in; departments created manually or via seed data |
| No production Docker images for apps | Deploy with Node.js and PM2 or systemd |
| JWT stored in browser storage | Acceptable for pilot; httpOnly cookies planned for wider rollout |
| No frontend unit tests | UI changes need manual or Playwright smoke checks |

---

## Recommended next steps

1. **Demonstration** — Run the quick verification path in [`PROJECT_STATUS.md`](PROJECT_STATUS.md).
2. **Pilot planning** — Configure `ZAMTEL_AUTH_BASE_URL` for staff sign-in and set production environment variables per [`DEPLOYMENT.md`](DEPLOYMENT.md).
3. **Infrastructure** — Provision internal server, PostgreSQL, optional Redis, and Nginx.
4. **Sign-off** — Complete [`PRODUCTION_DEPLOYMENT_CHECKLIST.md`](PRODUCTION_DEPLOYMENT_CHECKLIST.md).
5. **Integration roadmap** — Prioritise SSO and HR sync with IT using [`INTEGRATION_READINESS.md`](INTEGRATION_READINESS.md).

---

## Where to go next

| If you need… | Read… |
|--------------|-------|
| Local development setup | [`SETUP.md`](SETUP.md) |
| System design | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| API reference | [`API.md`](API.md) |
| Security summary | [`SECURITY.md`](SECURITY.md) |
| Testing and verification | [`TESTING.md`](TESTING.md) |
| Technical project status | [`PROJECT_STATUS.md`](PROJECT_STATUS.md) |
