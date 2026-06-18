import { Sparkles } from "lucide-react";
import { DashboardNextStepsSkeleton } from "@/components/shared/skeleton";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import type { NextStep } from "@/lib/dashboard-next-steps";

type Props = { loading: boolean; steps: NextStep[] };

export function DashboardNextStepsPanel({ loading, steps }: Props) {
  return (
    <Card className="lg:col-span-3">
      <CardContent className="flex min-h-[280px] flex-col py-5">
        <p className="text-sm font-bold text-brand-dark">Do next</p>
        {loading ? (
          <DashboardNextStepsSkeleton />
        ) : steps.length === 0 ? (
          <div className="mt-4 flex flex-1 items-center">
            <EmptyState
              className="w-full"
              icon={Sparkles}
              heading="You're all caught up"
              body="No requests need your attention right now."
              action={{ href: "/requests", label: "View my requests" }}
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-zamtel-border">
            {steps.map((step) => (
              <li key={step.id} className="flex flex-col gap-3 py-3.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span
                  className={
                    step.urgent
                      ? "min-w-0 border-l-[3px] border-l-brand-magenta pl-3 text-sm font-medium text-brand-dark"
                      : "min-w-0 text-sm text-brand-dark"
                  }
                >
                  {step.label}
                </span>
                <ButtonLink href={step.href} size="compact" variant="outline" className="w-full shrink-0 sm:w-auto">
                  {step.cta}
                </ButtonLink>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
