/** True only when NEXT_PUBLIC_SHOW_DEMO_HINTS=true (local dev; never in production builds). */
export const showDemoHints = process.env.NEXT_PUBLIC_SHOW_DEMO_HINTS === "true";

/**
 * Whether the email-only developer sign-in tab is available. Enabled explicitly
 * via NEXT_PUBLIC_ENABLE_DEV_LOGIN, or implicitly whenever demo hints are shown.
 * The API still hard-disables dev-login in production regardless of this flag.
 */
export const devLoginEnabled =
  process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === "true" || showDemoHints;

export const adminLoginDemoHint =
  "Developer sign-in (email only): admin@requestflow.local";

export const adminLoginDemoEmail = "admin@requestflow.local";
