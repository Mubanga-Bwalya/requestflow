import { Skeleton } from "@/components/shared/skeleton";

export function RequestDetailSkeleton() {
  return (
    <div className="w-full space-y-6" role="status" aria-label="Loading request details">
      <div className="rounded-card border border-zamtel-border bg-white p-5 shadow-card">
        <Skeleton className="h-6 w-2/3 max-w-md" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-card border border-zamtel-border bg-white p-5 shadow-card">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-4 h-11 w-full max-w-xs rounded-control" />
          </div>
          <div className="rounded-card border border-zamtel-border bg-white p-5 shadow-card space-y-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-card border border-zamtel-border bg-white p-5 shadow-card space-y-3">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: 4 }, (_, i) => (
              <div key={`summary-sk-${i}`} className="flex justify-between gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
          <div className="rounded-card border border-zamtel-border bg-white p-5 shadow-card space-y-3">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={`act-sk-${i}`} className="h-12 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
