"use client";

/** JWT session + UI preferences; domain data comes from the API. */

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { fetchCurrentUser } from "@/lib/auth-api";
import { formatDisplayRole } from "@/lib/role-utils";
import { invalidateApiCache } from "@/lib/query-cache";
import { clearSession, loadSession, saveSession, type AppSession } from "@/lib/session";
import { SESSION_EXPIRED_EVENT } from "@/lib/session-events";

export type UserProfile = {
  displayName: string;
  role: string;
  email?: string;
  avatarDataUrl?: string;
};

export type AccessibilitySettings = {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
};

type AuthState = {
  isLoggedIn: boolean;
  userId?: string;
  email?: string;
  role?: string;
  departmentName?: string | null;
  inboxDepartmentName?: string | null;
  managedDepartmentNames?: string[];
};

type State = {
  auth: AuthState;
  authReady: boolean;
  profile: UserProfile;
  accessibility: AccessibilitySettings;
};

type Action =
  | { type: "SET_SESSION"; payload: AppSession }
  | { type: "LOGOUT" }
  | { type: "AUTH_READY" }
  | { type: "SET_AVATAR"; payload: { avatarDataUrl?: string } }
  | { type: "SET_ACCESSIBILITY"; payload: Partial<AccessibilitySettings> };

function sessionToAuth(session: AppSession): AuthState {
  return {
    isLoggedIn: true,
    userId: session.userId,
    email: session.email,
    role: session.roleName ?? undefined,
    departmentName: session.departmentName,
    inboxDepartmentName: session.inboxDepartmentName ?? null,
    managedDepartmentNames: session.managedDepartmentNames ?? [],
  };
}

function sessionToProfile(session: AppSession): UserProfile {
  return {
    displayName: session.fullName,
    role: formatDisplayRole(session.roleName, session.jobTitle),
    email: session.email,
  };
}

function buildInitialState(): State {
  const stored = typeof window !== "undefined" ? loadSession() : null;
  if (stored) {
    return {
      auth: sessionToAuth(stored),
      authReady: true,
      profile: sessionToProfile(stored),
      accessibility: { largeText: false, highContrast: false, reduceMotion: false },
    };
  }
  return {
    auth: { isLoggedIn: false },
    authReady: false,
    profile: { displayName: "Guest", role: "Employee" },
    accessibility: { largeText: false, highContrast: false, reduceMotion: false },
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_SESSION": {
      saveSession(action.payload);
      invalidateApiCache();
      return {
        ...state,
        auth: sessionToAuth(action.payload),
        profile: sessionToProfile(action.payload),
      };
    }
    case "LOGOUT": {
      clearSession();
      invalidateApiCache();
      return {
        ...state,
        auth: { isLoggedIn: false },
        profile: { displayName: "Guest", role: "Employee" },
      };
    }
    case "AUTH_READY":
      return { ...state, authReady: true };
    case "SET_AVATAR":
      return { ...state, profile: { ...state.profile, avatarDataUrl: action.payload.avatarDataUrl } };
    case "SET_ACCESSIBILITY":
      return { ...state, accessibility: { ...state.accessibility, ...action.payload } };
    default:
      return state;
  }
}

type Store = {
  state: State;
  actions: {
    setSession: (session: AppSession) => void;
    logout: () => void;
    setAvatar: (avatarDataUrl?: string) => void;
    updateAccessibility: (patch: Partial<AccessibilitySettings>) => void;
  };
};

const Ctx = createContext<Store | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const stored = loadSession();
      if (stored) {
        try {
          const refreshed = await fetchCurrentUser();
          if (!cancelled && refreshed) {
            dispatch({ type: "SET_SESSION", payload: refreshed });
          }
        } catch {
          if (!cancelled) dispatch({ type: "LOGOUT" });
        }
        return;
      }
      if (!cancelled) dispatch({ type: "AUTH_READY" });
    }

    void bootstrap();

    const onExpired = () => dispatch({ type: "LOGOUT" });
    const onStorage = (e: StorageEvent) => {
      if (e.key === "requestflow_session" && !e.newValue) dispatch({ type: "LOGOUT" });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const store = useMemo<Store>(() => {
    return {
      state,
      actions: {
        setSession: (session) => dispatch({ type: "SET_SESSION", payload: session }),
        logout: () => dispatch({ type: "LOGOUT" }),
        setAvatar: (avatarDataUrl) => dispatch({ type: "SET_AVATAR", payload: { avatarDataUrl } }),
        updateAccessibility: (patch) => dispatch({ type: "SET_ACCESSIBILITY", payload: patch }),
      },
    };
  }, [state]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireUserId(): string | null {
  const { state } = useAuth();
  return state.auth.userId ?? null;
}
