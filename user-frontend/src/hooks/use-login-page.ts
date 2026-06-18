"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { login, LoginError } from "@/lib/auth-api";
import { useAuth } from "@/lib/auth-context";

type Options = {
  defaultEmail?: string;
  requireEmailFormat?: boolean;
  loginErrorFallback?: string;
};

type FieldErrors = {
  email?: string;
  password?: string;
};

function validateFields(
  email: string,
  password: string,
  requireEmailFormat: boolean,
): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Work email is required.";
  } else if (requireEmailFormat && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = "Enter a valid work email address.";
  }

  if (!password.trim()) {
    errors.password = "Password is required.";
  }

  return errors;
}

export function useLoginPage(options: Options = {}) {
  const {
    defaultEmail = "",
    requireEmailFormat = true,
    loginErrorFallback = "Login failed. Please try again.",
  } = options;

  const router = useRouter();
  const { state, actions } = useAuth();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.trim().length > 0, [email, password]);

  useEffect(() => {
    if (!state.authReady) return;
    if (state.auth.isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [state.authReady, state.auth.isLoggedIn, router]);

  function onEmailChange(value: string) {
    setEmail(value);
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
    if (error) setError(null);
  }

  function onPasswordChange(value: string) {
    setPassword(value);
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
    if (error) setError(null);
  }

  async function onLogin() {
    setError(null);
    const nextFieldErrors = validateFields(email, password, requireEmailFormat);
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const session = await login(email.trim(), password);
      actions.setSession(session);
    } catch (e) {
      setError(e instanceof LoginError ? e.message : loginErrorFallback);
    } finally {
      setLoading(false);
    }
  }

  const showLoading = !state.authReady || state.auth.isLoggedIn;

  return {
    showLoading,
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
