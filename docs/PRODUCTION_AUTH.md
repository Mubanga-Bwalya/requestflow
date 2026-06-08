# Production authentication and session hardening

> **Status:** MVP uses Bearer JWT in `localStorage` for internal organisation deployment. Roles are loaded from PostgreSQL on every API request. Plan httpOnly cookies or company SSO before public/untrusted use.

## Current behavior

| Topic | Behavior |
|-------|----------|
| JWT | Signed with `JWT_SECRET` (≥32 chars in production; weak defaults rejected at startup) |
| Role / department | Loaded from PostgreSQL in `JwtStrategy.validate` — **not** trusted from token payload |
| Inactive users | `isActive: true` required; deactivated users get 401 |
| Login rate limit | 5 attempts / minute / IP (`429`) |
| Write rate limit | 60 mutations / minute / IP on sensitive routes |
| Passwords | Bcrypt required in production; plain-text compare only if `ALLOW_LEGACY_PLAINTEXT_PASSWORDS=true` |
| New user passwords | Min 12 chars; `requestflow` blocked; demo default only when `NODE_ENV` ≠ `production` |

## Required production environment variables

```env
NODE_ENV=production
JWT_SECRET=<random 32+ character secret>
CORS_ORIGINS=https://user-portal.company.com,https://admin-portal.company.com
DATABASE_URL=...
```

Do **not** set `CORS_ORIGINS=*` in production.

## Recommended before real production

1. **Session storage** — Move access token to httpOnly, `Secure`, `SameSite` cookies set by the API (or replace with OIDC/SAML via company IdP). See `docs/COMPANY_INTEGRATION.md`.
2. **Refresh tokens** — Short-lived access token + refresh rotation and server-side revocation on role change.
3. **Token version** — Increment `tokenVersion` on `users` when role/department changes to invalidate outstanding JWTs immediately.
4. **CSP `connect-src`** — Set `NEXT_PUBLIC_API_URL` to the production API origin before `npm run build` on both portals (`security-headers.mjs` derives CSP automatically; dev builds still allow localhost).

## Local development

- `JWT_SECRET` optional (dev fallback used)
- `ALLOW_DEMO_DEFAULT_PASSWORD=false` disables `requestflow` default for new users
- `ALLOW_LEGACY_PLAINTEXT_PASSWORDS=false` disables plain-text password verify (run `npm run hash-passwords`)

## Frontend errors

Production builds show generic API error messages. Detailed Nest validation messages appear only when `NODE_ENV=development` on the Next.js app.
