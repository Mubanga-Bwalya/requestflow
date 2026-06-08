import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type TimelineTone = "completed" | "attention" | "neutral";

function toneForEvent(text: string): TimelineTone {
  const lower = text.toLowerCase();
  if (
    lower.includes("missing information") ||
    lower.includes("needs more information") ||
    lower.includes("sent back") ||
    lower.includes("reopen") ||
    lower.includes("action needed")
  ) {
    return "attention";
  }
  if (
    lower.includes("submitted") ||
    lower.includes("accepted") ||
    lower.includes("approved") ||
    lower.includes("completed") ||
    lower.includes("assigned")
  ) {
    return "completed";
  }
  return "neutral";
}

const dotClasses: Record<TimelineTone, string> = {
  completed: "border-brand-primary bg-brand-primary text-white",
  attention: "border-brand-magenta bg-brand-magenta text-white",
  neutral: "border-zamtel-border bg-white",
};

export function ActivityTimeline({ items, emptyMessage = "No updates yet" }: { items: string[]; emptyMessage?: string }) {
  if (!items.length) {
    return <p className="text-sm text-zamtel-muted">{emptyMessage}</p>;
  }

  return (
    <ol className="relative space-y-0">
      {items.map((item, index) => {
        const tone = toneForEvent(item);
        const isLast = index === items.length - 1;
        return (
          <li key={`${index}-${item.slice(0, 24)}`} className="relative flex gap-3 pb-5 last:pb-0">
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
            <p className="min-w-0 pt-0.5 text-sm leading-relaxed text-zamtel-text">{item}</p>
          </li>
        );
      })}
    </ol>
  );
}
