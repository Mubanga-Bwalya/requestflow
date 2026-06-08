import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("rf-card rounded-card border border-zamtel-border bg-surface shadow-card", className)}>
      {children}
    </section>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("p-5 md:p-6", className)}>{children}</div>;
}
