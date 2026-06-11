import { Card, CardContent } from "@/components/ui/card";
import type { AdminReportsData } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

type Kpi = {
  label: string;
  value: string;
  hint?: string;
  alert?: boolean;
};

export function ReportKpiGrid({ kpis }: { kpis: AdminReportsData["kpis"] }) {
  const monthDelta = kpis.completedThisMonth - kpis.completedLastMonth;
  const deltaLabel =
    kpis.completedLastMonth > 0
      ? `${monthDelta >= 0 ? "+" : ""}${monthDelta} vs last month`
      : "First month of data";

  const cards: Kpi[] = [
    {
      label: "Active requests",
      value: String(kpis.activeRequests),
      hint: `${kpis.totalRequests} total in scope`,
    },
    {
      label: "Completed this month",
      value: String(kpis.completedThisMonth),
      hint: deltaLabel,
    },
    {
      label: "New submissions (month)",
      value: String(kpis.submittedThisMonth),
      hint: "Submitted in calendar month",
    },
    {
      label: "Average progress",
      value: `${kpis.avgProgress}%`,
      hint: "On open work only",
    },
    {
      label: "Waiting for manager",
      value: String(kpis.awaitingAcceptance),
      hint: "Need accept / decline",
      alert: kpis.awaitingAcceptance > 0,
    },
    {
      label: "Overdue",
      value: String(kpis.overdue),
      hint: "Past deadline, not closed",
      alert: kpis.overdue > 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((item) => (
        <Card
          key={item.label}
          className={cn(
            "relative overflow-hidden",
            item.alert && "border-red-200 ring-1 ring-red-100",
          )}
        >
          <div
            className={cn(
              "absolute left-0 top-0 h-1 w-full",
              item.alert ? "bg-red-500" : "bg-brand-primary",
            )}
            aria-hidden
          />
          <CardContent>
            <p className="text-sm text-zamtel-muted">{item.label}</p>
            <p className="mt-1 text-3xl font-extrabold text-brand-dark">{item.value}</p>
            {item.hint ? <p className="mt-1 text-xs text-zamtel-muted">{item.hint}</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
