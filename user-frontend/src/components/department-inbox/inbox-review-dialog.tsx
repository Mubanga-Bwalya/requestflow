"use client";

import { ActionChoiceCard } from "@/components/shared/action-choice-card";
import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { Dialog } from "@/components/ui/dialog";
import { canAssignRequest } from "@/lib/role-utils";
import { updateRequestStatus } from "@/lib/requests-api";
import type { RequestItem } from "@/types/request";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: RequestItem | null;
  userId: string | undefined;
  acceptSaving: boolean;
  setAcceptSaving: (v: boolean) => void;
  onReload: () => Promise<void>;
  onAccepted: () => void;
  onAssign: () => void;
  onAskDetails: () => void;
  onReject: () => void;
};

export function InboxReviewDialog({
  open,
  onOpenChange,
  selected,
  userId,
  acceptSaving,
  setAcceptSaving,
  onReload,
  onAccepted,
  onAssign,
  onAskDetails,
  onReject,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={selected ? `Manage request — ${selected.requestNumber}` : "Manage request"}
      description={
        selected
          ? `Choose what happens next. ${selected.requestedBy ?? "The requester"} will be notified.`
          : undefined
      }
    >
      {!selected ? (
        <p className="text-sm text-slate-600">Select an item from the table.</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border border-brand-dark/10 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              {selected.priority ? <PriorityBadge priority={selected.priority} /> : null}
            </div>
            <p className="mt-2 text-lg font-semibold text-brand-dark">{selected.title}</p>
            <p className="mt-1 text-sm text-slate-700">
              Requested by <span className="font-medium">{selected.requestedBy ?? "—"}</span>
            </p>
            <p className="text-sm text-slate-600">
              Type: {selected.requestType} • Deadline: {selected.deadline || "—"}
            </p>
            {selected.assignedMembers?.trim() ? (
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-medium text-brand-dark">Assigned to:</span> {selected.assignedMembers}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended next steps</p>

            {selected.status === "SUBMITTED" ? (
              <ActionChoiceCard
                variant="primary"
                title="Accept this request"
                description="Your team will work on it. Next, you’ll choose who does the work."
                disabled={acceptSaving}
                onClick={async () => {
                  if (!userId) return;
                  setAcceptSaving(true);
                  try {
                    await updateRequestStatus(selected.id, "ACCEPTED", "Manager accepted the request.");
                    await onReload();
                    onOpenChange(false);
                    onAccepted();
                  } finally {
                    setAcceptSaving(false);
                  }
                }}
              />
            ) : null}

            {selected.status === "ACCEPTED" && canAssignRequest(selected) ? (
              <ActionChoiceCard
                variant="primary"
                title="Assign people to do the work"
                description="Pick team members. They will see tasks under My Assigned Tasks."
                onClick={() => {
                  onOpenChange(false);
                  onAssign();
                }}
              />
            ) : null}

            <ActionChoiceCard
              variant="warning"
              title={`Ask ${selected.requestedBy ?? "the requester"} for more details`}
              description="Pause the request and send questions about specific form fields."
              onClick={() => {
                onOpenChange(false);
                onAskDetails();
              }}
            />

            <ActionChoiceCard
              variant="danger"
              title="Decline this request"
              description={`Tell ${selected.requestedBy ?? "the requester"} your team cannot fulfill this request.`}
              onClick={() => {
                onOpenChange(false);
                onReject();
              }}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
