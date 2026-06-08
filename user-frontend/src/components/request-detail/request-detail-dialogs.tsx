import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { RequestDetail } from "@/lib/requests-api";

type Props = {
  req: RequestDetail;
  userId: string | undefined;
  provideOpen: boolean;
  setProvideOpen: (open: boolean) => void;
  approveOpen: boolean;
  setApproveOpen: (open: boolean) => void;
  reopenOpen: boolean;
  setReopenOpen: (open: boolean) => void;
  providedValues: Record<string, string>;
  setProvidedValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  provideError: string | null;
  setProvideError: (msg: string | null) => void;
  onSubmitMissing: () => void;
  onApprove: () => void;
  onReopen: () => void;
  provideSaving?: boolean;
  approveSaving?: boolean;
  reopenSaving?: boolean;
};

export function RequestDetailDialogs({
  req,
  userId,
  provideOpen,
  setProvideOpen,
  approveOpen,
  setApproveOpen,
  reopenOpen,
  setReopenOpen,
  providedValues,
  setProvidedValues,
  provideError,
  setProvideError,
  onSubmitMissing,
  onApprove,
  onReopen,
  provideSaving = false,
  approveSaving = false,
  reopenSaving = false,
}: Props) {
  return (
    <>
      <Dialog
        open={provideOpen}
        onOpenChange={setProvideOpen}
        title="Provide missing information"
        description="Answer the questions below so the team can continue."
      >
        <div className="space-y-4">
          {provideError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{provideError}</p>
          ) : null}
          {req.missingInformation.map((m) =>
            m.fieldKey ? (
              <div key={m.fieldKey} className="space-y-2">
                <label className="text-sm font-medium">{m.label}</label>
                <Input
                  value={providedValues[m.fieldKey] ?? ""}
                  onChange={(e) => setProvidedValues((p) => ({ ...p, [m.fieldKey!]: e.target.value }))}
                  placeholder={`Enter: ${m.label}`}
                />
              </div>
            ) : null,
          )}
        </div>
        <div className="rf-dialog-footer">
          <Button variant="outline" onClick={() => setProvideOpen(false)}>
            Cancel
          </Button>
          <Button loading={provideSaving} disabled={provideSaving} onClick={() => void onSubmitMissing()}>
            Submit answers
          </Button>
        </div>
      </Dialog>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen} title="Approve this request?">
        <p className="text-sm text-slate-700">
          Mark <span className="font-medium">{req.title}</span> ({req.requestNumber}) as complete? Use this when you are satisfied with the work.
        </p>
        <div className="rf-dialog-footer">
          <Button variant="outline" onClick={() => setApproveOpen(false)}>
            Not yet
          </Button>
          <Button variant="success" loading={approveSaving} disabled={!userId || approveSaving} onClick={() => void onApprove()}>
            Yes, approve
          </Button>
        </div>
      </Dialog>

      <Dialog open={reopenOpen} onOpenChange={setReopenOpen} title="Send back for more work?">
        <p className="text-sm text-slate-700">
          The <span className="font-medium">{req.department}</span> team will continue working on{" "}
          <span className="font-medium">{req.title}</span>. Use this if something still needs to change.
        </p>
        <div className="rf-dialog-footer">
          <Button variant="outline" onClick={() => setReopenOpen(false)}>
            Cancel
          </Button>
          <Button variant="warning" loading={reopenSaving} disabled={!userId || reopenSaving} onClick={() => void onReopen()}>
            Yes, send back
          </Button>
        </div>
      </Dialog>
    </>
  );
}
