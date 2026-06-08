"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { fieldLabelClassName } from "@/components/ui/field-control";
import { apiErrorMessage } from "@/lib/api-error";
import { isValidUuid } from "@/lib/assignment-form-utils";
import { createAssignment } from "@/lib/assignments-api";
import { fetchDepartmentUsers, type DepartmentUser } from "@/lib/users-api";
import type { RequestItem } from "@/types/request";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: RequestItem | null;
  dept: string | null | undefined;
  userId: string | undefined;
  onReload: () => Promise<void>;
};

export function InboxAssignDialog({ open, onOpenChange, selected, dept, userId, onReload }: Props) {
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [assignMembers, setAssignMembers] = useState<string[]>([]);
  const [includeSelfOnAssignment, setIncludeSelfOnAssignment] = useState(false);
  const [assignInstructions, setAssignInstructions] = useState("");
  const [membersError, setMembersError] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSaving, setAssignSaving] = useState(false);

  const assignableTeamMembers = useMemo(
    () => (userId ? departmentUsers.filter((u) => u.id !== userId) : departmentUsers),
    [departmentUsers, userId],
  );

  const assignmentMemberIds = useMemo(() => {
    const ids = [...assignMembers];
    if (includeSelfOnAssignment && userId && !ids.includes(userId)) ids.push(userId);
    return ids;
  }, [assignMembers, includeSelfOnAssignment, userId]);

  const canCreateAssignment = assignmentMemberIds.length > 0;

  useEffect(() => {
    if (!open || !dept) {
      setDepartmentUsers([]);
      return;
    }
    let cancelled = false;
    setUsersLoading(true);
    setAssignError(null);
    fetchDepartmentUsers(dept)
      .then((users) => {
        if (!cancelled) setDepartmentUsers(users);
      })
      .catch(() => {
        if (!cancelled) setDepartmentUsers([]);
      })
      .finally(() => {
        if (!cancelled) setUsersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, dept]);

  useEffect(() => {
    if (!open || !selected) return;
    setAssignMembers([]);
    setIncludeSelfOnAssignment(false);
    setAssignInstructions("");
    setMembersError(null);
    setAssignError(null);
  }, [open, selected]);

  async function handleAssign() {
    if (!userId || !selected || !canCreateAssignment) return;

    const invalidMember = assignmentMemberIds.find((id) => !isValidUuid(id));
    if (invalidMember) {
      setMembersError("One or more selected team members are invalid. Refresh and try again.");
      return;
    }

    setAssignError(null);
    setMembersError(null);
    setAssignSaving(true);
    try {
      const instructions = assignInstructions.trim();

      await createAssignment({
        requestId: selected.id,
        memberUserIds: assignmentMemberIds,
        ...(instructions ? { description: instructions } : {}),
      });
      await onReload();
      onOpenChange(false);
    } catch (err) {
      setAssignError(apiErrorMessage(err, "We could not create the assignment. Please try again."));
    } finally {
      setAssignSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Assign team members"
      description="Choose who will work on this request. The request title and deadline are set by the requester."
    >
      {!selected ? (
        <p className="text-sm text-slate-600">No request selected.</p>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border border-brand-dark/10 bg-white p-3 text-sm text-slate-700">
            <span className="font-medium text-brand-dark">{selected.requestNumber}</span> — {selected.title}
            {selected.deadline ? (
              <p className="mt-1 text-xs text-slate-500">Requester deadline: {selected.deadline}</p>
            ) : null}
          </div>

          {assignError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{assignError}</div>
          ) : null}

          {userId ? (
            <label className="rf-settings-row items-start !justify-start gap-3 bg-brand-primary/5">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={includeSelfOnAssignment}
                onChange={(e) => setIncludeSelfOnAssignment(e.target.checked)}
              />
              <span>
                <span className="text-sm font-medium text-brand-dark">Include me on this assignment</span>
                <span className="mt-0.5 block text-xs text-slate-600">
                  You&apos;ll see this under My Assigned Tasks and can track milestones.
                </span>
              </span>
            </label>
          ) : null}

          <div>
            <p className={fieldLabelClassName}>Team members *</p>
            {usersLoading ? (
              <p className="mt-2 text-sm text-slate-600">Loading department users…</p>
            ) : assignableTeamMembers.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">
                No other users in {dept}. Check &quot;Include me&quot; above or add users in the admin portal.
              </p>
            ) : (
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {assignableTeamMembers.map((u) => {
                  const checked = assignMembers.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={
                        checked
                          ? "rf-clickable-tile border-brand-primary bg-brand-primary/10 px-3 py-2 text-sm"
                          : "rf-clickable-tile border-brand-dark/15 bg-white px-3 py-2 text-sm"
                      }
                      onClick={() => {
                        setMembersError(null);
                        setAssignMembers((prev) => (checked ? prev.filter((id) => id !== u.id) : [...prev, u.id]));
                      }}
                    >
                      <span className="font-medium text-brand-dark">{u.fullName}</span>
                      {u.roleName ? <span className="mt-0.5 block text-xs text-slate-600">{u.roleName}</span> : null}
                    </button>
                  );
                })}
              </div>
            )}
            {membersError ? <p className="mt-2 text-xs text-red-600">{membersError}</p> : null}
            {!canCreateAssignment && !usersLoading ? (
              <p className="mt-2 text-xs text-slate-600">Select at least one team member or include yourself.</p>
            ) : null}
          </div>

          <div>
            <label className={fieldLabelClassName}>Instructions for the team (optional)</label>
            <Textarea
              className="mt-1"
              value={assignInstructions}
              placeholder="Any context or handover notes for assignees"
              onChange={(e) => setAssignInstructions(e.target.value)}
            />
          </div>

          <div className="rf-dialog-footer mt-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={assignSaving}>
              Cancel
            </Button>
            <Button disabled={assignSaving || !canCreateAssignment} onClick={() => void handleAssign()}>
              {assignSaving ? "Assigning…" : "Create assignment"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
