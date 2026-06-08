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
  readonly code: "INVALID" | "NOT_ADMIN";

  constructor(message: string, code: "INVALID" | "NOT_ADMIN") {
    super(message);
    this.name = "LoginError";
    this.code = code;
  }
}

export async function login(email: string, password: string): Promise<AppSession> {
  try {
    const { data } = await api.post<LoginResponse>(
      "/auth/login",
      { email: email.trim(), password },
      { params: { adminOnly: true } },
    );
    return toSession(data);
  } catch (e) {
    if (axios.isAxiosError(e)) {
      if (e.response?.status === 403) {
        throw new LoginError("Admin access required. Use an Admin account.", "NOT_ADMIN");
      }
      if (e.response?.status === 401) {
        throw new LoginError("Invalid email or password.", "INVALID");
      }
    }
    throw new LoginError(
      apiErrorMessage(e, "Login failed. Check your credentials and ensure the API is running."),
      "INVALID",
    );
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
