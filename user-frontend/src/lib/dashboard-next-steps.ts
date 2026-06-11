import { canAssignRequest } from "@/lib/role-utils";
import type { RequestItem } from "@/types/request";
import type { Assignment } from "@/types/task";

export type NextStep = {
  id: string;
  priority: number;
  label: string;
  href: string;
  cta: string;
  urgent?: boolean;
};

export function buildNextSteps(
  requests: RequestItem[],
  assignments: Assignment[],
  inbox: RequestItem[],
  isManager: boolean,
): NextStep[] {
  const steps: NextStep[] = [];

  if (isManager) {
    for (const r of inbox) {
      if (r.status === "SUBMITTED") {
        steps.push({
          id: `inbox-${r.id}`,
          priority: 1,
          label: `Review ${r.requestNumber} — ${r.title}`,
          href: `/requests/${r.id}?from=inbox`,
          cta: "Review",
        });
      } else if (canAssignRequest(r)) {
        steps.push({
          id: `assign-${r.id}`,
          priority: 2,
          label: `Assign team for ${r.requestNumber}`,
          href: `/requests/${r.id}?from=inbox`,
          cta: "Assign",
        });
      }
    }
  }

  for (const r of requests) {
    if (r.status === "NEEDS_INFORMATION") {
      steps.push({
        id: `info-${r.id}`,
        priority: 3,
        label: `Provide details for ${r.requestNumber}`,
        href: `/requests/${r.id}`,
        cta: "Open",
        urgent: true,
      });
    } else if (r.status === "READY_FOR_REVIEW" || r.status === "COMPLETED") {
      steps.push({
        id: `approve-${r.id}`,
        priority: 4,
        label: `Approve ${r.requestNumber} — ${r.title}`,
        href: `/requests/${r.id}`,
        cta: "Review",
        urgent: true,
      });
    }
  }

  for (const a of assignments) {
    if (a.status === "ASSIGNED") {
      steps.push({
        id: `task-${a.id}`,
        priority: 5,
        label: `Start task: ${a.title}`,
        href: a.requestId ? `/requests/${a.requestId}?from=tasks` : `/tasks/${a.id}`,
        cta: "Open",
      });
    }
  }

  return steps.sort((a, b) => a.priority - b.priority).slice(0, 5);
}
