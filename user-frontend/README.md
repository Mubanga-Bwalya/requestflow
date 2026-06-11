# RequestFlow — User portal

Employee and **appointed department manager** portal (:3000) for internal company requests and assigned tasks.

**Documentation:** [`../README.md`](../README.md) · [`../docs/SETUP.md`](../docs/SETUP.md)

```bash
cp .env.example .env.local
npm run dev    # or: npm run dev:user from repo root
```

Open http://localhost:3000 — API must run on :4000.

**Workflow notes:**
- **Department inbox** is for users appointed as `manager_user_id` on a department — not for everyone with a “Manager” role name.
- **100% milestone progress** does not complete the request; the manager marks ready for review and the requester approves.
- Copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_SHOW_DEMO_HINTS=true` for dev login hints (restart dev server after creating `.env.local`). Never enable in production builds.

**UX notes:**
- Dashboard, requests, tasks, and department inbox show a red error banner when API calls fail (with Retry). Empty states appear only for genuine zero results.
- Missing-information answers use field-type-aware inputs (date, number, long text, etc.) when the original template field type is known.
