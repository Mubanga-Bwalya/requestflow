"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { ApiErrorBanner } from "@/components/shared/api-error-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { DataTable, type DataTableRow } from "@/components/shared/data-table";
import { TableOpenLink } from "@/components/shared/table-open-link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tab, Tabs } from "@/components/ui/tabs";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMyAssignments } from "@/hooks/use-my-assignments";
import { useAuth } from "@/lib/auth-context";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { LIST_TAB_LABELS, statusLabel, type ListTabBucket } from "@/lib/request-status-groups";

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TasksPageContent />
    </Suspense>
  );
}

function TasksPageContent() {
  const searchParams = useSearchParams();
  const { state } = useAuth();
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<ListTabBucket>("ALL");
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const { result, loading, error, reload } = useMyAssignments(state.auth.userId, page, tab, debouncedQ);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "NEEDS_ACTION" || t === "IN_PROGRESS" || t === "DONE" || t === "ALL") {
      setTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedQ]);

  const rows: DataTableRow[] = useMemo(
    () =>
      result.items.map((a) => ({
        id: a.id,
        title: a.title,
        relatedRequest: a.relatedRequest,
        department: a.department,
        status: statusLabel(a.status),
        progress: `${a.progress}%`,
        deadline: a.deadline,
        milestones: a.milestoneCount ?? a.milestones.length,
        __view: (
          <TableOpenLink
            href={a.requestId ? `/requests/${a.requestId}?from=tasks` : `/tasks/${a.id}`}
          />
        ),
      })),
    [result.items],
  );

  const showingCount = q.trim() ? rows.length : result.total;

  return (
    <>
      <PageHeader
        title="My Assigned Tasks"
        description="Work assigned to you from Incoming requests. Open a row to manage milestones and progress on the request page."
      />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-[min(420px,100%)]">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or request #..." />
          </div>
          <div className="text-sm text-slate-600">
            {loading ? "Loading…" : (
              <>
                Showing <span className="font-medium text-brand-dark">{showingCount}</span> task(s)
              </>
            )}
          </div>
        </div>

        <Tabs>
          {LIST_TAB_LABELS.map((t) => (
            <Tab key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </Tab>
          ))}
        </Tabs>

        <ApiErrorBanner message={error} onRetry={() => void reload()} />

        <Card>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-600">Loading tasks…</p>
            ) : error ? null : rows.length ? (
              <>
                <DataTable
                  caption="My assigned tasks"
                  columns={[
                    { key: "title", label: "Task" },
                    { key: "relatedRequest", label: "Request #" },
                    { key: "department", label: "Department" },
                    { key: "status", label: "Status" },
                    { key: "progress", label: "Progress" },
                    { key: "deadline", label: "Deadline" },
                    { key: "milestones", label: "Steps" },
                    { key: "__view", label: "" },
                  ]}
                  rows={rows}
                />
                <PaginationBar
                  page={result.page}
                  totalPages={result.totalPages}
                  total={result.total}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <EmptyState
                icon={ClipboardList}
                heading="No assigned tasks yet"
                body="Tasks will appear here when your manager assigns work to you."
                secondaryBody="You can still track requests you submitted from My Requests."
                action={{ href: "/requests", label: "View my requests" }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
