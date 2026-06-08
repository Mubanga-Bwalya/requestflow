import type { LucideIcon } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

type Action = { href: string; label: string };

type Props = {
  icon: LucideIcon;
  heading: string;
  body: string;
  secondaryBody?: string;
  action?: Action;
  attention?: boolean;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  heading,
  body,
  secondaryBody,
  action,
  attention = false,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-card border border-zamtel-border bg-zamtel-bg/60 px-6 py-8 text-center",
        className,
      )}
    >
      <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-brand-primary/20 bg-brand-primary/8">
        <Icon className="h-7 w-7 text-brand-primary" aria-hidden />
        {attention ? (
          <span
            className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-magenta"
            aria-hidden
          />
        ) : null}
      </div>
      <h3 className="text-base font-bold text-brand-dark">{heading}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zamtel-muted">{body}</p>
      {secondaryBody ? (
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-zamtel-muted">{secondaryBody}</p>
      ) : null}
      {action ? (
        <div className="mt-5">
          <ButtonLink href={action.href} variant="outline" size="compact">
            {action.label}
          </ButtonLink>
        </div>
      ) : null}
    </div>
  );
}
