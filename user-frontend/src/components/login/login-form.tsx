"use client";

import { ArrowRight, IdCard, Loader2, Lock, Mail } from "lucide-react";
import type { LoginMode } from "@/hooks/use-login-page";
import { LoginIconField } from "@/components/login/login-icon-field";
import { LoginFormPanel } from "@/components/login/login-form-panel";

type Props = {
  demoHint: string | null;
  mode: LoginMode;
  devLoginEnabled: boolean;
  onModeChange: (mode: LoginMode) => void;
  gn: string;
  email: string;
  password: string;
  error: string | null;
  fieldErrors: { gn?: string; email?: string; password?: string };
  loading: boolean;
  canSubmit: boolean;
  onGnChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: () => void;
};

export function LoginForm({
  demoHint,
  mode,
  devLoginEnabled,
  onModeChange,
  gn,
  email,
  password,
  error,
  fieldErrors,
  loading,
  canSubmit,
  onGnChange,
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
      {devLoginEnabled ? (
        <div className="flex rounded-control border border-zamtel-border p-1 text-sm">
          <button
            type="button"
            onClick={() => onModeChange("staff")}
            className={`flex-1 rounded-[10px] px-3 py-1.5 font-medium transition ${
              mode === "staff" ? "bg-zamtel-green text-white" : "text-zamtel-muted"
            }`}
          >
            Staff sign-in
          </button>
          <button
            type="button"
            onClick={() => onModeChange("dev")}
            className={`flex-1 rounded-[10px] px-3 py-1.5 font-medium transition ${
              mode === "dev" ? "bg-zamtel-green text-white" : "text-zamtel-muted"
            }`}
          >
            Developer
          </button>
        </div>
      ) : null}

      {demoHint && mode === "dev" ? (
        <p className="text-center text-xs text-zamtel-muted">{demoHint}</p>
      ) : null}

      {error ? (
        <div className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {mode === "staff" ? (
          <>
            <LoginIconField
              id="login-gn"
              label="Zamtel ID (GN)"
              icon={IdCard}
              type="text"
              value={gn}
              placeholder="e.g. GN1234"
              autoComplete="username"
              required
              error={fieldErrors.gn}
              onChange={onGnChange}
            />
            <LoginIconField
              id="login-password"
              label="Password"
              icon={Lock}
              value={password}
              placeholder="Your Zamtel password"
              autoComplete="current-password"
              showPasswordToggle
              required
              error={fieldErrors.password}
              onChange={onPasswordChange}
            />
          </>
        ) : (
          <LoginIconField
            id="login-email"
            label="Work email"
            icon={Mail}
            type="email"
            value={email}
            placeholder="name@company.com"
            autoComplete="email"
            required
            error={fieldErrors.email}
            onChange={onEmailChange}
          />
        )}
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
