import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailField } from "@/components/shared/detail-field";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { RequestDetail } from "@/lib/requests-api";
import {
  requestNeedsAttention,
  requestNextStep,
  requestWhatsHappening,
} from "@/lib/request-detail-copy";

export function RequestDetailSummary({ req, isRequester }: { req: RequestDetail; isRequester: boolean }) {
  const needsAttention = requestNeedsAttention(req, isRequester);

  return (
    <Card>
      <CardContent className="space-y-4">
        <p className="text-sm font-bold text-brand-dark">Request status summary</p>

        <div className="flex flex-wrap gap-2">
          <StatusBadge status={req.status} />
          <PriorityBadge priority={req.priority} />
        </div>

        <dl className="grid gap-1 sm:grid-cols-2">
          <DetailField label="Handled by" value={req.department} />
          <DetailField
            label="Deadline"
            value={req.deadline?.trim() ? req.deadline : "No deadline set"}
          />
          <DetailField label="What's happening" value={requestWhatsHappening(req)} className="sm:col-span-2" />
          <DetailField label="Next step" value={requestNextStep(req, isRequester)} className="sm:col-span-2" />
        </dl>

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-zamtel-muted">Overall progress</p>
            <span className="text-sm font-bold tabular-nums text-brand-primary">{req.progress}%</span>
          </div>
          <div className="mt-2">
            <Progress value={req.progress} label={`Request ${req.progress}% complete`} />
          </div>
        </div>

        {needsAttention ? (
          <div className="rounded-control border border-brand-magenta/30 border-l-[3px] border-l-brand-magenta bg-brand-magenta/[0.05] px-4 py-3">
            <p className="text-sm font-bold text-brand-magenta">Action needed</p>
            <p className="mt-1 text-sm text-zamtel-text">
              {req.status === "NEEDS_INFORMATION"
                ? "The team needs more information before work can continue."
                : requestNextStep(req, isRequester)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-zamtel-muted">No action needed from you right now.</p>
        )}
      </CardContent>
    </Card>
  );
}
