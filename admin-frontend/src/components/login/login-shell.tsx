import { ReactNode } from "react";
import { LoginInternalBadge } from "@/components/login/login-internal-badge";
import { LoginBrandingPanel, LoginMobileHeader } from "@/components/login/login-branding-panel";

type Props = {
  children: ReactNode;
};

export function LoginShell({ children }: Props) {
  return (
    <main className="rf-login-shell relative flex min-h-screen flex-col md:grid">
      <div className="absolute right-5 top-5 z-30 hidden md:block">
        <LoginInternalBadge />
      </div>
      <LoginMobileHeader />
      <LoginBrandingPanel />
      {children}
    </main>
  );
}
