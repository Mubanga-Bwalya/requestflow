"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTablePlaceholder } from "@/components/shared/data-table-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tab, Tabs } from "@/components/ui/tabs";
import { useLocalStore } from "@/lib/local-store";
import type { RequestStatus } from "@/types/request";

export default function Page() {
  const { state } = useLocalStore();
  const [tab, setTab] = useState<"ALL" | RequestStatus>("ALL");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.requests
      .filter((r) => (tab === "ALL" ? true : r.status === tab))
      .filter((r) => {
        if (!query) return true;
        return (
          r.title.toLowerCase().includes(query) ||
          r.requestNumber.toLowerCase().includes(query) ||
          r.requestType.toLowerCase().includes(query)
        );
      })
      .map((r) => ({ ...r, progress: `${r.progress}%` }));
  }, [q, state.requests, tab]);

  return (
    <AppShell title="My Requests">
      <PageHeader title="My Requests" description="Track requests you submitted and actions required from you." />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[min(420px,100%)]">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by request #, title, or type..." />
            </div>
          </div>
          <Link href="/requests/create">
            <Button>Create Request</Button>
          </Link>
        </div>

        <Tabs>
          <Tab active={tab === "ALL"} onClick={() => setTab("ALL")}>
            All
          </Tab>
          <Tab active={tab === "SUBMITTED"} onClick={() => setTab("SUBMITTED")}>
            Submitted
          </Tab>
          <Tab active={tab === "NEEDS_INFORMATION"} onClick={() => setTab("NEEDS_INFORMATION")}>
            Needs Information
          </Tab>
          <Tab active={tab === "IN_PROGRESS"} onClick={() => setTab("IN_PROGRESS")}>
            In Progress
          </Tab>
          <Tab active={tab === "COMPLETED"} onClick={() => setTab("COMPLETED")}>
            Completed
          </Tab>
          <Tab active={tab === "APPROVED"} onClick={() => setTab("APPROVED")}>
            Approved
          </Tab>
          <Tab active={tab === "REOPENED"} onClick={() => setTab("REOPENED")}>
            Reopened
          </Tab>
          <Tab active={tab === "REJECTED"} onClick={() => setTab("REJECTED")}>
            Rejected
          </Tab>
        </Tabs>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <p>
                Showing <span className="font-medium text-brand-dark">{filtered.length}</span> request(s)
              </p>
              {q.trim() ? (
                <button className="text-brand-primary hover:underline" onClick={() => setQ("")} type="button">
                  Clear search
                </button>
              ) : null}
            </div>

            {filtered.length ? (
              <DataTablePlaceholder
                columns={[
                  { key: "requestNumber", label: "Request #" },
                  { key: "title", label: "Title" },
                  { key: "department", label: "Department" },
                  { key: "requestType", label: "Request Type" },
                  { key: "status", label: "Status" },
                  { key: "progress", label: "Progress" },
                  { key: "deadline", label: "Deadline" },
                  { key: "actionNeeded", label: "Action Needed" },
                  { key: "__view", label: "" },
                ]}
                rows={filtered.map((r) => ({
                  ...r,
                  actionNeeded: r.actionNeeded === "None" ? "" : r.actionNeeded,
                  __view: (
                    <Link href={`/requests/${r.id}`} className="text-brand-primary hover:underline">
                      View
                    </Link>
                  ) as any,
                }))}
              />
            ) : (
              <div className="rounded-md border border-brand-dark/10 bg-brand-primary/5 p-6">
                <p className="text-sm font-semibold text-brand-dark">No requests match your filters.</p>
                <p className="mt-1 text-sm text-slate-600">Try another status tab or clear your search.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
