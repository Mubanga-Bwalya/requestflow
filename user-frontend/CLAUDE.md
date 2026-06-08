# User Frontend Session Memory

> **Last updated:** 2026-06-04

## Brand palette

`#008542`, `#015217`, `#A9DD00`, `#FFFFFF`

## Integration

All domain data from NestJS. List pages use server-side `tab` + `q` query params.

Key libs: `session`, `requests-api`, `assignments-api`, `role-utils`, `api-error`.

Large flows split: `components/department-inbox/*`, `hooks/use-create-request.ts`, `components/create-request/*`.

## Run

```bash
cd backend && npm run start:dev
cd user-frontend && npm run dev
```

Login: `jane.employee@requestflow.local` / `requestflow`  
`NEXT_PUBLIC_SHOW_DEMO_HINTS=true` for demo hints on login.

## Docs

[`AGENTS.md`](AGENTS.md), [`docs/COMPANY_INTEGRATION.md`](../docs/COMPANY_INTEGRATION.md)
