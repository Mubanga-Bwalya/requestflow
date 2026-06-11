/** True only when NEXT_PUBLIC_SHOW_DEMO_HINTS=true (local dev; never in production builds). */
export const showDemoHints = process.env.NEXT_PUBLIC_SHOW_DEMO_HINTS === "true";

/** Primary demo logins for the user portal (dev password: requestflow). */
export const userLoginDemoHint =
  "Demo logins (password: requestflow) — Requester: musa@requestflow.local · Innovations manager: mbwalya4477@gmail.com · Assignee: iris@requestflow.local";
