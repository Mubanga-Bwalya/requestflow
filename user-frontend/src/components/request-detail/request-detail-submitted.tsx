import { DetailField } from "@/components/shared/detail-field";
import { RequestDetailSection } from "@/components/request-detail/request-detail-section";
import { priorityLabel } from "@/lib/create-request-utils";
import {
  hasVisibleSubmittedFields,
  visibleSubmittedFieldAnswers,
} from "@/lib/field-answer-display";
import type { RequestDetail } from "@/lib/requests-api";

export function RequestDetailSubmitted({
  req,
  isRequester,
  forManager = false,
}: {
  req: RequestDetail;
  isRequester: boolean;
  forManager?: boolean;
}) {
  const submittedFields = visibleSubmittedFieldAnswers(req.fieldAnswers);
  const hasFormAnswers = hasVisibleSubmittedFields(req.fieldAnswers);
  const title = isRequester
    ? "What you submitted"
    : `What ${req.createdBy.fullName} submitted`;
  const description = forManager
    ? "Exact answers from the request form — only fields the requester filled in."
    : "Details provided when this request was created";

  return (
    <RequestDetailSection id="request-submitted" title={title} description={description}>
      <dl className="divide-y divide-zamtel-border">
        {hasFormAnswers ? (
          <>
            {submittedFields.map((a) => (
              <DetailField key={a.fieldKey} label={a.label} value={a.display} />
            ))}
            <DetailField label="Priority" value={priorityLabel(req.priority)} />
          </>
        ) : (
          <>
            <DetailField label="Request title" value={req.title} />
            {req.description ? <DetailField label="Description" value={req.description} /> : null}
            <DetailField
              label="Due date"
              value={req.deadline?.trim() ? req.deadline : "No due date set"}
            />
            <DetailField label="Priority" value={priorityLabel(req.priority)} />
          </>
        )}
      </dl>
    </RequestDetailSection>
  );
}
