# RequestFlow — Dev environment performance

Production (`npm run build` + `npm start`) is the real performance baseline. **Next.js dev mode compiles routes on demand**, so the first click to a page is often slower than production. These steps keep local dev as responsive as possible.

## 1. OneDrive / synced folders (Windows)

If the repo lives under **OneDrive** (e.g. `Desktop\RequestFlow`):

- **Best:** clone or move the project to a local path such as `C:\dev\RequestFlow`.
- **Minimum:** pause OneDrive sync while developing, or exclude:
  - `user-frontend/.next`
  - `admin-frontend/.next`
  - `backend/dist`
  - `node_modules` (all three apps)

Corrupted `.next` manifests and slow compiles are common on synced paths.

## 2. Use webpack dev (default)

| App | Command | Notes |
|-----|---------|--------|
| User portal | `npm run dev` | Webpack — recommended on Windows / OneDrive |
| User portal | `npm run dev:turbo` | Turbopack — optional; can be faster on non-synced paths |
| Admin portal | `npm run dev` | Webpack (port 3001) |
| Admin portal | `npm run dev:turbo` | Optional Turbopack |

After changing dev mode or `next.config.mjs`:

```powershell
Remove-Item -Recurse -Force user-frontend\.next, admin-frontend\.next -ErrorAction SilentlyContinue
```

Then restart `npm run dev`.

## 3. Compare with production locally

When judging UI speed, always verify production once:

```powershell
cd user-frontend
npm run build
npm start

cd admin-frontend
npm run build
npm run start -- -p 3001
```

Backend: `cd backend && npm run start:dev` (or `start:prod` after build).

## 4. Backend dev helpers

- Apply SQL through `010_performance_indexes.sql` on Postgres.
- Optional Redis: `REDIS_ENABLED=true` in `backend/.env` (caches auth, workspace, notifications, admin aggregates).
- Reset cluttered test data: `backend/scripts/cleanup-dev-requests.ts`.
- Pilot slow-request logging: `SLOW_REQUEST_LOGGING_ENABLED=true` (production only; see `backend/.env.example`).

## 4b. Cache tiers (read this before judging staleness)

| Layer | Typical TTL | What |
|-------|-------------|------|
| Redis (optional) | 20–60s | Workspace, unread count, auth user, admin dashboard/reports |
| Frontend in-memory | 8–15s | Workspace, admin stats, list pages (invalidated on mutations) |

After workflow actions (assign, status change, milestone), frontends call `invalidateApiCache` — dashboard should refresh within a few seconds even with Redis on.

## 5. What we already tuned in the app

- Persistent `(portal)` shell (sidebar does not remount on navigation).
- Route-level `loading.tsx` skeleton (main content only).
- Shorter click transitions; no staggered dashboard animations.
- Solid header background (no `backdrop-blur` in the shell).
- `optimizePackageImports` for `lucide-react` in both frontends.
- Debounced list search; short client API cache (8–15s); Redis optional on backend.

## 6. Dev-only limitations (expected)

| Symptom | Cause |
|---------|--------|
| First visit to a route feels slow | Next compiles that page in dev |
| Second visit faster | Module cached until file change |
| Full-page spinner on login | `RequireAuth` waits for session restore — normal |
| React Strict Mode double effects | Dev-only; not in production |

## Related

- [LOCAL_RUN.md](./LOCAL_RUN.md) — setup and troubleshooting
- [PERFORMANCE_TEST_PLAN.md](./PERFORMANCE_TEST_PLAN.md) — post-change checklist
