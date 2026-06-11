import { Check } from "lucide-react";
import type { ActivityLogEntry } from "@/lib/requests-api";
import { cn } from "@/lib/utils";

type TimelineTone = "completed" | "attention" | "neutral";

const ATTENTION_ACTIONS = new Set([
  "REQUEST_NEEDS_INFORMATION",
  "REQUEST_REOPENED",
  "REQUEST_REJECTED",
]);

function toneFromDescription(text: string): TimelineTone {
  const lower = text.toLowerCase();
  if (
    lower.includes("missing information") ||
    lower.includes("needs more information") ||
    lower.includes("sent back") ||
    lower.includes("reopened") ||
    lower.includes("reopen") ||
    lower.includes("rejected") ||
    lower.includes("declined")
  ) {
    return "attention";
  }
  return "completed";
}

function toneForEntry(entry: ActivityLogEntry): TimelineTone {
  if (ATTENTION_ACTIONS.has(entry.action)) return "attention";
  if (entry.action === "REQUEST_PROGRESS_UPDATED") {
    return toneFromDescription(entry.description);
  }
  return "completed";
}

const dotClasses: Record<TimelineTone, string> = {
  completed: "border-brand-primary bg-brand-primary text-white",
  attention: "border-brand-magenta bg-brand-magenta text-white",
  neutral: "border-zamtel-border bg-white",
};

export function ActivityTimeline({
  items,
  emptyMessage = "No updates yet",
}: {
  items: ActivityLogEntry[];
  emptyMessage?: string;
}) {
  if (!items.length) {
    return <p className="text-sm text-zamtel-muted">{emptyMessage}</p>;
  }

  return (
    <ol className="relative space-y-0">
      {items.map((item, index) => {
        const tone = toneForEntry(item);
        const isLast = index === items.length - 1;
        return (
          <li key={`${index}-${item.action}-${item.description.slice(0, 24)}`} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast ? (
              <span
                className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-zamtel-border"
                aria-hidden
              />
            ) : null}
            <span
              className={cn(
                "relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                dotClasses[tone],
              )}
              aria-hidden
            >
              {tone === "completed" ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
              {tone === "attention" ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
            </span>
            <p className="min-w-0 pt-0.5 text-sm leading-relaxed text-zamtel-text">{item.description}</p>
          </li>
        );
      })}
    </ol>
  );
}
