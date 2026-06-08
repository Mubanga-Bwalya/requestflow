"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { useAuth } from "@/lib/auth-context";

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    if (!state.authReady) return;
    if (!state.auth.isLoggedIn) {
      router.replace("/login");
    }
  }, [state.authReady, state.auth.isLoggedIn, router]);

  if (!state.authReady || !state.auth.isLoggedIn) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}
