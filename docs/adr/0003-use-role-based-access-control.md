# ADR 0003: Use role-based access control

**Status:** Accepted  
**Date:** 2026-03 (MVP)

## Context

Internal app with employees, department managers, and system administrators. Access must be enforced server-side per request, assignment, and department.

## Decision

Store roles in PostgreSQL (`roles` table). Enforce via `AccessPolicyService` + `JwtStrategy` (reload role from DB each request). Combine **role name** with **department membership** for manager actions.

## Consequences

- Central policy service testable via unit/e2e tests
- Manager rules split between `managerUserId` and `departmentId` (known inconsistency to resolve)
- No fine-grained permission ACL table in MVP

## Alternatives considered

- JWT role claims only — rejected (stale privileges after demotion)
- PostgreSQL RLS — deferred post-MVP
