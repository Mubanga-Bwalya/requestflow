"use client";

import Link from "next/link";
import { ApiErrorBanner } from "@/components/shared/api-error-banner";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { Inbox } from "lucide-react";
import { DataListSkeleton, ListCountSkeleton } from "@/components/shared/skeleton";
import { TableOpenLink } from "@/components/shared/table-open-link";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tab, Tabs } from "@/components/ui/tabs";
import { useDepartmentInbox } from "@/hooks/use-department-inbox";
import { useAuth } from "@/lib/auth-context";
import { hasManagerInbox, resolveInboxDepartment } from "@/lib/role-utils";
import { LIST_TAB_LABELS } from "@/lib/request-status-groups";

const INCOMING_REQUESTS_TITLE = "Incoming requests";

export default function Page() {
  const { state } = useAuth();
  const canAccessInbox = hasManagerInbox(state.auth);
  const dept = canAccessInbox ? resolveInboxDepartment(state.auth) : null;

  const { result, loading, error, page, setPage, tab, setTab, q, setQ, tableRows, showingCount, reload } =
    useDepartmentInbox(dept, { enabled: canAccessInbox });

  if (!canAccessInbox) {
    return (
      <>
        <PageHeader
          title={INCOMING_REQUESTS_TITLE}
          description="Only appointed department managers can review incoming requests."
        />
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-600">
            Your account does not manage a department inbox. Use{" "}
            <Link href="/requests" className="font-medium text-brand-primary hover:underline">
              My Requests
            </Link>{" "}
            or{" "}
            <Link href="/tasks" className="font-medium text-brand-primary hover:underline">
              My Assigned Tasks
            </Link>{" "}
            instead.
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={INCOMING_REQUESTS_TITLE}
        description={
          dept
            ? `Requests sent to your ${dept} team. Open one to accept, assign work, ask for details, or decline.`
            : "Your profile has no managed department; contact an administrator."
        }
      />
      <div className="space-y-4">
        <Card className="border-brand-primary/20 bg-brand-primary/5">
          <CardContent className="py-4 text-sm text-slate-700">
            <p className="font-semibold text-brand-dark">How to handle a request</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>
                Open a request and choose <span className="font-medium">Accept</span>,{" "}
                <span className="font-medium">Ask for details</span>, or <span className="font-medium">Decline</span>.
              </li>
              <li>
                When ready, <span className="font-medium">Assign people</span> so they see work under My Assigned Tasks.
              </li>
              <li>When the team finishes, the requester approves the result from My Requests.</li>
            </ol>
          </CardContent>
        </Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-[min(420px,100%)]">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search inbox by request #, title, type, requester..."
            />
          </div>
          <div className="text-sm text-slate-600">
            {loading && !tableRows.length ? (
              <ListCountSkeleton />
            ) : (
              <>
                Showing <span className="font-medium text-brand-dark">{showingCount}</span> item(s)
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

        <Card className="overflow-hidden">
          <CardContent>
            {loading && !tableRows.length ? (
              <DataListSkeleton rowCount={5} columnCount={10} />
            ) : error ? null : tableRows.length === 0 ? (
              <EmptyState
                icon={Inbox}
                heading="No requests in this inbox"
                body={q.trim() ? "Try clearing your search or switching tabs." : "New requests sent to your department will appear here."}
              />
            ) : (
            <DataTable
              caption="Department incoming requests"
              columns={[
                { key: "requestNumber", label: "Request #" },
                { key: "title", label: "Title" },
                { key: "requestedBy", label: "Requested By" },
                { key: "sourceDepartment", label: "Source Department" },
                { key: "requestType", label: "Request Type" },
                { key: "priority", label: "Priority" },
                { key: "deadline", label: "Deadline" },
                { key: "status", label: "Status" },
                { key: "assignedMembers", label: "Assigned Members" },
                { key: "__view", label: "" },
              ]}
              rows={tableRows}
            />
            )}
            {!error && tableRows.length > 0 ? (
              <PaginationBar
                page={result.page}
                totalPages={result.totalPages}
                total={result.total}
                onPageChange={setPage}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
