import { ClipboardList, FilePlus, Inbox, List, type LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { TableOpenLink } from "@/components/shared/table-open-link";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatRelativeTime } from "@/lib/utils";
import type { RequestItem } from "@/types/request";

type Shortcut = { href: string; label: string; icon: LucideIcon };

export function DashboardShortcuts({ isManager }: { isManager: boolean }) {
  const shortcuts: Shortcut[] = [
    { href: "/requests/create", label: "Create request", icon: FilePlus },
    { href: "/requests", label: "My requests", icon: List },
    { href: "/tasks", label: "My tasks", icon: ClipboardList },
    ...(isManager ? [{ href: "/department-inbox", label: "Incoming requests", icon: Inbox }] : []),
  ];

  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-sm font-bold text-brand-dark">Shortcuts</p>
        <p className="mt-1 text-xs text-zamtel-muted">Quick links to common actions</p>
        <div className="mt-4 grid gap-2">
          {shortcuts.map(({ href, label, icon: Icon }) => (
            <ButtonLink
              key={href}
              href={href}
              variant="outline"
              className="h-auto min-h-11 w-full justify-start gap-3 px-4 py-2.5 text-left font-semibold"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              {label}
            </ButtonLink>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardRecentRequests({ requests }: { requests: RequestItem[] }) {
  if (!requests.length) return null;

  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-brand-dark">Latest requests</p>
          <ButtonLink href="/requests" size="compact" variant="outline">
            View all
          </ButtonLink>
        </div>
        <ul className="mt-4 space-y-2">
          {requests.map((r) => (
            <li
              key={r.id}
              className="rf-clickable flex flex-col gap-3 rounded-control border border-zamtel-border bg-white px-3 py-3 hover:border-brand-primary/25 hover:bg-brand-primary/[0.03] hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-dark">{r.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zamtel-muted">{r.requestNumber}</span>
                  <StatusBadge status={r.status} />
                  {r.updatedAt ? (
                    <span className="text-xs text-zamtel-muted">{formatRelativeTime(r.updatedAt)}</span>
                  ) : null}
                </div>
              </div>
              <TableOpenLink href={`/requests/${r.id}`} className="w-full sm:w-auto" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
