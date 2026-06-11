export type ReportInsight = {
  severity: 'high' | 'medium' | 'info';
  title: string;
  detail: string;
};

export type ReportBreakdownItem = {
  key: string;
  label: string;
  count: number;
  percent: number;
};

export type AdminReportsPayload = {
  departmentFilter: string | null;
  kpis: {
    totalRequests: number;
    activeRequests: number;
    completedThisMonth: number;
    completedLastMonth: number;
    overdue: number;
    avgProgress: number;
    awaitingAcceptance: number;
    needsInformation: number;
    readyForReview: number;
    submittedThisMonth: number;
  };
  statusBreakdown: ReportBreakdownItem[];
  departmentBreakdown: ReportBreakdownItem[];
  priorityBreakdown: ReportBreakdownItem[];
  insights: ReportInsight[];
};
