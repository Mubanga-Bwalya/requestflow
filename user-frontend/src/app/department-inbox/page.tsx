"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DataTablePlaceholder } from "@/components/shared/data-table-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tab, Tabs } from "@/components/ui/tabs";
import { useLocalStore } from "@/lib/local-store";

export default function Page() {
  const { state, actions } = useLocalStore();
  const [tab, setTab] = useState<string>("ALL");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const selected = useMemo(() => state.inbox.find((i) => i.id === selectedId) ?? null, [selectedId, state.inbox]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.inbox.filter((r) => {
      const matchesTab = tab === "ALL" ? true : String(r.status).toUpperCase() === tab;
      if (!matchesTab) return false;
      if (!query) return true;
      return (
        r.requestNumber.toLowerCase().includes(query) ||
        r.title.toLowerCase().includes(query) ||
        r.requestType.toLowerCase().includes(query) ||
        r.requestedBy.toLowerCase().includes(query)
      );
    });
  }, [q, state.inbox, tab]);

  const teamMembers = ["Martha N.", "Bwalya M.", "Edward K.", "Jane Employee"];
  const [assignMembers, setAssignMembers] = useState<string[]>([]);
  const [assignDeadline, setAssignDeadline] = useState<string>("");

  const missingOptions = ["Poster dimensions", "Confirmed event slogan", "Budget approval reference", "Expected delivery format"];
  const [missingSelected, setMissingSelected] = useState<string[]>([]);

  return (
    <AppShell title="Department Inbox">
      <PageHeader title="Department Inbox" description="Manager review queue for department requests (UI placeholder)." />
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-[min(420px,100%)]">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search inbox by request #, title, type, requester..." />
          </div>
          <div className="text-sm text-slate-600">
            Showing <span className="font-medium text-brand-dark">{filtered.length}</span> item(s)
          </div>
        </div>

        <Tabs>
          <Tab active={tab === "ALL"} onClick={() => setTab("ALL")}>
            All
          </Tab>
          <Tab active={tab === "SUBMITTED"} onClick={() => setTab("SUBMITTED")}>
            New
          </Tab>
          <Tab active={tab === "NEEDS_INFORMATION"} onClick={() => setTab("NEEDS_INFORMATION")}>
            Needs Information
          </Tab>
          <Tab active={tab === "ACCEPTED"} onClick={() => setTab("ACCEPTED")}>
            Accepted
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
          <Tab active={tab === "OVERDUE"} onClick={() => setTab("OVERDUE")}>
            Overdue
          </Tab>
        </Tabs>
        <Card className="overflow-hidden">
          <CardContent>
            <DataTablePlaceholder
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
              rows={filtered.map((r) => ({
                ...r,
                __actions: (
                  <button
                    className="text-brand-primary hover:underline"
                    type="button"
                    onClick={() => {
                      setSelectedId(r.id);
                      setReviewOpen(true);
                    }}
                  >
                    Review
                  </button>
                ) as any,
              }))}
            />
            <div className="mt-4 rounded-md border border-brand-dark/10 bg-brand-primary/5 p-3 text-sm text-slate-700">
              Tip: use <span className="font-medium text-brand-dark">Review</span> on a row to open manager actions.
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={reviewOpen}
        onOpenChange={(v) => {
          setReviewOpen(v);
          if (!v) setSelectedId(null);
        }}
        title="Request Review"
        description="Manager actions affect local-only state."
      >
        {!selected ? (
          <p className="text-sm text-slate-600">Select an item from the table.</p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-brand-dark/10 bg-white p-3">
              <p className="text-sm text-slate-600">{selected.requestNumber}</p>
              <p className="mt-1 text-lg font-semibold text-brand-dark">{selected.title}</p>
              <p className="mt-1 text-sm text-slate-700">
                Requested by <span className="font-medium">{selected.requestedBy}</span> • Type: {selected.requestType}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  actions.inboxUpdate(selected.id, { status: "ACCEPTED" as any });
                  const linked = state.requests.find((r) => r.requestNumber === selected.requestNumber);
                  if (linked) actions.updateRequestStatus(linked.id, "IN_PROGRESS", "Manager accepted the request.");
                  setReviewOpen(false);
                }}
              >
                Accept
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setReviewOpen(false);
                  setAssignMembers([]);
                  setAssignDeadline("");
                  setAssignOpen(true);
                }}
              >
                Assign
              </Button>
              <Button
                variant="warning"
                onClick={() => {
                  setReviewOpen(false);
                  setMissingSelected([]);
                  setInfoOpen(true);
                }}
              >
                Request Info
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setReviewOpen(false);
                  setRejectOpen(true);
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen} title="Assign Request" description="Select members and set a deadline.">
        {!selected ? (
          <p className="text-sm text-slate-600">No request selected.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Assign to</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {teamMembers.map((m) => {
                  const checked = assignMembers.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      className={
                        checked
                          ? "rounded-md border border-brand-primary/30 bg-brand-primary/10 px-3 py-2 text-left text-sm text-brand-dark"
                          : "rounded-md border border-brand-dark/15 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-brand-primary/5"
                      }
                      onClick={() => setAssignMembers((p) => (checked ? p.filter((x) => x !== m) : [...p, m]))}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-600">Include yourself if needed (prototype only).</p>
            </div>

            <div>
              <label className="text-sm font-medium">Assignment deadline</label>
              <Input type="date" value={assignDeadline} onChange={(e) => setAssignDeadline(e.target.value)} />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!assignMembers.length) return alert("Select at least one member.");
                  actions.inboxUpdate(selected.id, { status: "ASSIGNED" as any, assignedMembers: assignMembers.join(", ") });
                  const linked = state.requests.find((r) => r.requestNumber === selected.requestNumber);
                  if (linked) actions.updateRequestStatus(linked.id, "IN_PROGRESS", `Assigned to ${assignMembers.join(", ")}.`);
                  setAssignOpen(false);
                }}
              >
                Assign
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen} title="Request Missing Information" description="Select missing items to request from the requester.">
        {!selected ? (
          <p className="text-sm text-slate-600">No request selected.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {missingOptions.map((m) => {
                const checked = missingSelected.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    className={
                      checked
                        ? "rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-left text-sm text-amber-900"
                        : "rounded-md border border-brand-dark/15 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-amber-50"
                    }
                    onClick={() => setMissingSelected((p) => (checked ? p.filter((x) => x !== m) : [...p, m]))}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setInfoOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="warning"
                onClick={() => {
                  if (!missingSelected.length) return alert("Select at least one missing item.");
                  actions.inboxUpdate(selected.id, { status: "NEEDS_INFORMATION" as any });
                  const linked = state.requests.find((r) => r.requestNumber === selected.requestNumber);
                  if (linked) {
                    actions.setRequestMissingInfo(linked.id, missingSelected, "Manager requested missing information.");
                    actions.updateRequestStatus(linked.id, "NEEDS_INFORMATION", "Status changed to Needs Information.");
                  }
                  setInfoOpen(false);
                }}
              >
                Send Request
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen} title="Reject Request" description="Confirm rejection (local-only).">
        {!selected ? (
          <p className="text-sm text-slate-600">No request selected.</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Reject <span className="font-medium text-brand-dark">{selected.requestNumber}</span> — {selected.title}?
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  actions.inboxUpdate(selected.id, { status: "REJECTED" as any });
                  const linked = state.requests.find((r) => r.requestNumber === selected.requestNumber);
                  if (linked) actions.updateRequestStatus(linked.id, "REJECTED", "Manager rejected the request.");
                  setRejectOpen(false);
                }}
              >
                Reject
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </AppShell>
  );
}
