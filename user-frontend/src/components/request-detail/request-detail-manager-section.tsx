"use client";

import { Ban, CheckCircle2, MessageCircleQuestion, Users } from "lucide-react";
import { useState } from "react";
import { InboxAssignDialog } from "@/components/department-inbox/inbox-assign-dialog";
import { InboxMissingInfoDialog } from "@/components/department-inbox/inbox-missing-info-dialog";
import { InboxRejectDialog } from "@/components/department-inbox/inbox-reject-dialog";
import { RequestDetailManagerAction } from "@/components/request-detail/request-detail-manager-action";
import { Button } from "@/components/ui/button";
import {
  canAssignFromDetail,
  inboxRefFromDetail,
  managerCanActOnStatus,
} from "@/lib/inbox-request-ref";
import { updateRequestStatus, type RequestDetail } from "@/lib/requests-api";
import { statusLabel } from "@/lib/request-status-groups";

type Props = {
  req: RequestDetail;
  userId: string | undefined;
  dept: string | null;
  onUpdated: () => Promise<void>;
};

export function RequestDetailManagerSection({ req, userId, dept, onUpdated }: Props) {
  const ref = inboxRefFromDetail(req);
  const requester = ref.requestedBy ?? "the requester";
  const [assignOpen, setAssignOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [acceptSaving, setAcceptSaving] = useState(false);

  if (!managerCanActOnStatus(req.status)) return null;

  const headline =
    req.status === "SUBMITTED"
      ? "Step 1 — Decide if your team will handle this"
      : canAssignFromDetail(req.status)
        ? "Step 2 — Assign someone to do the work"
        : "Manage this request";

  async function handleAccept() {
    if (!userId || acceptSaving) return;
    setAcceptSaving(true);
    try {
      await updateRequestStatus(req.id, "ACCEPTED", "Manager accepted the request.");
      await onUpdated();
      setAssignOpen(true);
    } finally {
      setAcceptSaving(false);
    }
  }

  return (
    <>
      <div
        className="overflow-hidden rounded-card border-2 border-brand-dark/35 bg-surface shadow-card"
        role="region"
        aria-label="Manager actions"
      >
        <div className="bg-brand-dark px-5 py-4 text-white md:px-6">
          <p className="text-xs font-bold uppercase tracking-wide">Your decision</p>
          <p className="mt-1 text-lg font-bold leading-snug">{headline}</p>
          <p className="mt-2 text-sm leading-relaxed text-white">
            Status: <span className="font-semibold">{statusLabel(req.status)}</span>
            {" · "}
            {requester} will be notified of any change.
          </p>
        </div>

        <div className="space-y-5 px-5 py-5 md:px-6">
          {req.status === "SUBMITTED" ? (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-zamtel-text">
                Read the submitted answers below. If your team can help, accept the request — you
                will then choose who works on it under{" "}
                <span className="font-semibold text-brand-dark">My Assigned Tasks</span>.
              </p>
              <Button
                className="h-12 w-full text-base sm:w-auto sm:min-w-[260px]"
                loading={acceptSaving}
                disabled={!userId}
                onClick={() => void handleAccept()}
              >
                <CheckCircle2 className="mr-2 h-5 w-5 shrink-0" aria-hidden />
                Accept request
              </Button>
            </div>
          ) : null}

          {canAssignFromDetail(req.status) ? (
            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-zamtel-text">
                Pick one or more team members. They update milestones until the work is ready for{" "}
                <span className="font-semibold text-brand-dark">{requester}</span> to review.
              </p>
              <Button
                className="h-12 w-full text-base sm:w-auto sm:min-w-[260px]"
                disabled={!userId}
                onClick={() => setAssignOpen(true)}
              >
                <Users className="mr-2 h-5 w-5 shrink-0" aria-hidden />
                Assign team members
              </Button>
            </div>
          ) : null}

          <div className="space-y-3 border-t border-zamtel-border pt-5">
            <p className="text-sm font-bold text-brand-dark">Other options</p>
            <p className="text-sm text-zamtel-text">
              Use these if you need more information or your team cannot take the request.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <RequestDetailManagerAction
                icon={MessageCircleQuestion}
                tone="warning"
                title={`Ask ${requester} for more details`}
                description="Pause the request and send questions about specific form fields."
                disabled={!userId}
                onClick={() => setInfoOpen(true)}
              />
              <RequestDetailManagerAction
                icon={Ban}
                tone="danger"
                title="Decline request"
                description={`Tell ${requester} your team cannot fulfill this request.`}
                disabled={!userId}
                onClick={() => setRejectOpen(true)}
              />
            </div>
          </div>
        </div>
      </div>

      <InboxAssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        selected={ref}
        dept={dept}
        userId={userId}
        onReload={onUpdated}
      />
      <InboxMissingInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        selected={ref}
        userId={userId}
        onReload={onUpdated}
      />
      <InboxRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        selected={ref}
        dept={dept}
        userId={userId}
        onReload={onUpdated}
      />
    </>
  );
}
