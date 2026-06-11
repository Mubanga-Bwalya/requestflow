# RequestFlow API (backend)

NestJS REST API for **RequestFlow** — internal company request and task management.

**Documentation:** [`../README.md`](../README.md) · [`../docs/API.md`](../docs/API.md) · [`../docs/DATABASE.md`](../docs/DATABASE.md) · [`../docs/SECURITY.md`](../docs/SECURITY.md)

## Quick start (local)

```bash
cp .env.example .env
# From repo root: bash backend/database/apply-migrations.sh
npm run prisma:generate
npm run db:seed -- --reset-passwords   # demo users; see docs/DATABASE.md
npm run build
npm run start:dev    # or: npm run dev:api from repo root
```

## Tests

```bash
npm run test              # unit (68 tests)
npm run test:e2e          # integration (requires Postgres)
npm run test:e2e:security
npm run lint
npm run typecheck
```

**Rules enforced in code:** authorization in `access-policy.service.ts`; department manager via `department-manager.ts`; 100% milestone progress does not auto-complete requests.
