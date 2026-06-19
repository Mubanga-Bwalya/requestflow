"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { useAuth } from "@/lib/auth-context";

export function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    if (!state.sessionReady) return;
    if (!state.auth.isLoggedIn) {
      router.replace("/login");
    }
  }, [state.sessionReady, state.auth.isLoggedIn, router]);

  if (!state.sessionReady) {
    return <LoadingScreen />;
  }

  if (!state.auth.isLoggedIn) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
