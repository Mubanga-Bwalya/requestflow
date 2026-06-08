"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { peekApiCache } from "@/lib/query-cache";
import { fetchSettings } from "@/lib/settings-api";

export function AdminHeader({ title, onMenuOpen }: { title: string; onMenuOpen?: () => void }) {
  const router = useRouter();
  const { state, actions } = useAuth();
  const cachedName = peekApiCache<{ systemName: string }>("settings:system")?.systemName;
  const [systemName, setSystemName] = useState(cachedName ?? "RequestFlow");

  useEffect(() => {
    const cached = peekApiCache<{ systemName: string }>("settings:system");
    if (cached) setSystemName(cached.systemName);
    fetchSettings()
      .then((s) => setSystemName(s.systemName))
      .catch(() => setSystemName(cached?.systemName ?? "RequestFlow"));
  }, []);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-brand-dark/10 bg-white px-4 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {onMenuOpen ? (
          <button
            type="button"
            className="rf-clickable-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-brand-dark md:hidden"
            aria-label="Open navigation menu"
            onClick={onMenuOpen}
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-brand-dark">{title}</h1>
          <p className="text-xs text-zamtel-muted">{systemName} Admin</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-right text-sm">
        <div className="hidden sm:block">
          <p className="font-medium text-brand-dark">{state.auth.fullName ?? "Admin"}</p>
          <p className="text-xs text-zamtel-muted">{state.auth.roleName ?? "Admin"}</p>
        </div>
        <Button
          size="compact"
          variant="outline"
          aria-label="Log out"
          onClick={() => {
            actions.logout();
            router.push("/login");
          }}
        >
          Log out
        </Button>
      </div>
    </header>
  );
}
