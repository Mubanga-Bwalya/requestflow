# User roles and permissions

> **Last updated:** 2026-06-11  
> **Source of truth:** `backend/src/common/access-policy.service.ts`, `manager-inbox.ts`, `auth-helpers.ts`

Related: [`SECURITY.md`](SECURITY.md) · [`REQUEST_WORKFLOW.md`](REQUEST_WORKFLOW.md) · [`API.md`](API.md)

---

## Roles in the database

| Role name (examples) | Portal | Notes |
|---------------------|--------|-------|
| `Employee` | User | Default requester / assignee |
| `HR Manager`, `Marketing Manager` | User | Role name **contains** `"Manager"` |
| `Admin` | Admin | Required for admin portal login |
| `System Admin` | Admin | Treated same as `Admin` in API guards |

**Executive role:** **Not implemented.** No separate executive permissions exist in code.

**Team member** is a functional label (assignee), not a separate permission tier beyond `Employee`.

**Provisioning:** Staff are auto-provisioned on first sign-in through Zamtel central staff auth (GN + AD password) and receive the default role **`Employee`**. Admin or System Admin access is granted **manually** — set the role in the admin portal. See [`SECURITY.md`](SECURITY.md) and [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## How the backend identifies a department manager

**Source of truth:** `departments.manager_user_id` — the user manually appointed as manager of that department.

| Helper | Location | Used for |
|--------|----------|----------|
| `isDepartmentManager(userId, departmentId, managedDepartmentIds)` | `department-manager.ts` | All manager mutations |
| `user.managedDepartmentIds` / `managedDepartmentNames` | Loaded in `JwtStrategy` + login | Inbox gate, access policy |

**Manager role name alone does not grant department-manager authority.** A user with role `HR Manager` who is not `manager_user_id` for HR has employee-level access in that department.

`isManagerRole()` remains for display/legacy labels only — **not** for authorization.

---

## Department ownership rules

| Rule | Detail |
|------|--------|
| Each department has at most one `manager_user_id` | One appointed manager per department |
| One user can manage multiple departments | Supported — same user may be `manager_user_id` on several rows |
| Manager-level access in department X | `user.id === departments.manager_user_id` for that department |
| Manager role without appointment | Employee-level access in that department |
| Admins | Global access via `AccessPolicyService.isAdmin()` |

### Phase 1 changelog (2026-06-11)

**What changed:** Manager authority now comes only from `departments.manager_user_id` (via `managedDepartmentIds` on `RequestUser`). Prisma `@unique` on `managerUserId` removed; apply `014_allow_multi_department_manager.sql` on existing DBs.

**Developer rule:** Never use `isManagerRole()` + `user.departmentId` for authorization — use `isDepartmentManager()` or `user.managedDepartmentIds`.

---

## Permission matrix

### Admin (`Admin` / `System Admin`)

| Action | Allowed |
|--------|---------|
| All admin routes (`/admin/*`) | Yes |
| User CRUD | Yes |
| Department CRUD | Yes |
| Template / field CRUD | Yes |
| System settings | Yes |
| View any request/assignment (via policy) | Yes |
| Override status transitions | Yes (bypass in `AccessPolicyService`) |

### Employee (non-manager)

| Action | Allowed |
|--------|---------|
| Create requests | Yes (to any active target department) |
| View own requests | Yes |
| View assignments where member | Yes |
| Update own milestones | Yes (own milestones only) |
| Department inbox | No |
| Assign work | No |
| Accept/reject incoming requests | No |
| Approve own outgoing request | Yes, when status is `COMPLETED` or `READY_FOR_REVIEW` |
| Admin portal | No |

### Department manager

All employee permissions **plus** (for **their** target department only):

| Action | Allowed |
|--------|---------|
| List department inbox | Yes (`targetDepartmentName` query + inbox gate) |
| Accept / reject / cancel / request missing info | Yes |
| Create assignment | Yes (must be manager; `departmentId` must match request target) |
| Mark assignment `READY_FOR_REVIEW` | Yes |
| List department team (`GET /users?departmentName=`) | Yes |
| Assign members from target department only | Yes (MVP — same-department assignees) |

Managers **cannot** view or manage requests for other departments (404/403).

---

## Request permissions by action

| Action | Who (backend) |
|--------|----------------|
| Create request | Any authenticated user |
| View request detail | Admin, requester, target-dept manager, assignment members |
| List own requests | Requester (`GET /requests` without inbox param) |
| List dept inbox | User appointed manager of that department (`managedDepartmentNames`) |
| `ACCEPTED` / `REJECTED` / `NEEDS_INFORMATION` / `CANCELLED` | Target department manager (or admin) |
| `APPROVED` / `REOPENED` | Requester (or admin) |
| `IN_PROGRESS` on request | Appointed target manager or assignment member |
| `READY_FOR_REVIEW` / `COMPLETED` on request | Appointed target manager (or admin) only |
| Provide missing information | Requester only |
| Request missing information | Target department manager |

---

## Assignment / milestone permissions

| Action | Who (backend) |
|--------|----------------|
| View assignment | Admin, member, target manager, original requester |
| Create assignment | Appointed manager of `request.targetDepartmentId` |
| Update assignment status | Admin, appointed manager; members may set `IN_PROGRESS` only |
| `READY_FOR_REVIEW` / `COMPLETED` on assignment | Admin, appointed target manager only |
| Create/update milestone | Admin, appointed manager, or member on **own** milestones |

---

## Admin configuration permissions

| Resource | Employee | Manager | Admin |
|----------|----------|---------|-------|
| `GET /system-settings` | Yes | Yes | Yes |
| `PATCH /system-settings` | No | No | Yes |
| `GET /users` (all) | No | No | Yes |
| `GET /users?departmentName=` | No | Own dept only | Yes |
| `POST/PATCH /users` | No | No | Yes |
| `GET /departments` | Yes (list) | Yes | Yes |
| `POST/PATCH /departments` | No | No | Yes |
| `GET /roles` | No | No | Yes |
| Template mutations | No | No | Yes |

---

## Frontend vs backend

UI hides links (e.g. department inbox) for non-managers. **All enforcement is in the API.** Direct API calls with a valid JWT are authoritative.

---

See [`SECURITY.md`](SECURITY.md) for remaining gaps (token storage, revocation, etc.).
