"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { isAdminRole } from "@/lib/admin-role";

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { state, actions } = useAuth();
  const isAdmin = isAdminRole(state.auth.roleName);

  useEffect(() => {
    if (!state.authReady) return;
    if (!state.auth.isLoggedIn) {
      router.replace("/login");
    }
  }, [state.authReady, state.auth.isLoggedIn, router]);

  if (!state.auth.isLoggedIn) {
    if (!state.authReady) {
      return <LoadingScreen />;
    }
    return <LoadingScreen />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="text-xl font-bold text-brand-dark">Admin access required</h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          You are signed in as {state.auth.email ?? "a user"}
          {state.auth.roleName ? ` (${state.auth.roleName})` : ""}. This portal is for administrators only.
          Use the user portal for day-to-day requests and tasks.
        </p>
        <Button className="mt-4" type="button" onClick={() => actions.logout()}>
          Sign out
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
