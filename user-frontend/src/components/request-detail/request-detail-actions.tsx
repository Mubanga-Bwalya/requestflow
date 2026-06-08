import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { RequestDetail } from "@/lib/requests-api";

type Props = {
  req: RequestDetail;
  canReviewCompletion: boolean;
  isRequester: boolean;
  userId: string | undefined;
  onProvideOpen: () => void;
  onApproveOpen: () => void;
  onReopenOpen: () => void;
};

export function RequestDetailActions({
  req,
  canReviewCompletion,
  isRequester,
  userId,
  onProvideOpen,
  onApproveOpen,
  onReopenOpen,
}: Props) {
  const showProvide =
    isRequester && req.status === "NEEDS_INFORMATION" && req.missingInformation.length > 0;
  const showReview = canReviewCompletion;

  if (!showProvide && !showReview) return null;

  return (
    <Card className="border-brand-primary/20">
      <CardContent className="space-y-4 py-5">
        <p className="text-sm font-bold text-brand-dark">Actions</p>

        {showProvide ? (
          <div className="flex flex-col gap-3 rounded-control border border-brand-magenta/25 border-l-[3px] border-l-brand-magenta bg-brand-magenta/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-brand-dark">Provide missing information</p>
              <p className="mt-1 text-sm text-zamtel-muted">
                The team asked for details. Submit your answers to continue.
              </p>
            </div>
            <Button className="shrink-0" disabled={!userId} onClick={onProvideOpen}>
              Provide information
            </Button>
          </div>
        ) : null}

        {showReview ? (
          <div className="flex flex-col gap-3 rounded-control border border-brand-primary/25 bg-brand-primary/[0.04] p-4">
            <div>
              <p className="font-semibold text-brand-dark">Ready for your review</p>
              <p className="mt-1 text-sm text-zamtel-muted">
                The team finished their work. Approve or send it back for more changes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="success" disabled={!userId} onClick={onApproveOpen}>
                Approve completion
              </Button>
              <Button variant="outline" disabled={!userId} onClick={onReopenOpen}>
                Send back for more work
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
