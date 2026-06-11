import type { AdminReportsPayload, ReportInsight } from './admin-reports.types';

export function buildReportInsights(
  kpis: AdminReportsPayload['kpis'],
  departmentFilter: string | null,
): ReportInsight[] {
  const scope = departmentFilter
    ? `${departmentFilter} requests`
    : 'All departments';
  const insights: ReportInsight[] = [];

  if (kpis.overdue > 0) {
    insights.push({
      severity: 'high',
      title: `${kpis.overdue} overdue ${kpis.overdue === 1 ? 'request' : 'requests'}`,
      detail: `Past the deadline and still open (${scope}). Ask managers to reprioritise or update deadlines.`,
    });
  }

  if (kpis.awaitingAcceptance > 0) {
    insights.push({
      severity: 'high',
      title: `${kpis.awaitingAcceptance} new ${kpis.awaitingAcceptance === 1 ? 'submission' : 'submissions'} waiting`,
      detail:
        'Managers should accept, decline, or ask for more details in Incoming requests.',
    });
  }

  if (kpis.needsInformation > 0) {
    insights.push({
      severity: 'medium',
      title: `${kpis.needsInformation} blocked on missing information`,
      detail:
        'Requesters need to respond before work can continue. Check who owns each follow-up.',
    });
  }

  if (kpis.readyForReview > 0) {
    insights.push({
      severity: 'medium',
      title: `${kpis.readyForReview} ready for requester approval`,
      detail:
        'Work is done on the team side. Requesters should review and approve in My Requests.',
    });
  }

  if (kpis.activeRequests > 0 && kpis.avgProgress < 35) {
    insights.push({
      severity: 'medium',
      title: 'Low average progress on active work',
      detail: `Active requests are only ${kpis.avgProgress}% complete on average. Review assignments and milestones with team managers.`,
    });
  }

  if (
    kpis.completedThisMonth > kpis.completedLastMonth &&
    kpis.completedLastMonth > 0
  ) {
    const delta = kpis.completedThisMonth - kpis.completedLastMonth;
    insights.push({
      severity: 'info',
      title: `Throughput up ${delta} vs last month`,
      detail: `${kpis.completedThisMonth} requests finished this month compared with ${kpis.completedLastMonth} last month.`,
    });
  } else if (
    kpis.completedThisMonth < kpis.completedLastMonth &&
    kpis.completedLastMonth > 0
  ) {
    insights.push({
      severity: 'info',
      title: 'Fewer completions than last month',
      detail: `${kpis.completedThisMonth} finished this month vs ${kpis.completedLastMonth} last month. Worth a quick check with department leads.`,
    });
  }

  if (
    insights.length === 0 &&
    kpis.activeRequests === 0 &&
    kpis.totalRequests > 0
  ) {
    insights.push({
      severity: 'info',
      title: 'No open requests in this view',
      detail:
        'Everything in scope is finished or closed. Good time to review templates and staffing.',
    });
  }

  if (insights.length === 0 && kpis.totalRequests === 0) {
    insights.push({
      severity: 'info',
      title: 'No request data yet',
      detail:
        'Reports will populate once employees submit requests through the user portal.',
    });
  }

  return insights;
}
