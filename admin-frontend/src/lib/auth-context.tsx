"use client";

/** JWT session + UI preferences; domain data comes from the API. */

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
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
  authReady: boolean;
  accessibility: AccessibilitySettings;
};

type Action =
  | { type: "SET_SESSION"; payload: AppSession }
  | { type: "LOGOUT" }
  | { type: "AUTH_READY" }
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

/**
 * Initial state must be identical on the server and the client's first render,
 * so it must NOT read localStorage here (that runs only on the client and would
 * cause a hydration mismatch — server renders logged-out, client logged-in).
 * The stored session is hydrated after mount in AuthProvider's bootstrap effect;
 * `authReady` gates the UI until then.
 */
function buildInitialState(): State {
  return {
    auth: { isLoggedIn: false },
    authReady: false,
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
    case "AUTH_READY":
      return { ...state, authReady: true };
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
      if (!stored) {
        if (!cancelled) dispatch({ type: "AUTH_READY" });
        return;
      }

      // Hydrate from the stored session immediately (after mount, so server and
      // client first renders match), then confirm/refresh against the server.
      if (!cancelled) {
        dispatch({ type: "SET_SESSION", payload: stored });
        dispatch({ type: "AUTH_READY" });
      }

      try {
        const refreshed = await fetchCurrentUser();
        if (!cancelled && refreshed) {
          dispatch({ type: "SET_SESSION", payload: refreshed });
        }
      } catch {
        // A real 401 is handled globally by the api interceptor (it clears the
        // session and emits session-expired → LOGOUT). Transient network/5xx
        // errors are ignored here so a blip doesn't discard a valid session.
      }
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
