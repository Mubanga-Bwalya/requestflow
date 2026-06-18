import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-brand-primary/10", className)} aria-hidden />;
}

/** Mobile cards + desktop table rows matching DataTable layout. */
export function DataListSkeleton({
  rowCount = 5,
  columnCount = 6,
  className,
}: {
  rowCount?: number;
  columnCount?: number;
  className?: string;
}) {
  return (
    <div className={className} role="status" aria-label="Loading list">
      <ul className="space-y-3 lg:hidden">
        {Array.from({ length: rowCount }, (_, i) => (
          <li
            key={`mobile-sk-${i}`}
            className="rounded-card border border-zamtel-border bg-white p-4 shadow-card"
          >
            <Skeleton className="h-5 w-3/4 max-w-[240px]" />
            <div className="mt-2.5 flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="mt-3 space-y-2 border-t border-zamtel-border pt-3">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-5/6" />
            </div>
            <Skeleton className="mt-4 h-11 w-full rounded-control" />
          </li>
        ))}
      </ul>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zamtel-border">
              {Array.from({ length: columnCount }, (_, i) => (
                <th key={`th-sk-${i}`} className="px-3 py-2.5">
                  <Skeleton className="h-3.5 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rowCount }, (_, ri) => (
              <tr key={`tr-sk-${ri}`} className="border-b border-zamtel-border/60">
                {Array.from({ length: columnCount }, (_, ci) => (
                  <td key={`td-sk-${ri}-${ci}`} className="px-3 py-3">
                    <Skeleton className={cn("h-4", ci === 0 ? "w-40" : "w-20")} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminDashboardStatSkeletons({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Card key={`dash-stat-sk-${i}`} className="relative overflow-hidden">
          <div className="absolute left-0 top-0 h-1 w-full bg-brand-primary/30" aria-hidden />
          <CardContent>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export function TimelineListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <ul className="mt-3 min-w-0 space-y-3" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <li key={`tl-sk-${i}`} className="flex min-w-0 gap-3">
          <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-primary/20" aria-hidden />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-full max-w-lg" />
            <Skeleton className="h-3 w-24" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AdminSettingsSkeleton() {
  return (
    <div
      className="grid min-w-0 gap-4 md:col-span-2 md:grid-cols-2"
      role="status"
      aria-label="Loading settings"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div key={`settings-field-sk-${i}`} className="min-w-0">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-10 w-full rounded-control" />
        </div>
      ))}
      <div className="min-w-0 md:col-span-2">
        <Skeleton className="h-5 w-56" />
      </div>
      <Skeleton className="h-10 w-36 rounded-control md:col-span-2" />
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading reports">
      <Skeleton className="h-4 w-72 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={`kpi-sk-${i}`} className="relative overflow-hidden">
            <div className="absolute left-0 top-0 h-1 w-full bg-brand-primary/30" aria-hidden />
            <CardContent>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-3 h-9 w-14" />
              <Skeleton className="mt-2 h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card>
          <CardContent className="space-y-3 py-4">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={`insight-sk-${i}`} className="h-16 w-full rounded-md" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 py-4">
            <Skeleton className="h-5 w-44" />
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={`chart-sk-${i}`} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
