"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTablePlaceholder } from "@/components/shared/data-table-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tab, Tabs } from "@/components/ui/tabs";
import { useLocalStore } from "@/lib/local-store";
import type { Assignment } from "@/types/task";

export default function Page() {
  const { state } = useLocalStore();
  const [tab, setTab] = useState<"ALL" | Assignment["status"]>("ALL");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.assignments
      .filter((a) => (tab === "ALL" ? true : a.status === tab))
      .filter((a) => {
        if (!query) return true;
        return a.title.toLowerCase().includes(query) || a.relatedRequest.toLowerCase().includes(query);
      })
      .map((a) => ({
        id: a.id,
        title: a.title,
        relatedRequest: a.relatedRequest,
        department: a.department,
        status: a.status,
        progress: `${a.progress}%`,
        deadline: a.deadline,
        milestones: a.milestones.length,
      }));
  }, [q, state.assignments, tab]);

  return (
    <AppShell title="My Assigned Tasks">
      <PageHeader title="My Assigned Tasks" description="Track assignment progress and update milestone execution." />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-[min(420px,100%)]">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assignments by title or request #..." />
          </div>
        </div>

        <Tabs>
          <Tab active={tab === "ALL"} onClick={() => setTab("ALL")}>
            All
          </Tab>
          <Tab active={tab === "ASSIGNED"} onClick={() => setTab("ASSIGNED")}>
            Assigned
          </Tab>
          <Tab active={tab === "IN_PROGRESS"} onClick={() => setTab("IN_PROGRESS")}>
            In Progress
          </Tab>
          <Tab active={tab === "READY_FOR_REVIEW"} onClick={() => setTab("READY_FOR_REVIEW")}>
            Ready for Review
          </Tab>
          <Tab active={tab === "COMPLETED"} onClick={() => setTab("COMPLETED")}>
            Completed
          </Tab>
        </Tabs>

        <Card>
          <CardContent className="space-y-3">
            {filtered.length ? (
              <DataTablePlaceholder
                columns={[
                  { key: "title", label: "Assignment Title" },
                  { key: "relatedRequest", label: "Related Request" },
                  { key: "department", label: "Department" },
                  { key: "status", label: "Status" },
                  { key: "progress", label: "Progress" },
                  { key: "deadline", label: "Deadline" },
                  { key: "milestones", label: "Milestones" },
                  { key: "__view", label: "" },
                ]}
                rows={filtered.map((a) => ({
                  ...a,
                  __view: (
                    <Link href={`/tasks/${a.id}`} className="text-brand-primary hover:underline">
                      Open
                    </Link>
                  ) as any,
                }))}
              />
            ) : (
              <div className="rounded-md border border-brand-dark/10 bg-brand-primary/5 p-6">
                <p className="text-sm font-semibold text-brand-dark">No assignments found.</p>
                <p className="mt-1 text-sm text-slate-600">Try a different status filter or clear your search.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
