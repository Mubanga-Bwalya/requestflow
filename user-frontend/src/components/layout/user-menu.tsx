"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { LogOut, Settings, UserRound } from "lucide-react";

type Props = {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  displayName: string;
  role: string;
  avatarDataUrl: string | null;
  onLogout: () => void;
  menuRef: React.RefObject<HTMLDivElement>;
};

export function UserMenu({ open, onToggle, onClose, displayName, role, avatarDataUrl, onLogout, menuRef }: Props) {
  const router = useRouter();
  const initials = useMemo(
    () =>
      displayName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    [displayName],
  );

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        type="button"
        className="rf-clickable rf-focus-ring flex min-h-11 items-center gap-3 rounded-control border border-zamtel-border bg-white px-3 py-2 shadow-card transition-[colors,transform,box-shadow] duration-200 hover:-translate-y-px hover:border-brand-primary/30 hover:bg-brand-primary/5 hover:shadow-md motion-reduce:hover:translate-y-0"
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={onToggle}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-dark">
          {avatarDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarDataUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-semibold">{initials || <UserRound className="h-4 w-4" aria-hidden />}</span>
          )}
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-900">{displayName}</p>
          <p className="text-xs text-slate-600" title={role}>
            {role}
          </p>
        </div>
        <UserRound className="h-4 w-4 text-brand-primary sm:hidden" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="rf-popover absolute right-0 z-50 mt-2 min-w-[180px] overflow-hidden rounded-lg border border-brand-dark/10 bg-white py-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            className="rf-clickable-row rf-focus-ring flex w-full min-h-11 items-center gap-2 px-4 py-2.5 text-left text-sm text-brand-dark"
            onClick={() => {
              onClose();
              router.push("/settings");
            }}
          >
            <Settings className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
            Settings
          </button>
          <button
            type="button"
            role="menuitem"
            className="rf-clickable rf-focus-ring flex w-full min-h-11 items-center gap-2 border-t border-zamtel-border px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50 active:bg-red-100"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
