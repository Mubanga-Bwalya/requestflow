import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { DetailField } from "@/components/shared/detail-field";
import { RequestDetailSection } from "@/components/request-detail/request-detail-section";
import { Progress } from "@/components/ui/progress";
import { hasVisibleSubmittedFields } from "@/lib/field-answer-display";
import type { RequestDetail } from "@/lib/requests-api";
import {
  managerNeedsAttention,
  managerNextStep,
  managerWhatsHappening,
  requestNeedsAttention,
  requestNextStep,
  requestWhatsHappening,
} from "@/lib/request-detail-copy";

type Props = {
  req: RequestDetail;
  isRequester: boolean;
  forManager?: boolean;
};

export function RequestDetailSummary({ req, isRequester, forManager = false }: Props) {
  const hasFormAnswers = hasVisibleSubmittedFields(req.fieldAnswers);
  const needsAttention = forManager
    ? managerNeedsAttention(req)
    : requestNeedsAttention(req, isRequester);
  const whatsHappening = forManager ? managerWhatsHappening(req) : requestWhatsHappening(req);
  const nextStep = forManager ? managerNextStep(req) : requestNextStep(req, isRequester);

  return (
    <RequestDetailSection
      id="request-status"
      title={forManager ? "Where this request stands" : "Request status summary"}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={req.status} />
          {!hasFormAnswers && !forManager ? <PriorityBadge priority={req.priority} /> : null}
        </div>

        <p className="text-sm leading-relaxed text-zamtel-text">{whatsHappening}</p>

        {!forManager ? (
          <dl className="grid gap-1 sm:grid-cols-2">
            {!hasFormAnswers ? <DetailField label="Handled by" value={req.department} /> : null}
            {!hasFormAnswers ? (
              <DetailField
                label="Deadline"
                value={req.deadline?.trim() ? req.deadline : "No deadline set"}
              />
            ) : null}
            <DetailField label="Next step" value={nextStep} className="sm:col-span-2" />
          </dl>
        ) : (
          <div className="rounded-control border-2 border-brand-dark/20 bg-zamtel-bg px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-dark">
              Suggested next step
            </p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-zamtel-text">{nextStep}</p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-dark">
              Overall progress
            </p>
            <span className="text-sm font-bold tabular-nums text-brand-dark">{req.progress}%</span>
          </div>
          <div className="mt-2">
            <Progress value={req.progress} label={`Request ${req.progress}% complete`} />
          </div>
        </div>

        {needsAttention && !forManager ? (
          <div className="rounded-control border-2 border-brand-magenta/40 border-l-[4px] border-l-brand-magenta bg-brand-magenta/[0.06] px-4 py-3">
            <p className="text-sm font-bold text-brand-magenta">Action needed</p>
            <p className="mt-1 text-sm leading-relaxed text-zamtel-text">
              {req.status === "NEEDS_INFORMATION"
                ? "The team needs more information before work can continue."
                : nextStep}
            </p>
          </div>
        ) : !forManager ? (
          <p className="text-sm text-zamtel-text">No action needed from you right now.</p>
        ) : null}
      </div>
    </RequestDetailSection>
  );
}
