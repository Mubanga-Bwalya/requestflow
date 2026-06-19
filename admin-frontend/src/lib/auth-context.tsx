"use client";

/** JWT session + UI preferences; domain data comes from the API. */

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import axios from "axios";
import { fetchCurrentUser } from "@/lib/auth-api";
import { invalidateApiCache } from "@/lib/query-cache";
import { clearSession, loadSession, saveSession, type AppSession } from "@/lib/session";
import { SESSION_EXPIRED_EVENT } from "@/lib/session-events";

export type AccessibilitySettings = {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
};

type AuthState = {
  isLoggedIn: boolean;
  userId?: string;
  email?: string;
  fullName?: string;
  roleName?: string | null;
};

type State = {
  auth: AuthState;
  sessionReady: boolean;
  accessibility: AccessibilitySettings;
};

type Action =
  | { type: "SET_SESSION"; payload: AppSession }
  | { type: "LOGOUT" }
  | { type: "SESSION_READY" }
  | { type: "SET_ACCESSIBILITY"; payload: Partial<AccessibilitySettings> };

function sessionToAuth(session: AppSession): AuthState {
  return {
    isLoggedIn: true,
    userId: session.userId,
    email: session.email,
    fullName: session.fullName,
    roleName: session.roleName,
  };
}

function buildInitialState(): State {
  return {
    auth: { isLoggedIn: false },
    sessionReady: false,
    accessibility: { largeText: false, highContrast: false, reduceMotion: false },
  };
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_SESSION": {
      saveSession(action.payload);
      invalidateApiCache();
      return { ...state, auth: sessionToAuth(action.payload) };
    }
    case "LOGOUT": {
      clearSession();
      invalidateApiCache();
      return { ...state, auth: { isLoggedIn: false } };
    }
    case "SESSION_READY":
      return { ...state, sessionReady: true };
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
        dispatch({ type: "SET_SESSION", payload: stored });
        try {
          const refreshed = await fetchCurrentUser();
          if (!cancelled && refreshed) {
            dispatch({ type: "SET_SESSION", payload: refreshed });
          }
        } catch (e) {
          if (!cancelled && axios.isAxiosError(e) && e.response?.status === 401) {
            dispatch({ type: "LOGOUT" });
          }
        }
      }
      if (!cancelled) dispatch({ type: "SESSION_READY" });
    }

    void bootstrap();

    const onExpired = () => dispatch({ type: "LOGOUT" });
    const onStorage = (e: StorageEvent) => {
      if (e.key === "requestflow_admin_session" && !e.newValue) dispatch({ type: "LOGOUT" });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const store = useMemo<Store>(
    () => ({
      state,
      actions: {
        setSession: (session) => dispatch({ type: "SET_SESSION", payload: session }),
        logout: () => dispatch({ type: "LOGOUT" }),
        updateAccessibility: (patch) => dispatch({ type: "SET_ACCESSIBILITY", payload: patch }),
      },
    }),
    [state],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
