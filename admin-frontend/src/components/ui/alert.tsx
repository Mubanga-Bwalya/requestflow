import { ReactNode } from "react";

export function Alert({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-zamtel-border bg-zamtel-bg p-4">
      <p className="text-sm font-semibold text-brand-dark">{title}</p>
      <div className="mt-1 text-sm text-zamtel-muted">{children}</div>
    </div>
  );
}
