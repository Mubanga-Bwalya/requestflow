export type AppSession = {
  accessToken: string;
  expiresAt: number;
  userId: string;
  email: string;
  fullName: string;
  roleName: string | null;
};

const KEY = "requestflow_admin_session";

export function isSessionExpired(session: AppSession): boolean {
  return Date.now() >= session.expiresAt - 30_000;
}

export function getAccessToken(): string | null {
  const session = loadSession();
  return session?.accessToken ?? null;
}

export function saveSession(session: AppSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function loadSession(): AppSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as AppSession;
    if (!session.accessToken || isSessionExpired(session)) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
