"use client";

import { useEffect, useState } from "react";
import { InboxAssignDialog } from "@/components/department-inbox/inbox-assign-dialog";
import { InboxMissingInfoDialog } from "@/components/department-inbox/inbox-missing-info-dialog";
import { InboxRejectDialog } from "@/components/department-inbox/inbox-reject-dialog";
import { InboxReviewDialog } from "@/components/department-inbox/inbox-review-dialog";
import { DataTable } from "@/components/shared/data-table";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tab, Tabs } from "@/components/ui/tabs";
import { useDepartmentInbox } from "@/hooks/use-department-inbox";
import { useAuth } from "@/lib/auth-context";
import { isManagerRole } from "@/lib/role-utils";
import { LIST_TAB_LABELS } from "@/lib/request-status-groups";

const INCOMING_REQUESTS_TITLE = "Incoming requests";

export default function Page() {
  const { state } = useAuth();
  const dept = state.auth.departmentName;
  const userId = state.auth.userId;
  const isManager = isManagerRole(state.auth.role);

  const {
    result,
    loading,
    page,
    setPage,
    tab,
    setTab,
    q,
    setQ,
    selectedId,
    setSelectedId,
    selected,
    tableRows,
    showingCount,
    reload,
  } = useDepartmentInbox(dept);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [acceptSaving, setAcceptSaving] = useState(false);

  useEffect(() => {
    if (selectedId) setReviewOpen(true);
  }, [selectedId]);

  useEffect(() => {
    if (!reviewOpen && !assignOpen && !infoOpen && !rejectOpen) {
      setSelectedId(null);
    }
  }, [reviewOpen, assignOpen, infoOpen, rejectOpen, setSelectedId]);

  if (!isManager) {
    return (
      <>
        <PageHeader
          title={INCOMING_REQUESTS_TITLE}
          description="Only managers can review incoming requests for their department."
        />
        <Card>
          <CardContent className="py-8 text-center text-sm text-slate-600">
            Your account is not a manager. Use <span className="font-medium">My Requests</span> or{" "}
            <span className="font-medium">My Assigned Tasks</span> instead.
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
            : "Your profile has no department; contact an administrator."
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
            {loading ? (
              "Loading…"
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
        <Card className="overflow-hidden">
          <CardContent>
            <DataTable
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
                { key: "__actions", label: "" },
              ]}
              rows={tableRows}
            />
            <PaginationBar
              page={result.page}
              totalPages={result.totalPages}
              total={result.total}
              onPageChange={setPage}
            />
            <div className="mt-4 rounded-md border border-brand-dark/10 bg-brand-primary/5 p-3 text-sm text-slate-700">
              Select <span className="font-medium text-brand-dark">Manage</span> on a row to choose what happens next.
            </div>
          </CardContent>
        </Card>
      </div>

      <InboxReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        selected={selected}
        userId={userId}
        acceptSaving={acceptSaving}
        setAcceptSaving={setAcceptSaving}
        onReload={reload}
        onAccepted={() => setAssignOpen(true)}
        onAssign={() => setAssignOpen(true)}
        onAskDetails={() => setInfoOpen(true)}
        onReject={() => setRejectOpen(true)}
      />
      <InboxAssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        selected={selected}
        dept={dept}
        userId={userId}
        onReload={reload}
      />
      <InboxMissingInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        selected={selected}
        userId={userId}
        onReload={reload}
      />
      <InboxRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        selected={selected}
        dept={dept}
        userId={userId}
        onReload={reload}
      />
    </>
  );
}
