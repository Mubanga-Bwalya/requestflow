import { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="rf-fade-in mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 h-1 w-14 rounded-full bg-brand-primary" aria-hidden />
        <h1 className="rf-headline hidden truncate md:block">{title}</h1>
        <p className="mt-0 text-sm leading-relaxed text-muted md:mt-2">{description}</p>
      </div>
      {actions ? <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto [&_a]:w-full [&_button]:w-full sm:[&_a]:w-auto sm:[&_button]:w-auto">{actions}</div> : null}
    </div>
  );
}
