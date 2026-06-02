# RequestFlow Project Memory

## Persistent Context
- Project: RequestFlow
- Architecture: Monorepo with `user-frontend`, `admin-frontend`, `backend`
- Domain: Internal request and progress tracking system (not chat/collaboration)
- MVP departments: HR and Marketing only
- Comments/chat: explicitly out of scope for MVP

## Official Brand Palette (Applies to both frontends)
- Primary Green: `#008542`
- Dark Green: `#015217`
- Lime Green: `#A9DD00`
- White: `#FFFFFF`

Reusable tokens:
- `--color-primary-green`
- `--color-dark-green`
- `--color-lime-green`
- `--color-white`

## Latest Session Summary
- Date: 2026-06-02
- Focus: Frontend functional prototype completion (mock/local state, no backend)
- Completed:
  - Added in-app local stores (`src/lib/local-store.tsx`) for user and admin portals
  - Added reusable `Dialog` component for modals in both apps
  - User portal: functional login, dashboard (live counts + links), create-request stepper, my requests filters/search, request details actions, tasks + milestone dialogs, department inbox manager workflows
  - Admin portal: functional login, dashboard quick links, users CRUD dialogs, department manager edit, roles permission dialog, templates filter/toggle, template field add/edit/delete, reports filter, settings local save
  - Fixed build issues (escaped quotes, `useSearchParams` prerender split for create request)
- Files created:
  - `user-frontend/src/lib/local-store.tsx`
  - `user-frontend/src/lib/request-templates.ts`
  - `user-frontend/src/components/ui/dialog.tsx`
  - `user-frontend/src/app/dashboard/dashboard-client.tsx`
  - `user-frontend/src/app/requests/create/create-request-client.tsx`
  - `admin-frontend/src/lib/local-store.tsx`
  - `admin-frontend/src/components/ui/dialog.tsx`
  - `admin-frontend/src/components/shared/priority-badge.tsx`
  - `admin-frontend/src/components/shared/progress-card.tsx`
  - `admin-frontend/src/app/dashboard/dashboard-client.tsx`
  - `admin-frontend/src/app/templates/[id]/template-detail-client.tsx`
  - `admin-frontend/CLAUDE.md`, `admin-frontend/AGENTS.md`
- Files modified:
  - User: all main route pages, `layout.tsx`, shared `data-table-placeholder`, `tabs`, prior branding files
  - Admin: all main route pages, `layout.tsx`, shared components, prior branding files
  - Root `README.md`, `CLAUDE.md`, `AGENTS.md`, `user-frontend/CLAUDE.md`, `user-frontend/AGENTS.md`
- Frontend functionality added:
  - Local login flows, multi-step create request, tab/search filters, manager review/assign/request-info/reject dialogs, milestone add/update with progress recalculation, approve/reopen/provide-info on request details, admin user/template/settings management
- Brand/UI improvements:
  - Prior Zamtel branding pass retained (dark sidebar, green surfaces, badges, tables)
- What is working:
  - `user-frontend` and `admin-frontend` lint/build passing
  - Clickable prototype behaviour across main routes (state resets on refresh)
- What remains mock/local only:
  - Auth, persistence, real uploads, notifications, API integration, workflow automation
  - Zamtel logo asset (placeholder component only)
- What backend needs to connect later:
  - Prisma migrations + seed data, auth, request/template CRUD APIs, file storage, notifications, activity log persistence, progress aggregation
- Next recommended task:
  - Start backend database phase: Prisma baseline migration + seed HR/Marketing departments, roles, templates, template fields + read-only APIs for departments/templates
