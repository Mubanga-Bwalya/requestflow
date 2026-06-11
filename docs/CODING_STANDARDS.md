# Coding standards

> **Last updated:** 2026-06-11

Related: [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`TESTING.md`](TESTING.md)

---

## TypeScript

- `strict: true` on frontends; backend uses partial strict flags — prefer explicit types on public APIs.
- Avoid `any`; use shared types or Prisma-generated types.
- No `mock-data.ts` or client-supplied identity fields on API calls.

---

## File size

| Scope | Rule |
|-------|------|
| `backend/src`, `*/src` (app code) | Target **≤ 250 lines** per file |
| SQL seed/schema files | May exceed 250 when documented in [`DATABASE.md`](DATABASE.md) |

**Split pattern:** facade service + query/mutation/lifecycle services (see [`CODE_ORGANIZATION.md`](CODE_ORGANIZATION.md)).

Phase 5 splits applied:

- Requests lifecycle → status + missing-info services
- Users, departments, assignments → query + mutation (+ mapper/helpers)
- `admin-users-form.ts`, `create-request-build.ts` extracted from hooks

**Styles:** keep a single `src/app/globals.css` per portal (Tailwind directives + `:root` tokens + `@layer components` `.rf-*` classes). Do not split into `@import` files — `postcss-import` cannot interleave imports with `@tailwind` layers without breaking styles at runtime.

---

## Naming

| Item | Convention |
|------|------------|
| Auth provider | `auth-context.tsx` — `AuthProvider`, `useAuth` |
| Session storage | `session.ts` — not mock data |
| API modules | `*-api.ts` per domain |
| Nest modules | `feature.module.ts`, `feature.controller.ts`, `feature.service.ts` |

---

## Backend standards

| Layer | Rule |
|-------|------|
| Controllers | Thin — delegate to services; use `@CurrentUser()` |
| Services | Business rules, transactions, policy calls |
| DTOs | `class-validator` decorators; whitelist via global pipe |
| Authorization | `AccessPolicyService` — never trust JWT role claims |
| Multi-row writes | `$transaction` + optimistic `updateMany` where concurrent |
| Errors | Throw Nest HTTP exceptions; filter formats response |
| Logging | No passwords/tokens in logs; 5xx to `system_events` |

---

## Frontend standards

| Layer | Rule |
|-------|------|
| Pages | Thin route containers; logic in hooks |
| API | Central `api.ts` axios instance + domain modules |
| Errors | `apiErrorMessage()` for user-facing text |
| Loading | `authReady` before shell render (hydration) |
| UI gates | Cosmetic only — document that API enforces |
| Double-submit | Disable buttons while `saving` / `loading` |

---

## DTO validation

- Global `ValidationPipe`: `whitelist`, `forbidNonWhitelisted`, `transform`
- Reject unknown properties on all bodies
- Enum fields use Prisma/`@IsEnum` types

---

## Error handling

| Context | Rule |
|---------|------|
| API 4xx | Pass safe message to client |
| API 5xx | Generic message in production |
| Audit | Must not break primary flow on failure |
| Frontend | Show banner via `apiErrorMessage`; avoid silent `catch` on dashboards |

---

## Logging

- Request ID on every response
- Slow request logging optional (`SLOW_REQUEST_MS`)
- No Bearer tokens in client error reports body

---

## Dependencies

- No unused packages — remove if introduced accidentally
- Pin critical runtime deps (Next, axios) on frontends
- Run `npm audit` before production (not yet in CI)

---

## Secrets

- Never commit `.env`, API keys, or real passwords
- `.env.example` uses empty placeholders only
- Demo password `requestflow` — development only

---

## Documentation upkeep rule

Any change affecting **architecture, API, schema, env vars, security, permissions, deployment, setup, testing, or workflows** must update the relevant file under `docs/` in the **same commit or session**.

| Change type | Update |
|-------------|--------|
| New endpoint | `docs/API.md` |
| New permission rule | `docs/USER_ROLES_AND_PERMISSIONS.md`, `docs/SECURITY.md` |
| Status transition | `docs/REQUEST_WORKFLOW.md` |
| SQL file | `docs/DATABASE.md` |
| Env var | `docs/SETUP.md`, `docs/DEPLOYMENT.md`, `backend/.env.example` |

---

## Dead code

- Remove unused files, exports, and dependencies
- No placeholder routes linked from navigation without implementation
