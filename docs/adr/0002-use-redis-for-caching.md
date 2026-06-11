# ADR 0002: Use Redis for optional caching

**Status:** Accepted  
**Date:** 2026-06

## Context

Dashboard and auth paths hit PostgreSQL frequently. Internal pilot needed faster reads without making Redis mandatory for development.

## Decision

Use **Redis 7** behind `CacheService` when `REDIS_ENABLED=true`. Cache auth user snapshots, workspace summaries, and admin stats. On Redis failure, **fail open** to PostgreSQL.

## Consequences

- Improved read latency when Redis healthy
- Possible ~45s stale auth role if cache not invalidated
- Operators must restart API after Redis outage to reconnect client

## Alternatives considered

- In-memory only — rejected (not shared across API instances)
- Required Redis — rejected (complicates local dev)
