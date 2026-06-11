"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { updateRequestStatus } from "@/lib/requests-api";
import type { InboxRequestRef } from "@/lib/inbox-request-ref";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: InboxRequestRef | null;
  dept: string | null | undefined;
  userId: string | undefined;
  onReload: () => Promise<void>;
};

export function InboxRejectDialog({ open, onOpenChange, selected, dept, userId, onReload }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Decline this request?">
      {!selected ? (
        <p className="text-sm text-slate-600">No request selected.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-700">
            This tells <span className="font-medium">{selected.requestedBy ?? "the requester"}</span> that the{" "}
            <span className="font-medium">{dept ?? "department"}</span> team cannot fulfill{" "}
            <span className="font-medium">{selected.title}</span> ({selected.requestNumber}).
          </p>
          <p className="text-sm text-slate-600">
            The request will be marked <span className="font-medium">Declined</span> and will not continue.
          </p>
          <div className="rf-dialog-footer mt-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Keep request
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!userId) return;
                await updateRequestStatus(selected.id, "REJECTED", "Manager declined the request.");
                await onReload();
                onOpenChange(false);
              }}
            >
              Yes, decline request
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
