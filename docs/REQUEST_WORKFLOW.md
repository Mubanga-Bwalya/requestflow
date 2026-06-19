# Request workflow

> **Last updated:** 2026-06-11

Related: [`USER_ROLES_AND_PERMISSIONS.md`](USER_ROLES_AND_PERMISSIONS.md) · [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`API.md`](API.md)

---

## Overview

```txt
Requester                    Target dept manager              Assignees
    │                              │                            │
    ├─ Create request (SUBMITTED)──►│                            │
    │                              ├─ ACCEPT / REJECT / NEEDS_INFO
    │◄─ Provide info (if needed)───┤                            │
    │                              ├─ Assign team (ASSIGNED)────►│
    │                              │                            ├─ Milestones / IN_PROGRESS
    │                              ├─ READY_FOR_REVIEW ◄────────┤
    │◄─ Review (COMPLETED/RFR)─────┤                            │
    ├─ APPROVE / REOPEN ──────────►│                            │
```

---

## Request creation

1. Employee selects **target department** and **request template** (user portal create wizard).
2. `POST /requests` with template field answers.
3. Backend sets `createdByUserId` from JWT (never from body).
4. Initial status: **`SUBMITTED`**.
5. Request number allocated atomically (`RF-YYYY-NNNN`).

**Who:** any authenticated active user.

---

## Manager review (inbox)

Manager lists requests: `GET /requests?targetDepartmentName=<dept>` (inbox gate).

| Action | API | New status |
|--------|-----|------------|
| Accept | `PATCH /requests/:id/status` `{ status: "ACCEPTED" }` | `ACCEPTED` |
| Reject | `{ status: "REJECTED" }` | `REJECTED` (terminal) |
| Cancel | `{ status: "CANCELLED" }` | `CANCELLED` (terminal) |
| Needs information | `POST /requests/:id/request-missing-information` | `NEEDS_INFORMATION` |

**Who:** target department manager (or admin).

---

## Missing information

1. Manager opens missing-info round with field items + reasons.
2. Requester notified.
3. Requester `POST /requests/:id/provide-information` with answers.
4. Status returns to **`SUBMITTED`**; open missing-info record resolved.

**Who:** manager requests; requester provides.

---

## Assignment

1. Manager `POST /assignments` with `requestId` + `memberUserIds`.
2. Preconditions: request `SUBMITTED` or `ACCEPTED`; no existing assignment.
3. Creates assignment (`ASSIGNED`), members, activity log; request → **`ASSIGNED`**.

**Who:** user appointed as `manager_user_id` of `request.targetDepartmentId`. All assignees must belong to that department (MVP).

---

## Tasks and milestones

| Step | Behaviour |
|------|-----------|
| Assignee opens task | `GET /assignments` (scoped to membership) |
| Add milestone | `POST /assignments/:id/milestones` — owner must be assignment member; members may only create for themselves |
| Update milestone | `PATCH .../milestones/:id` — members edit own milestones only; appointed manager may edit any on the assignment |
| Progress calculation | **Average** of all milestone `progressPercentage` values |
| Assignment status from progress | `ASSIGNED` → `IN_PROGRESS` when progress > 0; **does not** auto-complete at 100% |
| Request progress field | `progressPercentage` synced from assignment average |

### Critical rule: 100% ≠ complete

Reaching **100% milestone average**:

- Updates `assignment.progressPercentage` and request `progressPercentage`
- Does **not** set request to `COMPLETED`
- Does **not** set assignment to `READY_FOR_REVIEW`

**Manager** must explicitly mark assignment `READY_FOR_REVIEW` (`PATCH /assignments/:id/status`).

---

## Ready for review and completion

| Step | Actor | Result |
|------|-------|--------|
| Mark ready for review | Target dept manager | Assignment + request → `READY_FOR_REVIEW` |
| Mark completed (assignment) | Appointed target dept manager | Assignment + request → `COMPLETED` when allowed |
| Approve | Requester | Request → `APPROVED` (terminal) |
| Reopen | Requester | Request → `REOPENED`; assignment may reopen |

Requester approve/reopen only when current status is **`COMPLETED`** or **`READY_FOR_REVIEW`**.

---

## Status transition table (requests)

Enforced in `request-status-transitions.ts`:

| From | Allowed to |
|------|------------|
| `SUBMITTED` | `ACCEPTED`, `REJECTED`, `NEEDS_INFORMATION`, `CANCELLED` |
| `ACCEPTED` | `ASSIGNED`, `REJECTED`, `NEEDS_INFORMATION`, `CANCELLED` |
| `ASSIGNED` | `IN_PROGRESS`, `NEEDS_INFORMATION`, `CANCELLED` |
| `IN_PROGRESS` | `READY_FOR_REVIEW`, `COMPLETED`, `NEEDS_INFORMATION`, `CANCELLED` |
| `NEEDS_INFORMATION` | `SUBMITTED`, `CANCELLED` |
| `READY_FOR_REVIEW` | `COMPLETED`, `APPROVED`, `REOPENED`, `NEEDS_INFORMATION` |
| `COMPLETED` | `APPROVED`, `REOPENED` |
| `REOPENED` | `IN_PROGRESS`, `NEEDS_INFORMATION`, `CANCELLED` |
| `APPROVED`, `REJECTED`, `CANCELLED` | *(terminal)* |

`DRAFT` exists in schema but create flow submits directly as `SUBMITTED`.

---

## Notifications (workflow triggers)

| Event | Typical recipients |
|-------|-------------------|
| Request submitted | Target department managers |
| Assignment created | Members + requester |
| Missing information | Requester |
| Ready for review / completed | Requester |
| Milestone updated | Other assignment members |

In-app always; email when `EMAIL_ENABLED=true`.

---

## Role actions by stage

| Stage | Requester | Manager | Assignee | Admin |
|-------|-----------|---------|----------|-------|
| Submitted | View | Accept/reject/info | — | All |
| Needs info | Provide answers | — | — | All |
| Accepted | View | Assign | — | All |
| Assigned / in progress | View progress | Assign milestones policy | Update milestones | All |
| Ready for review | Approve/reopen | — | View | All |
| Approved | View | — | — | All |

---

## Phase 1 changelog (2026-06-11)

**What changed:** Members can no longer force `READY_FOR_REVIEW` / `COMPLETED` on requests or assignments. Milestone progress at 100% updates `progressPercentage` only — request completion requires manager review then requester approval.

**Developer rule:** Do not auto-complete requests from milestone progress in `assignment.mapper` or milestone services.

---

## Cancellation and rejection

- **Rejected:** manager at review; terminal.
- **Cancelled:** manager during active stages; terminal.
- No separate “withdraw” flow for requester in MVP (requester cannot cancel via documented happy path).
