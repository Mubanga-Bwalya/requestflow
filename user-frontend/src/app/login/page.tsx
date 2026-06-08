"use client";

import { LoadingScreen } from "@/components/shared/loading-screen";
import { LoginForm } from "@/components/login/login-form";
import { LoginShell } from "@/components/login/login-shell";
import { useLoginPage } from "@/hooks/use-login-page";

const SHOW_DEMO_HINT = process.env.NEXT_PUBLIC_SHOW_DEMO_HINTS === "true";
const DEMO_HINT = "Demo account: jane@requestflow.local — password: requestflow";

export default function Page() {
  const login = useLoginPage();

  if (login.showLoading) {
    return <LoadingScreen variant="dark" />;
  }

  return (
    <LoginShell>
      <LoginForm
        demoHint={SHOW_DEMO_HINT ? DEMO_HINT : null}
        email={login.email}
        password={login.password}
        error={login.error}
        fieldErrors={login.fieldErrors}
        loading={login.loading}
        canSubmit={login.canSubmit}
        onEmailChange={login.setEmail}
        onPasswordChange={login.setPassword}
        onSubmit={() => void login.onLogin()}
      />
    </LoginShell>
  );
}
