import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { MetadataChip } from "@/components/shared/detail-field";
import { RequestDetailSection } from "@/components/request-detail/request-detail-section";
import { hasVisibleSubmittedFields } from "@/lib/field-answer-display";
import type { RequestDetail } from "@/lib/requests-api";

export function RequestDetailHeader({
  req,
  showManagerContext = false,
}: {
  req: RequestDetail;
  showManagerContext?: boolean;
}) {
  const hasFormAnswers = hasVisibleSubmittedFields(req.fieldAnswers);

  if (showManagerContext) {
    return (
      <RequestDetailSection
        id="request-identity"
        title={req.requestNumber}
        description={req.title}
      >
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-brand-dark">Request type</dt>
            <dd className="mt-1 text-sm font-semibold text-zamtel-text">{req.requestType}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-brand-dark">Submitted by</dt>
            <dd className="mt-1 text-sm font-semibold text-zamtel-text">
              {req.createdBy.fullName}
              {req.sourceDepartment ? ` · ${req.sourceDepartment}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-brand-dark">Your team</dt>
            <dd className="mt-1 text-sm font-semibold text-zamtel-text">{req.department}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-brand-dark">Status</dt>
            <dd className="mt-1.5">
              <StatusBadge status={req.status} />
            </dd>
          </div>
        </dl>
      </RequestDetailSection>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-brand-dark">Request</p>
        <h2 className="text-xl font-bold tracking-tight text-brand-dark sm:text-2xl">{req.requestNumber}</h2>
        <p className="mt-1 text-base font-medium text-zamtel-text">{req.title}</p>
        {!hasFormAnswers && req.description ? (
          <p className="mt-2 text-sm leading-relaxed text-zamtel-text">{req.description}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={req.status} />
        {!hasFormAnswers ? <PriorityBadge priority={req.priority} /> : null}
        {!hasFormAnswers ? (
          <>
            <MetadataChip>{req.department}</MetadataChip>
            <MetadataChip>{req.requestType}</MetadataChip>
            {req.deadline ? <MetadataChip>Due {req.deadline}</MetadataChip> : null}
          </>
        ) : null}
        <MetadataChip>By {req.createdBy.fullName}</MetadataChip>
      </div>
    </div>
  );
}
