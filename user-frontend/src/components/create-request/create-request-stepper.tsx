import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, label: "Department" },
  { id: 2, label: "Details" },
  { id: 3, label: "Review" },
] as const;

export function CreateRequestStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Create request progress" className="rounded-card border border-zamtel-border bg-zamtel-bg/50 p-4">
      <p className="mb-3 text-center text-sm font-semibold text-brand-dark md:mb-0 md:sr-only">
        Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]?.label ?? ""}
      </p>
      <ol className="flex items-start justify-between gap-2">
        {STEPS.map((step, index) => {
          const completed = currentStep > step.id;
          const current = currentStep === step.id;
          const upcoming = currentStep < step.id;

          return (
            <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {index > 0 ? (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-colors",
                      completed || current ? "bg-brand-primary" : "bg-zamtel-border",
                    )}
                    aria-hidden
                  />
                ) : null}
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                    completed && "border-brand-primary bg-brand-primary text-white",
                    current && "border-brand-magenta bg-white text-brand-dark ring-2 ring-brand-magenta/30",
                    upcoming && "border-zamtel-border bg-white text-zamtel-muted",
                  )}
                  aria-current={current ? "step" : undefined}
                >
                  {completed ? <Check className="h-4 w-4" aria-hidden /> : step.id}
                </div>
                {index < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-colors",
                      completed ? "bg-brand-primary" : "bg-zamtel-border",
                    )}
                    aria-hidden
                  />
                ) : null}
              </div>
              <span
                className={cn(
                  "mt-2 hidden text-center text-xs font-medium md:block",
                  current ? "text-brand-dark" : completed ? "text-brand-primary" : "text-zamtel-muted",
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
