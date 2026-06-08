"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { DataTable, type DataTableRow } from "@/components/shared/data-table";
import { TableOpenLink } from "@/components/shared/table-open-link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tab, Tabs } from "@/components/ui/tabs";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useAuth } from "@/lib/auth-context";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { fetchMyAssignments } from "@/lib/assignments-api";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { peekApiCache } from "@/lib/query-cache";
import type { Assignment } from "@/types/task";
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
  const [result, setResult] = useState({ items: [] as Assignment[], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<ListTabBucket>("ALL");
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 300);

  useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "NEEDS_ACTION" || t === "IN_PROGRESS" || t === "DONE" || t === "ALL") {
      setTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [tab, debouncedQ]);

  useEffect(() => {
    if (!state.auth.userId) {
      setResult({ items: [], total: 0, page: 1, totalPages: 1 });
      setLoading(false);
      return;
    }
    const cacheKey = `assignments:mine:${tab}:${debouncedQ}:${page}:${LIST_PAGE_SIZE}`;
    const cached = peekApiCache<typeof result>(cacheKey);
    if (cached) {
      setResult(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const controller = new AbortController();
    fetchMyAssignments({ page, limit: LIST_PAGE_SIZE, tab, q: debouncedQ || undefined }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult(data);
      })
      .catch(() => {
        if (!cached && !controller.signal.aborted) {
          setResult({ items: [], total: 0, page: 1, totalPages: 1 });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [state.auth.userId, page, tab, debouncedQ]);

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
        __view: <TableOpenLink href={`/tasks/${a.id}`} />,
      })),
    [result.items],
  );

  const showingCount = q.trim() ? rows.length : result.total;

  return (
    <>
      <PageHeader
        title="My Assigned Tasks"
        description="Work your manager assigned to you from Incoming requests. Open a task to update milestones and progress."
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

        <Card>
          <CardContent className="space-y-3">
            {loading ? (
              <p className="text-sm text-slate-600">Loading tasks…</p>
            ) : rows.length ? (
              <>
                <DataTable
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
