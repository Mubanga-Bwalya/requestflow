"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { List } from "lucide-react";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { EmptyState } from "@/components/shared/empty-state";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { DataTable, type DataTableRow } from "@/components/shared/data-table";
import { TableOpenLink } from "@/components/shared/table-open-link";
import { PageHeader } from "@/components/shared/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tab, Tabs } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { fetchMyRequests } from "@/lib/requests-api";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { peekApiCache } from "@/lib/query-cache";
import type { RequestItem } from "@/types/request";
import { LIST_TAB_LABELS, type ListTabBucket } from "@/lib/request-status-groups";

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <RequestsPageContent />
    </Suspense>
  );
}

function RequestTitleCell({ title, requestNumber }: { title: string; requestNumber: string }) {
  return (
    <div className="min-w-[140px] max-w-[280px]">
      <p className="font-semibold leading-snug text-brand-dark">{title}</p>
      <p className="mt-0.5 text-xs text-zamtel-muted">{requestNumber}</p>
    </div>
  );
}

function RequestsPageContent() {
  const searchParams = useSearchParams();
  const { state } = useAuth();
  const [result, setResult] = useState({ items: [] as RequestItem[], total: 0, page: 1, totalPages: 1 });
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
    const cacheKey = `requests:mine:${tab}:${debouncedQ}:${page}:${LIST_PAGE_SIZE}`;
    const cached = peekApiCache<typeof result>(cacheKey);
    if (cached) {
      setResult(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    const controller = new AbortController();
    fetchMyRequests({ page, limit: LIST_PAGE_SIZE, tab, q: debouncedQ || undefined }, controller.signal)
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
      result.items.map((r) => ({
        id: r.id,
        title: <RequestTitleCell title={r.title} requestNumber={r.requestNumber} />,
        department: r.department,
        requestType: r.requestType,
        status: r.status,
        progress: `${r.progress}%`,
        deadline: r.deadline || "—",
        actionNeeded: r.actionNeeded === "None" ? "" : r.actionNeeded,
        __view: <TableOpenLink href={`/requests/${r.id}`} />,
      })),
    [result.items],
  );

  const showingCount = q.trim() ? rows.length : result.total;

  return (
    <>
      <PageHeader
        title="My Requests"
        description="Requests you submitted. Open one to see status, provide missing information, or approve completed work."
      />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full min-w-0 sm:max-w-md">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by request #, title, or type..."
              aria-label="Search requests"
            />
          </div>
          <ButtonLink href="/requests/create">Start new request</ButtonLink>
        </div>

        <Tabs>
          {LIST_TAB_LABELS.map((t) => (
            <Tab
              key={t.id}
              active={tab === t.id}
              attention={t.id === "NEEDS_ACTION"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Tab>
          ))}
        </Tabs>

        <Card>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zamtel-muted">
              <p>
                {loading ? (
                  "Loading…"
                ) : (
                  <>
                    Showing <span className="font-semibold text-brand-dark">{showingCount}</span> request(s)
                  </>
                )}
              </p>
              {q.trim() ? (
                <Button size="compact" variant="outline" onClick={() => setQ("")} type="button">
                  Clear search
                </Button>
              ) : null}
            </div>

            {!loading && rows.length ? (
              <>
                <DataTable
                  columns={[
                    { key: "title", label: "Request" },
                    { key: "department", label: "Department" },
                    { key: "requestType", label: "Type" },
                    { key: "status", label: "Status" },
                    { key: "progress", label: "Progress" },
                    { key: "deadline", label: "Deadline" },
                    { key: "actionNeeded", label: "Your next step" },
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
            ) : !loading ? (
              <EmptyState
                icon={List}
                heading="No requests match your filters"
                body="Try another tab or start a new request."
                action={{ href: "/requests/create", label: "Start new request" }}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
