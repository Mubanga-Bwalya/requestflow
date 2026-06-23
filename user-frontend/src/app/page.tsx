"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    if (!state.sessionReady) return;
    router.replace(state.auth.isLoggedIn ? "/dashboard" : "/login");
  }, [state.sessionReady, state.auth.isLoggedIn, router]);

  return <LoadingScreen />;
}
