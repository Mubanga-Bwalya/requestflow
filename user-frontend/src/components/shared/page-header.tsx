import { ReactNode } from "react";

export function PageHeader({title,description,actions}:{title:string;description:string;actions?:ReactNode}){
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 h-1 w-14 rounded-full bg-brand-primary" aria-hidden />
        <h1 className="truncate text-2xl font-semibold text-brand-dark">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
      {actions?<div className="flex items-center gap-2">{actions}</div>:null}
    </div>
  );
}
