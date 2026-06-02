"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTablePlaceholder } from "@/components/shared/data-table-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocalStore } from "@/lib/local-store";

export function DashboardClient() {
  const { state } = useLocalStore();

  const summary = useMemo(
    () => [
      { label: "My Requests", value: state.requests.length },
      { label: "My Assigned Work", value: state.assignments.length },
      {
        label: "Needs My Information",
        value: state.requests.filter((r) => r.status === "NEEDS_INFORMATION").length,
      },
      { label: "Completed Requests", value: state.requests.filter((r) => r.status === "COMPLETED" || r.status === "APPROVED").length },
    ],
    [state.assignments.length, state.requests],
  );

  const recentRows = useMemo(() => {
    return state.requests.slice(0, 5).map((r) => ({
      requestNumber: r.requestNumber,
      title: r.title,
      status: r.status,
      updated: "Just now",
      __view: (
        <Link href={`/requests/${r.id}`} className="text-brand-primary hover:underline">
          View
        </Link>
      ) as unknown as string,
    }));
  }, [state.requests]);

  return (
    <AppShell title="User Dashboard">
      <PageHeader title="User Dashboard" description="Overview of your requests, assignments, and immediate actions." />
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <Card key={item.label} className="relative overflow-hidden">
              <div className="absolute left-0 top-0 h-1 w-full bg-brand-primary" aria-hidden />
              <CardContent>
                <p className="text-sm text-slate-600">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-brand-dark">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent>
            <p className="mb-3 text-sm font-semibold text-brand-dark">Recent Request Updates</p>
            {recentRows.length ? (
              <DataTablePlaceholder
                columns={[
                  { key: "requestNumber", label: "Request #" },
                  { key: "title", label: "Title" },
                  { key: "status", label: "Status" },
                  { key: "updated", label: "Updated" },
                  { key: "__view", label: "" },
                ]}
                rows={recentRows}
              />
            ) : (
              <p className="text-sm text-slate-600">No requests yet. Create your first request below.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="mb-3 text-sm font-semibold text-brand-dark">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/requests/create?department=Marketing">
                <Button>Create Marketing Request</Button>
              </Link>
              <Link href="/requests/create?department=HR">
                <Button variant="outline">Create HR Request</Button>
              </Link>
              <Link href="/requests">
                <Button variant="outline">View My Requests</Button>
              </Link>
              <Link href="/tasks">
                <Button variant="outline">View My Assigned Tasks</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
