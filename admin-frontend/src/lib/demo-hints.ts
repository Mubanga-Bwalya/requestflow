/** True only when NEXT_PUBLIC_SHOW_DEMO_HINTS=true (local dev; never in production builds). */
export const showDemoHints = process.env.NEXT_PUBLIC_SHOW_DEMO_HINTS === "true";

export const adminLoginDemoHint =
  "Demo: admin@requestflow.local / password requestflow";

export const adminLoginDemoEmail = "admin@requestflow.local";
