"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DataTablePlaceholder } from "@/components/shared/data-table-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useLocalStore } from "@/lib/local-store";

export default function Page() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { state, actions } = useLocalStore();

  const req = useMemo(() => state.requests.find((r) => r.id === params.id) ?? null, [params.id, state.requests]);
  const missing = state.requestMissingInfoById[params.id] ?? [];
  const activity = state.activityByRequestId[params.id] ?? [];

  const [provideOpen, setProvideOpen] = useState(false);
  const [providedValues, setProvidedValues] = useState<Record<string, string>>(() =>
    missing.reduce((acc, k) => {
      acc[k] = "";
      return acc;
    }, {} as Record<string, string>),
  );

  if (!req) {
    return (
      <AppShell title="Request Details">
        <PageHeader title="Request not found" description="This request does not exist in local mock state." actions={<Button onClick={() => router.push("/requests")}>Back to My Requests</Button>} />
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">Try returning to the request list.</p>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell title="Request Details">
      <PageHeader title="Request Details" description="View status, progress, current stage, and final output summary." />
      <div className="space-y-4">
        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 h-1 w-full bg-brand-primary" aria-hidden />
          <CardContent className="space-y-2">
            <p className="text-sm text-slate-600">{req.requestNumber}</p>
            <h2 className="text-xl font-semibold text-brand-dark">{req.title}</h2>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={req.status} />
              <PriorityBadge priority={req.department === "HR" ? "MEDIUM" : "HIGH"} />
            </div>
            <p className="text-sm text-slate-700">Department: {req.department} | Type: {req.requestType}</p>
            <p className="text-sm text-slate-700">
              Current Stage:{" "}
              {req.status === "NEEDS_INFORMATION"
                ? "Awaiting requester clarification"
                : req.status === "SUBMITTED"
                  ? "Pending manager review"
                  : req.status === "APPROVED"
                    ? "Approved"
                    : req.status === "REOPENED"
                      ? "Reopened"
                      : "In progress"}
            </p>
            <Progress value={req.progress} />
            <p className="text-sm text-slate-700">Overall Progress: {req.progress}%</p>
          </CardContent>
        </Card>

        {req.status === "NEEDS_INFORMATION" ? (
          <Card>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="mb-1 font-semibold text-brand-dark">Missing Information</p>
                  <p className="text-sm text-slate-600">Please provide the requested details to unblock the department.</p>
                </div>
                <Button onClick={() => setProvideOpen(true)}>Provide Information</Button>
              </div>
              <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
                {missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-1 font-semibold text-brand-dark">Final Output (Placeholder)</p>
                <p className="text-sm text-slate-600">Download/preview will connect to backend later.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => alert("Preview placeholder (no backend).")}>
                  Preview
                </Button>
                <Button variant="outline" onClick={() => alert("Download placeholder (no backend).")}>
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="mb-2 font-semibold text-brand-dark">Milestone Summary (Requester View)</p>
            <DataTablePlaceholder
              columns={[{ key: "title", label: "Milestone" }, { key: "progress", label: "Progress" }]}
              rows={[
                { title: "Planning", progress: `${Math.min(100, Math.max(0, req.progress - 20))}%` },
                { title: "Execution", progress: `${req.progress}%` },
                { title: "Review", progress: `${Math.max(0, req.progress - 40)}%` },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="mb-3 font-semibold text-brand-dark">Activity Timeline</p>
            <div className="space-y-3 border-l-2 border-brand-primary/20 pl-4">
              {(activity.length ? activity : ["Request created (local mock state)."]).map((item) => (
                <div key={item} className="relative">
                  <div className="absolute -left-[19px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-primary ring-4 ring-brand-primary/10" aria-hidden />
                  <p className="text-sm text-slate-700">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="success"
                onClick={() => actions.updateRequestStatus(req.id, "APPROVED", "Requester approved the completion.")}
                disabled={req.status === "APPROVED"}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => actions.updateRequestStatus(req.id, "REOPENED", "Requester reopened the request.")}
                disabled={req.status === "REOPENED"}
              >
                Reopen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={provideOpen}
        onOpenChange={setProvideOpen}
        title="Provide Missing Information"
        description="Fill the requested items (local-only)."
      >
        <div className="space-y-4">
          {missing.map((m) => (
            <div key={m} className="space-y-2">
              <label className="text-sm font-medium">{m}</label>
              <Input value={providedValues[m] ?? ""} onChange={(e) => setProvidedValues((p) => ({ ...p, [m]: e.target.value }))} placeholder={`Enter: ${m}`} />
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setProvideOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const missingStill = missing.filter((m) => !String(providedValues[m] ?? "").trim());
              if (missingStill.length) {
                alert(`Please complete: ${missingStill.join(", ")}`);
                return;
              }
              actions.setRequestMissingInfo(req.id, [], "Requester provided the missing information.");
              actions.updateRequestStatus(req.id, "SUBMITTED", "Request resubmitted after providing missing information.");
              setProvideOpen(false);
            }}
          >
            Submit Information
          </Button>
        </div>
      </Dialog>
    </AppShell>
  );
}
