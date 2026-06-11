import { ReportBarChart } from "@/components/admin-reports/report-bar-chart";
import { ReportInsightsPanel } from "@/components/admin-reports/report-insights-panel";
import { ReportKpiGrid } from "@/components/admin-reports/report-kpi-grid";
import type { AdminReportsData } from "@/lib/admin-api";

export function ReportsView({ data }: { data: AdminReportsData }) {
  const scope = data.departmentFilter ?? "All departments";

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Showing <span className="font-semibold text-brand-dark">{scope}</span> — use the filter above
        to compare departments or focus on one team.
      </p>

      <ReportKpiGrid kpis={data.kpis} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <ReportInsightsPanel insights={data.insights} />
        <ReportBarChart
          title="Pipeline bottlenecks"
          items={data.statusBreakdown.filter((s) =>
            ["SUBMITTED", "NEEDS_INFORMATION", "READY_FOR_REVIEW", "REOPENED"].includes(s.key),
          )}
          emptyMessage="No bottlenecks in this view — workflow is moving."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportBarChart
          title="Requests by status"
          items={data.statusBreakdown}
          emptyMessage="No requests match this filter."
        />
        <ReportBarChart
          title="Requests by priority"
          items={data.priorityBreakdown}
          emptyMessage="No priority data yet."
        />
      </div>

      <ReportBarChart
        title="Requests by department"
        items={data.departmentBreakdown}
        emptyMessage="No department breakdown for this filter."
      />
    </div>
  );
}
