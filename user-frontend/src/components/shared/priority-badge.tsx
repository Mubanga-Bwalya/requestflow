import { cn } from "@/lib/utils";

function normalize(raw: string) {
  return raw.trim().toUpperCase().replaceAll(" ", "_");
}

function priorityClasses(priority: string) {
  const p = normalize(priority);

  if (p === "URGENT") return "border-red-200 bg-red-50 text-red-700";
  if (p === "HIGH") return "border-brand-dark/30 bg-brand-dark text-white";
  if (p === "MEDIUM") return "border-brand-primary/30 bg-brand-primary/10 text-brand-dark";
  if (p === "LOW") return "border-slate-200 bg-slate-100 text-slate-700";

  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function PriorityBadge({priority}:{priority:string}){
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", priorityClasses(priority))}>
      {priority}
    </span>
  );
}
