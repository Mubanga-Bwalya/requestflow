# RequestFlow Agent Handover

## Current Project State
- Monorepo: `user-frontend`, `admin-frontend`, `backend`
- Both frontends are now **clickable prototypes** driven by centralized mock data + in-memory local store (resets on refresh)
- Backend remains skeleton only

## Business Guardrails
- Departments in MVP: HR and Marketing only
- No chat/comments/discussion threads in MVP

## Official Brand Palette
- Primary: `#008542`
- Dark: `#015217`
- Lime: `#A9DD00`
- White: `#FFFFFF`

## Latest Session Summary
- Date: 2026-06-02
- Focus: Frontend functional prototype completion
- Frontend actions implemented:
  - User: mock login, dashboard live stats, create request stepper, request list filters, request detail approve/reopen/provide info, task milestone management, department inbox manager dialogs
  - Admin: mock login, users add/edit/activate, department manager edit, roles permission view, templates filter/toggle, template fields CRUD, reports department filter, settings save
- What works:
  - Both apps compile; main buttons open dialogs or update visible state; navigation works
- What remains mock/local only:
  - No database, no real auth, no file upload backend, state not persisted across refresh
- What backend needs to connect later:
  - Auth, Prisma entities, APIs for requests/templates/users/departments, uploads, notifications
- Next recommended task:
  - Backend database phase (Prisma migration + seeds + read-only template/department APIs)
