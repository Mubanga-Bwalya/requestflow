import type { ReportBreakdownItem } from "@/lib/admin-api";

type Props = {
  title: string;
  items: ReportBreakdownItem[];
  emptyMessage: string;
};

export function ReportBarChart({ title, items, emptyMessage }: Props) {
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <section className="rounded-panel border border-zamtel-border bg-white p-4 shadow-card">
      <h2 className="text-sm font-bold text-brand-dark">{title}</h2>
      {items.length ? (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.key}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-brand-dark">{item.label}</span>
                <span className="shrink-0 text-zamtel-muted">
                  {item.count} ({item.percent}%)
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-brand-primary/10">
                <div
                  className="h-full rounded-full bg-brand-primary transition-all duration-300"
                  style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-zamtel-muted">{emptyMessage}</p>
      )}
    </section>
  );
}
