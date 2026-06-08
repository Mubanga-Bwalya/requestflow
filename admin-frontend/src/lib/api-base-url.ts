const DEFAULT_API = "http://localhost:4000";

function envApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return DEFAULT_API;
  try {
    const u = new URL(raw);
    if (u.protocol === "http:" || u.protocol === "https:") return u.origin;
  } catch {
    /* ignore invalid env */
  }
  return DEFAULT_API;
}

/** PC: localhost API. Phone on Wi‑Fi: API on the same host as the portal (port 4000). */
export function resolveApiBaseUrl(): string {
  const fromEnv = envApiUrl();
  if (typeof window === "undefined") return fromEnv;

  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") return fromEnv;

  return `http://${hostname}:4000`;
}
