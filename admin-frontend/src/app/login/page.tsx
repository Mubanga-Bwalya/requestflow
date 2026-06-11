"use client";

import { LoadingScreen } from "@/components/shared/loading-screen";
import { LoginForm } from "@/components/login/login-form";
import { LoginShell } from "@/components/login/login-shell";
import { useLoginPage } from "@/hooks/use-login-page";
import {
  adminLoginDemoEmail,
  adminLoginDemoHint,
  showDemoHints,
} from "@/lib/demo-hints";

export default function Page() {
  const login = useLoginPage({
    defaultEmail: showDemoHints ? adminLoginDemoEmail : "",
  });

  if (login.showLoading) {
    return <LoadingScreen variant="dark" />;
  }

  return (
    <LoginShell>
      <LoginForm
        demoHint={showDemoHints ? adminLoginDemoHint : null}
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
