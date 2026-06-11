/** Builds Next.js security headers; CSP connect-src follows NEXT_PUBLIC_API_URL. */

const DEV_API_ORIGINS = ["http://localhost:4000", "http://127.0.0.1:4000"];

/** Fail production builds when demo UI would be enabled. */
export function validateProductionEnv() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_SHOW_DEMO_HINTS === "true"
  ) {
    throw new Error(
      "NEXT_PUBLIC_SHOW_DEMO_HINTS must be false or unset in production builds.",
    );
  }
}

function resolveConnectSrcOrigins() {
  const origins = new Set();
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (raw) {
    if (raw.includes("*")) {
      throw new Error("NEXT_PUBLIC_API_URL cannot contain wildcards.");
    }
    let parsed;
    try {
      parsed = new URL(raw);
    } catch {
      throw new Error(`NEXT_PUBLIC_API_URL is not a valid URL: ${raw}`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_API_URL must use http: or https:");
    }
    origins.add(parsed.origin);
  }

  if (isProd && origins.size === 0) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is required for production builds (API client and CSP connect-src).",
    );
  }

  if (!isProd) {
    for (const origin of DEV_API_ORIGINS) {
      origins.add(origin);
    }
    const lanHost = process.env.NEXT_PUBLIC_DEV_LAN_HOST?.trim();
    if (lanHost && !lanHost.includes("/") && !lanHost.includes(":")) {
      origins.add(`http://${lanHost}:4000`);
    }
  }

  return origins;
}

export function buildSecurityHeaders() {
  const connectOrigins = ["'self'", ...resolveConnectSrcOrigins()];

  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Content-Security-Policy",
      value: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        `connect-src ${connectOrigins.join(" ")}`,
      ].join("; "),
    },
  ];
}
