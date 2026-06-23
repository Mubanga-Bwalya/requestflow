"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ApiDepartmentRosterUser } from "@/lib/departments-api";

export type AssignableMember = ApiDepartmentRosterUser & {
  currentSection: string | null;
};

type Props = {
  members: AssignableMember[];
  selectedIds: Set<string>;
  onToggle: (userId: string) => void;
  onSelectAll: (userIds: string[]) => void;
  emptyMessage: string;
  hint?: string;
};

export function SectionMemberPicker({
  members,
  selectedIds,
  onToggle,
  onSelectAll,
  emptyMessage,
  hint,
}: Props) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return members;
    return members.filter((m) => {
      const hay = [m.fullName, m.email, m.jobTitle ?? "", m.currentSection ?? ""]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [members, q]);

  const visibleIds = filtered.map((m) => m.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Search by name, email, or position…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-md"
          aria-label="Search team members"
        />
        {filtered.length > 0 ? (
          <button
            type="button"
            className="text-sm font-medium text-brand-primary hover:underline"
            onClick={() => onSelectAll(allVisibleSelected ? [] : visibleIds)}
          >
            {allVisibleSelected ? "Clear selection" : `Select all (${filtered.length})`}
          </button>
        ) : null}
      </div>

      {hint ? <p className="mt-3 text-sm text-zamtel-muted">{hint}</p> : null}

      {!filtered.length ? (
        <p className="mt-4 rounded-md border border-dashed border-zamtel-border bg-surface-subtle px-4 py-8 text-center text-sm text-zamtel-muted">
          {members.length ? "No members match your search." : emptyMessage}
        </p>
      ) : (
        <ul className="mt-4 max-h-[min(52vh,28rem)] space-y-2 overflow-y-auto pr-1">
          {filtered.map((member) => {
            const checked = selectedIds.has(member.id);
            return (
              <li key={member.id}>
                <label
                  className={cn(
                    "rf-clickable-row flex cursor-pointer gap-3 rounded-control border px-3 py-3 transition-colors sm:items-center",
                    checked
                      ? "border-brand-primary/40 bg-brand-primary/5"
                      : "border-zamtel-border bg-white hover:border-brand-primary/25",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand-primary sm:mt-0"
                    checked={checked}
                    onChange={() => onToggle(member.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-brand-dark">{member.fullName}</span>
                    <span className="mt-0.5 block truncate text-sm text-zamtel-muted">{member.email}</span>
                    <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zamtel-muted">
                      {member.jobTitle ? <span>{member.jobTitle}</span> : null}
                      {member.currentSection ? (
                        <span className="text-amber-800">Currently: {member.currentSection}</span>
                      ) : (
                        <span>Department-wide</span>
                      )}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
