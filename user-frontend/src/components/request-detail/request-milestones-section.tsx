"use client";

import { ListTree } from "lucide-react";
import { DataTable, type DataTableRow } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { TableActionButton } from "@/components/shared/table-action-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { canManagerMarkReadyForReview } from "@/lib/request-work-utils";
import type { RequestStatus } from "@/types/request";
import type { Assignment } from "@/types/task";

type Props = {
  assignment: Assignment;
  requestStatus: RequestStatus;
  canEdit: boolean;
  canManageInbox: boolean;
  saving: boolean;
  onAddOpen: () => void;
  onMarkReady: () => void;
  onUpdateMilestone: (id: string) => void;
};

export function RequestMilestonesSection({
  assignment,
  requestStatus,
  canEdit,
  canManageInbox,
  saving,
  onAddOpen,
  onMarkReady,
  onUpdateMilestone,
}: Props) {
  const milestoneRows: DataTableRow[] = assignment.milestones.map((m) => ({
    title: m.title,
    owner: m.owner,
    status: m.status,
    progress: `${m.progress}%`,
    __actions: canEdit ? (
      <TableActionButton onClick={() => onUpdateMilestone(m.id)}>Update</TableActionButton>
    ) : null,
  }));

  const canMarkReady =
    !saving &&
    canManagerMarkReadyForReview(canManageInbox, requestStatus, assignment.status);

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-brand-dark">Team progress</p>
            <p className="mt-1 text-xs text-zamtel-muted">
              {canManageInbox
                ? "Track execution here. Mark ready for review when work is complete — reaching 100% does not submit automatically."
                : "Track milestone progress here. Your manager submits for requester review when work is complete."}
            </p>
          </div>
          {canEdit || canMarkReady ? (
            <div className="flex flex-wrap gap-2">
              {canEdit ? (
                <Button variant="outline" onClick={onAddOpen}>
                  Add milestone
                </Button>
              ) : null}
              {canMarkReady ? (
                <Button variant="primary" loading={saving} onClick={onMarkReady}>
                  Mark ready for review
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="mt-4">
          {assignment.milestones.length ? (
            <>
              <DataTable
                columns={
                  canEdit
                    ? [
                        { key: "title", label: "Milestone" },
                        { key: "owner", label: "Owner" },
                        { key: "status", label: "Status" },
                        { key: "progress", label: "Progress" },
                        { key: "__actions", label: "" },
                      ]
                    : [
                        { key: "title", label: "Milestone" },
                        { key: "owner", label: "Owner" },
                        { key: "status", label: "Status" },
                        { key: "progress", label: "Progress" },
                      ]
                }
                rows={milestoneRows}
              />
              <p className="mt-3 text-xs text-zamtel-muted">
                Overall progress is the average of milestone progress.
              </p>
            </>
          ) : (
            <EmptyState
              icon={ListTree}
              heading={canEdit ? "No milestones yet" : "No milestones added"}
              body={
                canEdit
                  ? "Add a milestone to break this work into trackable steps."
                  : "The assigned team has not added milestones yet."
              }
              className="mt-2 border-0 bg-zamtel-bg/40 py-6 shadow-none"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
