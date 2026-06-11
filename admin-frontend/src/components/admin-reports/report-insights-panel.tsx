import { AlertTriangle, CircleCheck, Info } from "lucide-react";
import type { ReportInsight } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const tone = {
  high: {
    icon: AlertTriangle,
    border: "border-red-200 bg-red-50/80",
    iconCls: "text-red-600",
    title: "text-red-900",
  },
  medium: {
    icon: AlertTriangle,
    border: "border-amber-200 bg-amber-50/80",
    iconCls: "text-amber-700",
    title: "text-amber-950",
  },
  info: {
    icon: CircleCheck,
    border: "border-brand-primary/20 bg-brand-primary/5",
    iconCls: "text-brand-primary",
    title: "text-brand-dark",
  },
} as const;

export function ReportInsightsPanel({ insights }: { insights: ReportInsight[] }) {
  return (
    <section className="rounded-panel border border-zamtel-border bg-white p-4 shadow-card">
      <h2 className="text-sm font-bold text-brand-dark">What needs attention</h2>
      <p className="mt-0.5 text-xs text-zamtel-muted">Suggested actions based on live request data.</p>
      <ul className="mt-4 space-y-3">
        {insights.map((item, i) => {
          const t = tone[item.severity];
          const Icon = t.icon;
          return (
            <li
              key={`${item.title}-${i}`}
              className={cn("flex gap-3 rounded-control border px-3 py-3", t.border)}
            >
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", t.iconCls)} aria-hidden />
              <div>
                <p className={cn("text-sm font-bold", t.title)}>{item.title}</p>
                <p className="mt-0.5 text-sm text-slate-700">{item.detail}</p>
              </div>
            </li>
          );
        })}
        {!insights.length ? (
          <li className="flex gap-3 rounded-control border border-zamtel-border px-3 py-3 text-sm text-zamtel-muted">
            <Info className="h-5 w-5 shrink-0" aria-hidden />
            No insights for this filter yet.
          </li>
        ) : null}
      </ul>
    </section>
  );
}
