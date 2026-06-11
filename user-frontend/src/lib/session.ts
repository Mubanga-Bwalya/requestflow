export type AppSession = {
  accessToken: string;
  expiresAt: number;
  userId: string;
  email: string;
  fullName: string;
  roleName: string | null;
  jobTitle?: string | null;
  departmentName: string | null;
  /** Set only when user is appointed department manager; null for non-managers. */
  inboxDepartmentName?: string | null;
  managedDepartmentNames?: string[];
};

const STORAGE_KEY = "requestflow_session";

export function isSessionExpired(session: AppSession): boolean {
  return Date.now() >= session.expiresAt - 30_000;
}

export function getAccessToken(): string | null {
  const session = loadSession();
  return session?.accessToken ?? null;
}

export function loadSession(): AppSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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

export function saveSession(session: AppSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
