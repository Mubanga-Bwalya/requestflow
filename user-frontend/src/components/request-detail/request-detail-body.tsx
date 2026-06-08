import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { Card, CardContent } from "@/components/ui/card";
import { RequestDetailActions } from "@/components/request-detail/request-detail-actions";
import { RequestDetailHeader } from "@/components/request-detail/request-detail-header";
import { RequestDetailSubmitted } from "@/components/request-detail/request-detail-submitted";
import { RequestDetailSummary } from "@/components/request-detail/request-detail-summary";
import type { RequestDetail } from "@/lib/requests-api";

type Props = {
  req: RequestDetail;
  canReviewCompletion: boolean;
  userId: string | undefined;
  onProvideOpen: () => void;
  onApproveOpen: () => void;
  onReopenOpen: () => void;
};

export function RequestDetailBody({
  req,
  canReviewCompletion,
  userId,
  onProvideOpen,
  onApproveOpen,
  onReopenOpen,
}: Props) {
  const isRequester = Boolean(userId && req.createdBy.id === userId);

  return (
    <div className="space-y-5">
      <RequestDetailHeader req={req} />
      <RequestDetailSummary req={req} isRequester={isRequester} />
      <RequestDetailActions
        req={req}
        canReviewCompletion={canReviewCompletion}
        isRequester={isRequester}
        userId={userId}
        onProvideOpen={onProvideOpen}
        onApproveOpen={onApproveOpen}
        onReopenOpen={onReopenOpen}
      />
      <RequestDetailSubmitted req={req} isRequester={isRequester} />
      <Card>
        <CardContent>
          <p className="mb-4 text-sm font-bold text-brand-dark">Activity</p>
          <ActivityTimeline items={req.activity} />
          {isRequester && !canReviewCompletion && req.status !== "NEEDS_INFORMATION" ? (
            <p className="mt-4 text-sm text-zamtel-muted">
              You can approve this request when the status is{" "}
              <span className="font-medium text-brand-dark">Ready for your approval</span>.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
