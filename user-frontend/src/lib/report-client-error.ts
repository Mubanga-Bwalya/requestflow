import axios from "axios";
import { resolveApiBaseUrl } from "@/lib/api-base-url";
import { getAccessToken } from "@/lib/session";

const PORTAL = "user" as const;
const recent = new Map<string, number>();
const DEDUPE_MS = 60_000;

export type ClientErrorReport = {
  code: string;
  message: string;
  pagePath?: string;
  apiPath?: string;
  statusCode?: number;
  stack?: string;
  level?: "WARN" | "ERROR";
};

function shouldSkip(message: string): boolean {
  const m = message.trim();
  if (!m) return true;
  if (m.includes("ResizeObserver loop")) return true;
  if (/^cancel(ed)?$/i.test(m)) return true;
  return false;
}

function dedupeKey(params: ClientErrorReport): string {
  return `${params.code}:${params.apiPath ?? ""}:${params.message.slice(0, 120)}`;
}

export function reportClientError(params: ClientErrorReport): void {
  if (typeof window === "undefined") return;
  if (shouldSkip(params.message)) return;

  const key = dedupeKey(params);
  const now = Date.now();
  const last = recent.get(key);
  if (last !== undefined && now - last < DEDUPE_MS) return;
  recent.set(key, now);

  const token = getAccessToken();
  const body = {
    portal: PORTAL,
    code: params.code,
    message: params.message.slice(0, 2000),
    pagePath: params.pagePath ?? window.location.pathname,
    apiPath: params.apiPath,
    statusCode: params.statusCode,
    stack: params.stack?.slice(0, 4000),
    level: params.level ?? "WARN",
  };

  void fetch(`${resolveApiBaseUrl()}/diagnostics/client-events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}

export function reportClientApiFailure(error: unknown): void {
  if (!axios.isAxiosError(error)) return;
  if (error.code === "ERR_CANCELED") return;

  const url = error.config?.url ?? "";
  if (url.includes("/diagnostics/client-events") || url.includes("/auth/login")) {
    return;
  }

  const statusCode = error.response?.status;
  const payload = error.response?.data;
  const apiMessage =
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
      ? (payload as { message: string }).message
      : null;

  reportClientError({
    code: statusCode ? `API_${statusCode}` : "API_UNREACHABLE",
    message: apiMessage ?? error.message ?? "API request failed",
    apiPath: url,
    statusCode,
    level: !statusCode || statusCode >= 500 ? "ERROR" : "WARN",
  });
}

export function reportClientRuntimeError(
  code: string,
  message: string,
  stack?: string,
): void {
  reportClientError({
    code,
    message,
    stack,
    level: "ERROR",
  });
}
