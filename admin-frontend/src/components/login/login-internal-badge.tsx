import { Shield } from "lucide-react";

export function LoginInternalBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zamtel-border bg-white/95 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-brand-dark shadow-card backdrop-blur-sm">
      <Shield className="h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden />
      <span>Admin Access Only</span>
    </div>
  );
}
