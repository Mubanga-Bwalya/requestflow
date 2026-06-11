# ADR 0004: Use separate user and admin frontends

**Status:** Accepted  
**Date:** 2026-03 (MVP)

## Context

Employees/managers need a task-focused portal; administrators need configuration screens with different navigation and stricter login (`adminOnly`).

## Decision

Two Next.js apps:

- `user-frontend` (:3000) — requests, inbox, tasks
- `admin-frontend` (:3001) — users, departments, templates, settings, reports

Both call the same NestJS API with JWT Bearer auth.

## Consequences

- Duplicate UI/util code between portals (~40 files)
- Separate CSP builds and deploy units
- Clear separation for internal security reviews

## Alternatives considered

- Single app with role-based routes — rejected for MVP clarity and smaller attack surface per portal
- Monorepo shared UI package — planned, not implemented
