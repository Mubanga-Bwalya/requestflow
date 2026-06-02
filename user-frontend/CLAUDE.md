# User Frontend Session Memory

## Brand Palette (Official)
- Primary Green: `#008542`
- Dark Green: `#015217`
- Lime Green: `#A9DD00`
- White: `#FFFFFF`

## Latest Session Summary
- Date: 2026-06-02
- Focus: Functional clickable prototype with local mock state
- Completed:
  - `src/lib/local-store.tsx` — in-memory requests, assignments, inbox, activity, missing-info
  - `src/lib/request-templates.ts` — department-specific request type field definitions
  - Functional pages: login, dashboard, create request (5-step), my requests, request details, tasks, task details, department inbox
  - `Dialog` component for modals; tabs support `onClick`
- Frontend actions implemented:
  - Mock login → `/dashboard`
  - Create request with validation + local add to requests list
  - Filter/search on requests and tasks
  - Approve/reopen request; provide missing information dialog
  - Add/update milestones with auto progress recalculation
  - Manager inbox: accept, assign, request info (syncs to linked request), reject
- What is working:
  - Lint/build passing; Zamtel-branded shell and shared components
- What remains mock/local only:
  - State resets on refresh; no real auth/API/uploads
- What backend needs to connect later:
  - Request CRUD, assignment/milestone APIs, inbox workflow persistence, auth
- Next recommended task:
  - Connect pages to backend DTOs once Prisma + APIs exist
