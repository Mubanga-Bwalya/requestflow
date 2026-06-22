import axios from "axios";
import { apiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/api";
import { loadSession, type AppSession } from "@/lib/session";

type ApiUser = {
  id: string;
  fullName: string;
  email: string;
  roleName: string | null;
};

type LoginResponse = {
  user: ApiUser;
  accessToken: string;
  expiresIn: number;
};

function toSession(data: LoginResponse): AppSession {
  return {
    accessToken: data.accessToken,
    expiresAt: Date.now() + data.expiresIn * 1000,
    userId: data.user.id,
    email: data.user.email,
    fullName: data.user.fullName,
    roleName: data.user.roleName,
  };
}

export class LoginError extends Error {
  readonly code: "INVALID" | "NOT_ADMIN" | "UNAVAILABLE";

  constructor(message: string, code: "INVALID" | "NOT_ADMIN" | "UNAVAILABLE") {
    super(message);
    this.name = "LoginError";
    this.code = code;
  }
}

function mapLoginError(e: unknown): LoginError {
  if (axios.isAxiosError(e)) {
    if (e.response?.status === 403) {
      return new LoginError("Admin access required. Use an Admin account.", "NOT_ADMIN");
    }
    if (e.response?.status === 401) {
      return new LoginError("Invalid Zamtel ID or password.", "INVALID");
    }
    if (e.response?.status === 503) {
      return new LoginError("Zamtel sign-in service is unavailable. Try again shortly.", "UNAVAILABLE");
    }
  }
  return new LoginError(
    apiErrorMessage(e, "Login failed. Check your credentials and ensure the API is running."),
    "INVALID",
  );
}

/** Zamtel staff login for the admin portal — GN + AD password; admin role enforced server-side. */
export async function login(gn: string, password: string): Promise<AppSession> {
  try {
    const { data } = await api.post<LoginResponse>(
      "/auth/login",
      { gn: gn.trim(), password },
      { params: { adminOnly: true } },
    );
    return toSession(data);
  } catch (e) {
    throw mapLoginError(e);
  }
}

/** Dev-only login by email (no password). Disabled in production by the API. */
export async function devLogin(email: string): Promise<AppSession> {
  try {
    const { data } = await api.post<LoginResponse>(
      "/auth/dev-login",
      { email: email.trim() },
      { params: { adminOnly: true } },
    );
    return toSession(data);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 401) {
      throw new LoginError("Unknown or inactive user.", "INVALID");
    }
    throw mapLoginError(e);
  }
}

export async function fetchCurrentUser(): Promise<AppSession | null> {
  const existing = loadSession();
  if (!existing?.accessToken) return null;
  const { data } = await api.get<ApiUser>("/auth/me");
  return {
    accessToken: existing.accessToken,
    expiresAt: existing.expiresAt,
    userId: data.id,
    email: data.email,
    fullName: data.fullName,
    roleName: data.roleName,
  };
}
