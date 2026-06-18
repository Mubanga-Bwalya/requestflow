import type { ReactNode } from "react";
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
              <Skeleton className="h-3.5 w-2/3" />
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

export function ListCountSkeleton() {
  return <Skeleton className="inline-block h-4 w-36" />;
}

export function DashboardNextStepsSkeleton() {
  return (
    <ul className="mt-4 divide-y divide-zamtel-border" aria-hidden>
      {Array.from({ length: 3 }, (_, i) => (
        <li key={`step-sk-${i}`} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-9 w-full max-w-[120px] rounded-control sm:w-28" />
        </li>
      ))}
    </ul>
  );
}

export function DashboardRecentRequestsSkeleton() {
  return (
    <CardSkeleton>
      <Skeleton className="h-4 w-32" />
      <ul className="mt-4 space-y-2">
        {Array.from({ length: 3 }, (_, i) => (
          <li
            key={`recent-sk-${i}`}
            className="rounded-control border border-zamtel-border bg-white px-3 py-3"
          >
            <Skeleton className="h-4 w-3/4" />
            <div className="mt-2 flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </li>
        ))}
      </ul>
    </CardSkeleton>
  );
}

function CardSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-card border border-zamtel-border bg-white shadow-card">
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}
