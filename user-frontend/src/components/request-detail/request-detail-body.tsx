import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { RequestDetailActions } from "@/components/request-detail/request-detail-actions";
import { RequestDetailManagerSection } from "@/components/request-detail/request-detail-manager-section";
import { RequestDetailHeader } from "@/components/request-detail/request-detail-header";
import { RequestMilestonesSection } from "@/components/request-detail/request-milestones-section";
import { RequestDetailSection } from "@/components/request-detail/request-detail-section";
import { RequestDetailSubmitted } from "@/components/request-detail/request-detail-submitted";
import { RequestDetailSummary } from "@/components/request-detail/request-detail-summary";
import type { AssignmentDetail } from "@/lib/assignments-api";
import type { RequestDetail } from "@/lib/requests-api";
import {
  canEditMilestones,
  managerShowDecisionPanel,
  showWorkMilestones,
} from "@/lib/request-work-utils";

type Props = {
  req: RequestDetail;
  assignment: AssignmentDetail | null;
  assignmentLoading: boolean;
  canReviewCompletion: boolean;
  canManageInbox: boolean;
  inboxDepartment: string | null;
  userId: string | undefined;
  milestoneSaving: boolean;
  onProvideOpen: () => void;
  onApproveOpen: () => void;
  onReopenOpen: () => void;
  onReqUpdated: () => Promise<void>;
  onAddMilestoneOpen: () => void;
  onMarkReady: () => void;
  onUpdateMilestone: (id: string) => void;
};

export function RequestDetailBody({
  req,
  assignment,
  assignmentLoading,
  canReviewCompletion,
  canManageInbox,
  inboxDepartment,
  userId,
  milestoneSaving,
  onProvideOpen,
  onApproveOpen,
  onReopenOpen,
  onReqUpdated,
  onAddMilestoneOpen,
  onMarkReady,
  onUpdateMilestone,
}: Props) {
  const isRequester = Boolean(userId && req.createdBy.id === userId);
  const showManagerPanel = canManageInbox && managerShowDecisionPanel(req.status);
  const showMilestones = showWorkMilestones(req);
  const canEdit = canEditMilestones(userId, assignment, canManageInbox);

  return (
    <div className="w-full space-y-6">
      <RequestDetailHeader req={req} showManagerContext={canManageInbox} />
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {showManagerPanel ? (
            <RequestDetailManagerSection
              req={req}
              userId={userId}
              dept={inboxDepartment}
              onUpdated={onReqUpdated}
            />
          ) : null}

          <RequestDetailActions
            req={req}
            canReviewCompletion={canReviewCompletion}
            isRequester={isRequester}
            userId={userId}
            onProvideOpen={onProvideOpen}
            onApproveOpen={onApproveOpen}
            onReopenOpen={onReopenOpen}
          />

          {showMilestones && assignmentLoading ? (
            <p className="text-sm text-zamtel-muted">Loading team progress…</p>
          ) : null}

          {showMilestones && assignment ? (
            <RequestMilestonesSection
              assignment={assignment}
              requestStatus={req.status}
              canEdit={canEdit}
              canManageInbox={canManageInbox}
              saving={milestoneSaving}
              onAddOpen={onAddMilestoneOpen}
              onMarkReady={onMarkReady}
              onUpdateMilestone={onUpdateMilestone}
            />
          ) : null}

          <RequestDetailSubmitted
            req={req}
            isRequester={isRequester}
            forManager={canManageInbox}
          />
        </div>

        <div className="space-y-6">
          <RequestDetailSummary req={req} isRequester={isRequester} forManager={canManageInbox} />
          <RequestDetailSection id="request-activity" title="Activity">
            <ActivityTimeline items={req.activity} />
            {isRequester && !canReviewCompletion && req.status !== "NEEDS_INFORMATION" ? (
              <p className="mt-4 text-sm text-zamtel-text">
                You can approve this request when the status is{" "}
                <span className="font-semibold text-brand-dark">Ready for your approval</span>.
              </p>
            ) : null}
          </RequestDetailSection>
        </div>
      </div>
    </div>
  );
}
