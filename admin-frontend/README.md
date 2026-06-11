# RequestFlow — Admin portal

Internal **admin** configuration UI (:3001) for users, departments, templates, settings, reports, and system logs.

**Documentation:** [`../README.md`](../README.md) · [`../docs/SETUP.md`](../docs/SETUP.md)

```bash
cp .env.example .env.local
npm run dev    # or: npm run dev:admin from repo root
```

Login: `admin@requestflow.local` (dev, when demo hints enabled) — requires DB role **Admin** or **System Admin**.

**Routes:** Dashboard, Users, Departments, Templates, Reports, **System Logs** (`/logs`), Settings.

**UX notes:**
- Non-admin users who reach the portal see an access-denied screen (backend still enforces via `AdminRoleGuard`).
- API load failures show red error banners with Retry — not empty tables with zero rows.
- Department managers are assigned manually per department on the edit form (not inferred from role name).
