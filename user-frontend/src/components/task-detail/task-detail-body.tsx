import { ListTree } from "lucide-react";
import { DataTable, type DataTableRow } from "@/components/shared/data-table";
import { DetailField, MetadataChip } from "@/components/shared/detail-field";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableActionButton } from "@/components/shared/table-action-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { taskNextStep } from "@/lib/request-detail-copy";
import { canManagerMarkReadyForReview } from "@/lib/request-work-utils";
import type { RequestStatus } from "@/types/request";
import type { Assignment } from "@/types/task";

type Props = {
  assignment: Assignment;
  requestStatus?: RequestStatus;
  canManageInbox?: boolean;
  userId: string | undefined;
  saving: boolean;
  onAddOpen: () => void;
  onMarkReady: () => void;
  onUpdateMilestone: (id: string) => void;
};

export function TaskDetailBody({
  assignment,
  requestStatus = "IN_PROGRESS",
  canManageInbox = false,
  userId,
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
    __actions: <TableActionButton onClick={() => onUpdateMilestone(m.id)}>Update</TableActionButton>,
  }));

  const canMarkReady =
    Boolean(userId) &&
    !saving &&
    canManagerMarkReadyForReview(canManageInbox, requestStatus, assignment.status);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-brand-dark sm:text-2xl">{assignment.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={assignment.status} />
          <MetadataChip>Request {assignment.relatedRequest}</MetadataChip>
          <MetadataChip>{assignment.department}</MetadataChip>
          {assignment.deadline ? <MetadataChip>Due {assignment.deadline}</MetadataChip> : null}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <p className="text-sm font-bold text-brand-dark">Task status summary</p>
          <dl className="grid gap-1 sm:grid-cols-2">
            <DetailField label="Related request" value={assignment.relatedRequest} />
            <DetailField label="Department" value={assignment.department} />
            <DetailField
              label="Assigned members"
              value={
                assignment.members.length
                  ? assignment.members.map((m) => m.name).join(", ")
                  : "No team assigned yet"
              }
            />
            <DetailField label="Due date" value={assignment.deadline?.trim() ? assignment.deadline : "No due date set"} />
            <DetailField label="Next step" value={taskNextStep(assignment.status)} className="sm:col-span-2" />
          </dl>
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-zamtel-muted">Overall progress</p>
              <span className="text-sm font-bold tabular-nums text-brand-primary">{assignment.progress}%</span>
            </div>
            <div className="mt-2">
              <Progress value={assignment.progress} label={`Task ${assignment.progress}% complete`} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-brand-dark">Milestones</p>
              <p className="mt-1 text-xs text-zamtel-muted">Update each step to track execution progress</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={onAddOpen}>
                Add Milestone
              </Button>
              <Button variant="primary" disabled={!canMarkReady} loading={saving} onClick={onMarkReady}>
                Mark Ready for Review
              </Button>
            </div>
          </div>
          <div className="mt-4">
            {assignment.milestones.length ? (
              <>
                <DataTable
                  columns={[
                    { key: "title", label: "Milestone" },
                    { key: "owner", label: "Owner" },
                    { key: "status", label: "Status" },
                    { key: "progress", label: "Progress" },
                    { key: "__actions", label: "" },
                  ]}
                  rows={milestoneRows}
                />
                <p className="mt-3 text-xs text-zamtel-muted">
                  Overall progress is the average of milestone progress.
                </p>
              </>
            ) : (
              <EmptyState
                icon={ListTree}
                heading="No milestones yet"
                body="Add a milestone to break this task into trackable steps."
                className="mt-2 border-0 bg-zamtel-bg/40 py-6 shadow-none"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
