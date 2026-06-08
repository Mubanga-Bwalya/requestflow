"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DateInput } from "@/components/ui/date-input";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fieldLabelClassName } from "@/components/ui/field-control";
import {
  MILESTONE_STATUS_OPTIONS,
  MILESTONE_TITLE_MAX,
  type MilestoneFieldErrors,
} from "@/lib/assignment-form-utils";
import type { AssignmentDetail } from "@/lib/assignments-api";
import type { MilestoneFormStatus } from "@/hooks/use-assignment-detail";

type Props = {
  assignment: AssignmentDetail;
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
  updateOpen: boolean;
  setUpdateOpen: (v: boolean) => void;
  mTitle: string;
  setMTitle: (v: string) => void;
  mOwnerId: string;
  setMOwnerId: (v: string) => void;
  mDeadline: string;
  setMDeadline: (v: string) => void;
  mDescription: string;
  setMDescription: (v: string) => void;
  mStatus: MilestoneFormStatus;
  setMStatus: (v: MilestoneFormStatus) => void;
  mProgress: number;
  setMProgress: (v: number) => void;
  formError: string | null;
  fieldErrors: MilestoneFieldErrors;
  saving: boolean;
  canAddMilestone: boolean;
  userId: string | undefined;
  onAdd: () => void;
  onUpdate: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function MilestoneDialogs(props: Props) {
  const {
    assignment,
    addOpen,
    setAddOpen,
    updateOpen,
    setUpdateOpen,
    mTitle,
    setMTitle,
    mOwnerId,
    setMOwnerId,
    mDeadline,
    setMDeadline,
    mDescription,
    setMDescription,
    mStatus,
    setMStatus,
    mProgress,
    setMProgress,
    formError,
    fieldErrors,
    saving,
    canAddMilestone,
    userId,
    onAdd,
    onUpdate,
  } = props;

  return (
    <>
      <Dialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add milestone"
        description="New milestones start at To do with 0% progress. Update progress later as work moves."
      >
        {formError ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className={fieldLabelClassName}>Milestone title *</label>
            <Input
              value={mTitle}
              maxLength={MILESTONE_TITLE_MAX}
              onChange={(e) => setMTitle(e.target.value)}
              placeholder="e.g. Poster design draft"
            />
            <FieldError message={fieldErrors.title} />
          </div>
          <div>
            <label className={fieldLabelClassName}>Owner *</label>
            <Select value={mOwnerId} onChange={(e) => setMOwnerId(e.target.value)}>
              <option value="">Select owner…</option>
              {assignment.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <FieldError message={fieldErrors.owner} />
          </div>
          <div>
            <label className={fieldLabelClassName}>Deadline (optional)</label>
            <DateInput value={mDeadline} onChange={(e) => setMDeadline(e.target.value)} />
            <FieldError message={fieldErrors.deadline} />
          </div>
          <div className="md:col-span-2">
            <label className={fieldLabelClassName}>Description (optional)</label>
            <Textarea
              value={mDescription}
              placeholder="Brief notes about what needs to be done"
              onChange={(e) => setMDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="rf-dialog-footer">
          <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button disabled={saving || !userId || !canAddMilestone} onClick={() => void onAdd()}>
            {saving ? "Saving…" : "Add milestone"}
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={updateOpen}
        onOpenChange={setUpdateOpen}
        title="Update milestone progress"
        description="Change status and progress as work advances."
      >
        {formError ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={fieldLabelClassName}>Status</label>
            <Select value={mStatus} onChange={(e) => setMStatus(e.target.value as MilestoneFormStatus)}>
              {MILESTONE_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className={fieldLabelClassName}>Progress (0–100)</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={String(mProgress)}
              onChange={(e) => setMProgress(Number(e.target.value || 0))}
            />
          </div>
        </div>
        <div className="rf-dialog-footer">
          <Button variant="outline" onClick={() => setUpdateOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button disabled={saving || !userId} onClick={() => void onUpdate()}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
