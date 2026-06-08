"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const PATH_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/requests": "My Requests",
  "/requests/create": "Create Request",
  "/tasks": "My Assigned Tasks",
  "/department-inbox": "Incoming requests",
  "/settings": "Settings",
};

function titleFromPath(pathname: string): string {
  if (PATH_TITLES[pathname]) return PATH_TITLES[pathname]!;
  if (pathname.startsWith("/requests/")) return "Request details";
  if (pathname.startsWith("/tasks/")) return "Task details";
  return "RequestFlow";
}

type ShellTitleContextValue = {
  title: string;
  setTitle: (title: string | null) => void;
};

const ShellTitleContext = createContext<ShellTitleContextValue | null>(null);

export function ShellTitleProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [override, setOverride] = useState<string | null>(null);

  const title = override ?? titleFromPath(pathname);

  const value = useMemo(
    () => ({
      title,
      setTitle: setOverride,
    }),
    [title],
  );

  return <ShellTitleContext.Provider value={value}>{children}</ShellTitleContext.Provider>;
}

/** Override the shell header title for the current page. */
export function usePageTitle(title: string) {
  const ctx = useContext(ShellTitleContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setTitle(title);
    return () => ctx.setTitle(null);
  }, [ctx, title]);
}

export function useShellTitle(): string {
  const ctx = useContext(ShellTitleContext);
  return ctx?.title ?? "RequestFlow";
}
