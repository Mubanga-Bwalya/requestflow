"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { devLogin, login, LoginError } from "@/lib/auth-api";
import { useAuth } from "@/lib/auth-context";
import { devLoginEnabled } from "@/lib/demo-hints";

export type LoginMode = "staff" | "dev";

type Options = {
  /** Pre-filled email for the dev-login tab (demo only). */
  defaultDevEmail?: string;
  /** Start on the dev-login tab (e.g. when demo hints are shown). */
  defaultMode?: LoginMode;
  loginErrorFallback?: string;
};

type FieldErrors = {
  gn?: string;
  email?: string;
  password?: string;
};

function validateStaff(gn: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!gn.trim()) errors.gn = "Zamtel ID (GN) is required.";
  if (!password.trim()) errors.password = "Password is required.";
  return errors;
}

function validateDev(email: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmed = email.trim();
  if (!trimmed) {
    errors.email = "Work email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    errors.email = "Enter a valid work email address.";
  }
  return errors;
}

export function useLoginPage(options: Options = {}) {
  const {
    defaultDevEmail = "",
    defaultMode = "staff",
    loginErrorFallback = "Login failed. Please try again.",
  } = options;

  const router = useRouter();
  const { state, actions } = useAuth();
  const [mode, setMode] = useState<LoginMode>(defaultMode);
  const [gn, setGn] = useState("");
  const [email, setEmail] = useState(defaultDevEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    if (mode === "dev") return email.trim().length > 0;
    return gn.trim().length > 0 && password.trim().length > 0;
  }, [mode, gn, email, password]);

  useEffect(() => {
    if (!state.sessionReady) return;
    if (state.auth.isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [state.sessionReady, state.auth.isLoggedIn, router]);

  function clearError(field: keyof FieldErrors) {
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (error) setError(null);
  }

  function onGnChange(value: string) {
    setGn(value);
    clearError("gn");
  }
  function onEmailChange(value: string) {
    setEmail(value);
    clearError("email");
  }
  function onPasswordChange(value: string) {
    setPassword(value);
    clearError("password");
  }

  function switchMode(next: LoginMode) {
    setMode(next);
    setError(null);
    setFieldErrors({});
  }

  async function onLogin() {
    setError(null);
    const nextFieldErrors =
      mode === "dev" ? validateDev(email) : validateStaff(gn, password);
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const session =
        mode === "dev"
          ? await devLogin(email.trim())
          : await login(gn.trim(), password);
      actions.setSession(session);
    } catch (e) {
      setError(e instanceof LoginError ? e.message : loginErrorFallback);
    } finally {
      setLoading(false);
    }
  }

  const showLoading = !state.sessionReady || state.auth.isLoggedIn;

  return {
    showLoading,
    mode,
    setMode: switchMode,
    devLoginEnabled,
    gn,
    setGn: onGnChange,
    email,
    setEmail: onEmailChange,
    password,
    setPassword: onPasswordChange,
    error,
    fieldErrors,
    loading,
    canSubmit,
    onLogin,
  };
}
