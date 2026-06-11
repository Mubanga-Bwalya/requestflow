"use client";

import Link from "next/link";
import { memo, Suspense, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ClipboardList, FilePlus, Inbox, LayoutDashboard, List } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { hasManagerInbox } from "@/lib/role-utils";

const myWorkItems = [
  { label: "Dashboard", href: "/dashboard", hint: "Overview and next steps", icon: LayoutDashboard },
  { label: "Create Request", href: "/requests/create", hint: "Submit to a department", icon: FilePlus },
  { label: "My Requests", href: "/requests", hint: "Requests you submitted", icon: List },
  { label: "My Assigned Tasks", href: "/tasks", hint: "Work assigned to you", icon: ClipboardList },
] as const;

const managerItem = {
  label: "Incoming requests",
  href: "/department-inbox",
  hint: "Review and assign for your team",
  icon: Inbox,
} as const;

function isRequestDetailPath(pathname: string): boolean {
  return pathname.startsWith("/requests/") && pathname !== "/requests/create";
}

function resolveActiveHref(
  pathname: string,
  hrefs: string[],
  from: string | null,
): string | null {
  if (isRequestDetailPath(pathname)) {
    if (from === "tasks") return "/tasks";
    if (from === "inbox") return "/department-inbox";
  }

  const matches = hrefs.filter((href) => pathname === href || pathname.startsWith(`${href}/`));
  if (!matches.length) return null;
  return matches.sort((a, b) => b.length - a.length)[0]!;
}

type NavLinkProps = {
  label: string;
  href: string;
  hint?: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onNavigate?: () => void;
};

const NavLink = memo(function NavLink({ label, href, hint, icon: Icon, active, onNavigate }: NavLinkProps) {
  return (
    <Link
      href={href}
      title={hint}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rf-nav-link rf-nav-link-active block min-h-11 rounded-control px-3 py-2.5"
          : "rf-nav-link block min-h-11 rounded-control px-3 py-2.5"
      }
      onClick={onNavigate}
    >
      <span className="flex items-center gap-2.5 text-sm font-medium text-white">
        <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        {label}
      </span>
      {hint ? (
        <span className="mt-0.5 block pl-[26px] text-[11px] leading-snug text-white/55">{hint}</span>
      ) : null}
    </Link>
  );
});

type Props = { onNavigate?: () => void };

const SidebarNavContent = memo(function SidebarNavContent({
  onNavigate,
  activeHref,
  isManager,
}: Props & { activeHref: string | null; isManager: boolean }) {
  return (
    <nav className="space-y-5">
      <div>
        <p className="mb-2.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">My work</p>
        <div className="space-y-1.5">
          {myWorkItems.map(({ label, href, hint, icon }) => (
            <NavLink
              key={href}
              label={label}
              href={href}
              hint={hint}
              icon={icon}
              active={href === activeHref}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>

      {isManager ? (
        <div>
          <p className="mb-2.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-white/50">
            Managing my team
          </p>
          <div className="space-y-1.5">
            <NavLink
              label={managerItem.label}
              href={managerItem.href}
              hint={managerItem.hint}
              icon={managerItem.icon}
              active={managerItem.href === activeHref}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      ) : null}
    </nav>
  );
});

const SidebarNavInner = memo(function SidebarNavInner({ onNavigate }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useAuth();
  const isManager = hasManagerInbox(state.auth);

  const navHrefs = useMemo((): string[] => {
    const hrefs: string[] = myWorkItems.map((i) => i.href);
    if (isManager) hrefs.push(managerItem.href);
    return hrefs;
  }, [isManager]);

  const activeHref = resolveActiveHref(pathname, navHrefs, searchParams.get("from"));

  return <SidebarNavContent onNavigate={onNavigate} activeHref={activeHref} isManager={isManager} />;
});

const SidebarNavFallback = memo(function SidebarNavFallback({ onNavigate }: Props) {
  const pathname = usePathname();
  const { state } = useAuth();
  const isManager = hasManagerInbox(state.auth);

  const navHrefs = useMemo((): string[] => {
    const hrefs: string[] = myWorkItems.map((i) => i.href);
    if (isManager) hrefs.push(managerItem.href);
    return hrefs;
  }, [isManager]);

  const activeHref = resolveActiveHref(pathname, navHrefs, null);

  return <SidebarNavContent onNavigate={onNavigate} activeHref={activeHref} isManager={isManager} />;
});

export const SidebarNav = memo(function SidebarNav(props: Props) {
  return (
    <Suspense fallback={<SidebarNavFallback {...props} />}>
      <SidebarNavInner {...props} />
    </Suspense>
  );
});
