"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/users", icon: Users },
  { label: "Departments", href: "/departments", icon: Building2 },
  { label: "Templates", href: "/templates", icon: FileText },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "System Logs", href: "/logs", icon: ScrollText },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

function resolveActiveHref(pathname: string, hrefs: string[]): string | null {
  const matches = hrefs.filter((href) => pathname === href || pathname.startsWith(`${href}/`));
  if (!matches.length) return null;
  return matches.sort((a, b) => b.length - a.length)[0]!;
}

type NavLinkProps = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  onNavigate?: () => void;
};

const NavLink = memo(function NavLink({ label, href, icon: Icon, active, onNavigate }: NavLinkProps) {
  return (
    <Link
      href={href}
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
    </Link>
  );
});

type Props = { onNavigate?: () => void };

export const AdminSidebarNav = memo(function AdminSidebarNav({ onNavigate }: Props) {
  const pathname = usePathname();
  const navHrefs = useMemo(() => navItems.map((i) => i.href), []);
  const activeHref = resolveActiveHref(pathname, navHrefs);

  return (
    <nav className="space-y-1.5">
      {navItems.map(({ label, href, icon }) => (
        <NavLink
          key={href}
          label={label}
          href={href}
          icon={icon}
          active={href === activeHref}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
});
