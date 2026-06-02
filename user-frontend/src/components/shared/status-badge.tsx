import { cn } from "@/lib/utils";

function normalize(raw: string) {
  return raw.trim().toUpperCase().replaceAll(" ", "_");
}

function statusClasses(status: string) {
  const s = normalize(status);

  if (s === "COMPLETED" || s === "APPROVED") {
    return "border-brand-lime/50 bg-brand-lime text-brand-dark";
  }

  if (s === "IN_PROGRESS") {
    return "border-brand-primary/40 bg-brand-primary/10 text-brand-dark";
  }

  if (s === "ASSIGNED" || s === "ACCEPTED" || s === "READY_FOR_REVIEW" || s === "SUBMITTED") {
    return "border-brand-dark/25 bg-white text-brand-dark";
  }

  if (s === "NEEDS_INFORMATION") {
    return "border-amber-300 bg-amber-50 text-amber-900";
  }

  if (s === "REJECTED" || s === "CANCELLED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (s === "DRAFT" || s === "REOPENED" || s === "TODO") {
    return "border-slate-200 bg-slate-100 text-slate-700";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function StatusBadge({status}:{status:string}){
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", statusClasses(status))}>
      {status.replaceAll("_"," ")}
    </span>
  );
}
