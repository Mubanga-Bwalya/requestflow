"use client";

import { ArrowRight, Loader2, Lock, User } from "lucide-react";
import { LoginIconField } from "@/components/login/login-icon-field";
import { LoginFormPanel } from "@/components/login/login-form-panel";

type Props = {
  demoHint: string | null;
  email: string;
  password: string;
  error: string | null;
  fieldErrors: { email?: string; password?: string };
  loading: boolean;
  canSubmit: boolean;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: () => void;
};

export function LoginForm({
  demoHint,
  email,
  password,
  error,
  fieldErrors,
  loading,
  canSubmit,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: Props) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!loading) onSubmit();
  }

  return (
    <LoginFormPanel>
      {demoHint ? <p className="text-center text-xs text-zamtel-muted">{demoHint}</p> : null}

      {error ? (
        <div className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <LoginIconField
          id="login-email"
          label="Work email"
          icon={User}
          type="email"
          value={email}
          placeholder="name@company.com"
          autoComplete="email"
          required
          error={fieldErrors.email}
          onChange={onEmailChange}
        />
        <LoginIconField
          id="login-password"
          label="Password"
          icon={Lock}
          value={password}
          placeholder="Enter your password"
          autoComplete="current-password"
          showPasswordToggle
          required
          error={fieldErrors.password}
          onChange={onPasswordChange}
        />
        <button type="submit" className="rf-login-submit" disabled={!canSubmit || loading} aria-busy={loading}>
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
            </>
          )}
        </button>
      </form>
    </LoginFormPanel>
  );
}
