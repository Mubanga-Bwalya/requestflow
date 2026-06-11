import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Stronger border for primary workflow sections (e.g. manager actions). */
  emphasis?: boolean;
};

export function RequestDetailSection({ id, title, description, children, className, emphasis }: Props) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "overflow-hidden rounded-card border-2 border-zamtel-border bg-surface shadow-card",
        emphasis && "border-brand-dark/30",
        className,
      )}
    >
      <header className="border-b border-zamtel-border bg-zamtel-bg/60 px-5 py-4 md:px-6">
        <h2 id={id} className="text-base font-bold text-brand-dark">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-zamtel-text">{description}</p>
        ) : null}
      </header>
      <div className="px-5 py-5 md:px-6">{children}</div>
    </section>
  );
}
