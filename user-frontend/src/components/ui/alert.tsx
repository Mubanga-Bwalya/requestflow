import { type ReactNode } from "react";

export function Alert({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-slate-300 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-1 text-sm text-slate-600">{children}</div>
    </div>
  );
}
