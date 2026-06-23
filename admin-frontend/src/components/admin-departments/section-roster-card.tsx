"use client";

import { useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApiDepartmentRosterSection, ApiDepartmentRosterUser } from "@/lib/departments-api";

function MemberRow({ user }: { user: ApiDepartmentRosterUser }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-zamtel-border/80 px-4 py-3 last:border-b-0 sm:grid sm:grid-cols-[1.4fr_1.2fr_1fr_auto] sm:items-center sm:gap-3">
      <div className="min-w-0">
        <p className="font-medium text-brand-dark">{user.fullName}</p>
        <p className="truncate text-sm text-zamtel-muted sm:hidden">{user.email}</p>
      </div>
      <p className="hidden truncate text-sm text-zamtel-muted sm:block">{user.email}</p>
      <p className="text-sm text-zamtel-muted">{user.jobTitle ?? "—"}</p>
      <span className="inline-flex w-fit rounded-full bg-brand-primary/10 px-2.5 py-0.5 text-xs font-medium text-brand-dark">
        {user.roleName ?? "—"}
      </span>
    </div>
  );
}

export function SectionRosterCard({
  title,
  memberCount,
  managerName,
  isActive,
  users,
  emptyMessage,
  defaultOpen = false,
  onEdit,
  onManageMembers,
  variant = "section",
}: {
  title: string;
  memberCount: number;
  managerName?: string | null;
  isActive: boolean;
  users: ApiDepartmentRosterUser[];
  emptyMessage: string;
  defaultOpen?: boolean;
  onEdit?: () => void;
  onManageMembers?: () => void;
  variant?: "section" | "unassigned";
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <article className="overflow-hidden rounded-card border border-zamtel-border bg-white shadow-card">
      <div className="flex flex-col gap-3 border-b border-zamtel-border/80 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              variant === "unassigned" ? "bg-amber-50 text-amber-800" : "bg-brand-primary/10 text-brand-primary",
            )}
          >
            <Users className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-brand-dark sm:text-lg">{title}</h2>
              <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-zamtel-muted">
                {memberCount} member{memberCount === 1 ? "" : "s"}
              </span>
              {!isActive ? (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  Inactive
                </span>
              ) : null}
            </span>
            <p className="mt-1 text-sm text-zamtel-muted">
              {variant === "unassigned"
                ? "Not assigned to any sub-section"
                : managerName
                  ? `Manager: ${managerName}`
                  : "No manager assigned"}
            </p>
          </span>
          <ChevronDown
            className={cn("mt-1 h-5 w-5 shrink-0 text-zamtel-muted transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>

        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {onManageMembers ? (
            <Button size="compact" variant="outline" type="button" onClick={onManageMembers}>
              Manage members
            </Button>
          ) : null}
          {onEdit ? (
            <Button size="compact" variant="outline" type="button" onClick={onEdit}>
              Edit
            </Button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div>
          {users.length > 0 ? (
            <>
              <div className="hidden border-b border-zamtel-border/80 bg-surface-subtle px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zamtel-muted sm:grid sm:grid-cols-[1.4fr_1.2fr_1fr_auto] sm:gap-3">
                <span>Name</span>
                <span>Email</span>
                <span>Position</span>
                <span>Access</span>
              </div>
              <div>
                {users.map((user) => (
                  <MemberRow key={user.id} user={user} />
                ))}
              </div>
            </>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-zamtel-muted sm:px-5">{emptyMessage}</p>
          )}
        </div>
      ) : null}
    </article>
  );
}

export type { ApiDepartmentRosterSection };
