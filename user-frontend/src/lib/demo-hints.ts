/** True only when NEXT_PUBLIC_SHOW_DEMO_HINTS=true (local dev; never in production builds). */
export const showDemoHints = process.env.NEXT_PUBLIC_SHOW_DEMO_HINTS === "true";

/**
 * Whether the email-only developer sign-in tab is available. Enabled explicitly
 * via NEXT_PUBLIC_ENABLE_DEV_LOGIN, or implicitly whenever demo hints are shown.
 * The API still hard-disables dev-login in production regardless of this flag.
 */
export const devLoginEnabled =
  process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true" || showDemoHints;

/** Demo email logins for the developer sign-in tab (no password needed). */
export const userLoginDemoHint =
  "Developer sign-in (email only) — Requester: musa@requestflow.local · Innovations manager: mbwalya4477@gmail.com · Assignee: iris@requestflow.local";
