import axios from "axios";
import { apiErrorMessage } from "@/lib/api-error";
import { api } from "@/lib/api";
import { loadSession, type AppSession } from "@/lib/session";

type ApiUser = {
  id: string;
  fullName: string;
  email: string;
  departmentName: string | null;
  inboxDepartmentName?: string | null;
  managedDepartmentNames?: string[];
  roleName: string | null;
  jobTitle?: string | null;
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
    jobTitle: data.user.jobTitle ?? null,
    departmentName: data.user.departmentName,
    inboxDepartmentName: data.user.inboxDepartmentName ?? null,
    managedDepartmentNames: data.user.managedDepartmentNames ?? [],
  };
}

export class LoginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LoginError";
  }
}

/** Zamtel staff login — GN (staff number) + AD password. */
export async function login(gn: string, password: string): Promise<AppSession> {
  try {
    const { data } = await api.post<LoginResponse>("/auth/login", {
      gn: gn.trim(),
      password,
    });
    return toSession(data);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 401) {
      throw new LoginError("Invalid Zamtel ID or password.");
    }
    if (axios.isAxiosError(e) && e.response?.status === 503) {
      throw new LoginError("Zamtel sign-in service is unavailable. Try again shortly.");
    }
    throw new LoginError(
      apiErrorMessage(e, "Login failed. Check your credentials and ensure the API is running."),
    );
  }
}

/** Dev-only login by email (no password). Disabled in production by the API. */
export async function devLogin(email: string): Promise<AppSession> {
  try {
    const { data } = await api.post<LoginResponse>("/auth/dev-login", {
      email: email.trim(),
    });
    return toSession(data);
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 401) {
      throw new LoginError("Unknown or inactive user.");
    }
    throw new LoginError(apiErrorMessage(e, "Developer sign-in failed."));
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
    jobTitle: data.jobTitle ?? null,
    departmentName: data.departmentName,
    inboxDepartmentName: data.inboxDepartmentName ?? null,
    managedDepartmentNames: data.managedDepartmentNames ?? [],
  };
}
