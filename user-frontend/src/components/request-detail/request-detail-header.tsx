import { PriorityBadge } from "@/components/shared/priority-badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { MetadataChip } from "@/components/shared/detail-field";
import type { RequestDetail } from "@/lib/requests-api";

export function RequestDetailHeader({ req }: { req: RequestDetail }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-brand-dark sm:text-2xl">{req.requestNumber}</h2>
        <p className="mt-1 text-base text-zamtel-text">{req.title}</p>
        {req.description ? <p className="mt-1 text-sm text-zamtel-muted">{req.description}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={req.status} />
        <PriorityBadge priority={req.priority} />
        <MetadataChip>{req.department}</MetadataChip>
        <MetadataChip>{req.requestType}</MetadataChip>
        {req.deadline ? <MetadataChip>Due {req.deadline}</MetadataChip> : null}
        <MetadataChip>By {req.createdBy.fullName}</MetadataChip>
      </div>
    </div>
  );
}
