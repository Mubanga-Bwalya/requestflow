# ADR 0001: Use PostgreSQL

**Status:** Accepted  
**Date:** 2026-03 (MVP)

## Context

RequestFlow needs durable relational data: users, departments, requests, assignments, audit logs, and strict referential integrity between workflow entities.

## Decision

Use **PostgreSQL 16** as the sole system of record. Schema is applied via versioned SQL files in `backend/database/`. Prisma generates the TypeScript client.

## Consequences

- Strong enums, FKs, and CHECK constraints for progress bounds
- Manual SQL ordering required (no Prisma Migrate in MVP)
- CI and operators must apply SQL files consistently

## Alternatives considered

- SQLite — rejected (concurrency, production deployment)
- MongoDB — rejected (relational workflow fits SQL better)
