import { ReactNode } from "react";

export function Tabs({children}:{children:ReactNode}){
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

export function Tab({active,children,onClick}:{active?:boolean;children:ReactNode;onClick?:()=>void}){
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md border border-brand-lime/40 bg-brand-primary px-3 py-1.5 text-sm font-medium text-white shadow-sm"
          : "rounded-md border border-brand-dark/15 bg-white/80 px-3 py-1.5 text-sm text-slate-700 hover:border-brand-primary/30 hover:bg-brand-primary/5"
      }
    >
      {children}
    </button>
  );
}

