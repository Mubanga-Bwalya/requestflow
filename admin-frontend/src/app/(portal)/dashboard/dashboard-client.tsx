"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { peekApiCache } from "@/lib/query-cache";
import {
  fetchAdminDashboard,
  fetchAdminSystemEvents,
  type ActivityItem,
  type AdminDashboardResponse,
  type DashboardSummaryItem,
  type SystemEventItem,
} from "@/lib/admin-api";
import { formatRelativeTime } from "@/lib/utils";

export function AdminDashboardClient() {
  const [summary, setSummary] = useState<DashboardSummaryItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemEventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const cacheKey = "admin:dashboard:10";
    const cached = peekApiCache<AdminDashboardResponse>(cacheKey);
    if (cached) {
      setSummary(cached.summary);
      setActivity(cached.activity ?? []);
      setLoading(false);
    } else {
      setLoading(true);
    }

    Promise.all([fetchAdminDashboard(10), fetchAdminSystemEvents({ page: 1, limit: 12 })])
      .then(([dash, events]) => {
        if (cancelled) return;
        setSummary(dash.summary);
        setActivity(dash.activity ?? []);
        setSystemEvents(events.items);
      })
      .catch(() => {
        if (cancelled || cached) return;
        setSummary([]);
        setActivity([]);
        setSystemEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="System-level overview of RequestFlow configuration and request health."
        actions={
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/users">Users</ButtonLink>
            <ButtonLink href="/templates">Templates</ButtonLink>
          </div>
        }
      />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }, (_, i) => (
                <Card key={`dashboard-skeleton-${i}`} className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-1 w-full bg-brand-primary" aria-hidden />
                  <CardContent>
                    <p className="text-sm text-muted">…</p>
                    <p className="mt-2 text-2xl font-semibold text-brand-dark">…</p>
                  </CardContent>
                </Card>
              ))
            : summary.map((item) => (
                <Card key={item.label} className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-1 w-full bg-brand-primary" aria-hidden />
                  <CardContent>
                    <p className="text-sm text-muted">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-brand-dark">{item.value}</p>
                  </CardContent>
                </Card>
              ))}
        </div>

        <Card className="hidden md:block">
          <CardContent className="py-4">
            <p className="text-sm font-bold text-brand-dark">Shortcuts</p>
            <div className="mt-3 flex flex-col gap-2">
              <ButtonLink href="/users" variant="outline" className="w-full justify-start">
                Manage Users
              </ButtonLink>
              <ButtonLink href="/departments" variant="outline" className="w-full justify-start">
                Departments
              </ButtonLink>
              <ButtonLink href="/templates" variant="outline" className="w-full justify-start">
                Templates
              </ButtonLink>
              <ButtonLink href="/reports" variant="outline" className="w-full justify-start">
                Reports
              </ButtonLink>
              <ButtonLink href="/logs" variant="outline" className="w-full justify-start">
                System Logs
              </ButtonLink>
              <ButtonLink href="/settings" variant="outline" className="w-full justify-start">
                Settings
              </ButtonLink>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-brand-dark">System health (errors)</p>
              <Link href="/logs" className="rf-text-link inline-flex items-center gap-1 text-xs">
                View all logs
                <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
            </div>
            <p className="mt-1 text-xs text-muted">
              Recent server failures. Apply <code className="text-xs">008_system_events.sql</code> if empty.
            </p>
            {loading ? (
              <p className="mt-3 text-sm text-muted">Loading…</p>
            ) : systemEvents.length ? (
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {systemEvents.map((ev) => (
                  <li
                    key={ev.id}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      ev.level === "ERROR"
                        ? "border-red-200 bg-red-50 text-red-900"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    }`}
                  >
                    <p className="break-words font-medium">
                      {ev.code}
                      {ev.statusCode ? ` (${ev.statusCode})` : ""}
                      {ev.requestId ? ` · ${ev.requestId}` : ""}
                    </p>
                    <p className="mt-0.5 break-words text-xs opacity-90">{ev.message}</p>
                    <p className="mt-1 break-all text-xs opacity-75">
                      {ev.httpMethod ?? "—"} {ev.path ?? ""} · {formatRelativeTime(ev.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">No system errors recorded.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <p className="text-sm font-bold text-brand-dark">Recent Activity</p>
            {loading ? (
              <p className="mt-3 text-sm text-muted">Loading…</p>
            ) : activity.length ? (
              <ul className="mt-3 space-y-3 border-l-2 border-brand-primary/20 pl-4">
                {activity.map((a) => (
                  <li key={a.id} className="relative">
                    <div
                      className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-primary ring-4 ring-brand-primary/10"
                      aria-hidden
                    />
                    <p className="text-sm text-zamtel-text">
                      {a.description}
                      {a.requestNumber ? ` (${a.requestNumber})` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{formatRelativeTime(a.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">No activity logged yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
