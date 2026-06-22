"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiErrorMessage } from "@/lib/api-error";
import {
  createDepartment,
  updateDepartment,
  type ApiDepartment,
  type ApiDepartmentSection,
} from "@/lib/departments-api";
import { fetchDepartmentUsers } from "@/lib/users-api";

type ManagerOption = { id: string; fullName: string };

type Draft = { name: string; managerUserId: string; isActive: boolean };

const emptyDraft = (): Draft => ({ name: "", managerUserId: "", isActive: true });

/**
 * Manages the sub-sections of a (top-level) department: list, add, and edit each
 * section's name, manager and status. A section is a child department, so this
 * just drives the same create/update department endpoints with a fixed parent.
 */
export function SectionsPanel({
  department,
  parentManagers,
  onChanged,
}: {
  department: ApiDepartment;
  /** Users in the parent department — candidate section managers. */
  parentManagers: ManagerOption[];
  onChanged: () => Promise<void> | void;
}) {
  const sections = department.sections ?? [];
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [sectionManagers, setSectionManagers] = useState<ManagerOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When editing an existing section, its own members are also candidate
  // managers (they may already have moved out of the parent's direct roster).
  useEffect(() => {
    if (!editingId || editingId === "new") {
      setSectionManagers([]);
      return;
    }
    const section = sections.find((s) => s.id === editingId);
    if (!section) return;
    let cancelled = false;
    fetchDepartmentUsers(section.name)
      .then((users) => {
        if (!cancelled) setSectionManagers(users.map((u) => ({ id: u.id, fullName: u.fullName })));
      })
      .catch(() => {
        if (!cancelled) setSectionManagers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [editingId, sections]);

  const managerOptions = useMemo(() => {
    const byId = new Map<string, ManagerOption>();
    for (const m of parentManagers.concat(sectionManagers)) byId.set(m.id, m);
    return Array.from(byId.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [parentManagers, sectionManagers]);

  function startAdd() {
    setEditingId("new");
    setDraft(emptyDraft());
    setError(null);
  }

  function startEdit(section: ApiDepartmentSection) {
    setEditingId(section.id);
    setDraft({
      name: section.name,
      managerUserId: section.manager?.id ?? "",
      isActive: section.isActive,
    });
    setError(null);
  }

  function cancel() {
    setEditingId(null);
    setError(null);
  }

  async function save() {
    const name = draft.name.trim();
    if (name.length < 2) {
      setError("Section name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId === "new") {
        await createDepartment({
          name,
          parentDepartmentId: department.id,
          managerUserId: draft.managerUserId || undefined,
          isActive: draft.isActive,
        });
      } else if (editingId) {
        await updateDepartment(editingId, {
          name,
          managerUserId: draft.managerUserId || null,
          isActive: draft.isActive,
        });
      }
      await onChanged();
      setEditingId(null);
    } catch (e) {
      setError(apiErrorMessage(e, "Could not save the section. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-md border border-brand-dark/10 bg-white p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-brand-dark">Sub-sections</p>
        {editingId === null ? (
          <Button size="compact" variant="outline" type="button" onClick={startAdd}>
            Add sub-section
          </Button>
        ) : null}
      </div>
      <p className="mt-0.5 text-xs text-zamtel-muted">
        Each section is part of {department.name} and can have its own manager and request types.
      </p>

      {sections.length === 0 && editingId === null ? (
        <p className="mt-3 text-sm text-zamtel-muted">No sub-sections yet.</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {sections.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md border border-brand-dark/10 px-3 py-2 text-sm"
            >
              <span className="min-w-0">
                <span className="font-medium text-brand-dark">{s.name}</span>
                {!s.isActive ? <span className="ml-2 text-xs text-zamtel-muted">(inactive)</span> : null}
                <span className="mt-0.5 block text-xs text-zamtel-muted">
                  {s.manager ? `Manager: ${s.manager.fullName}` : "No manager"} · {s.userCount} user(s)
                </span>
              </span>
              {editingId === null ? (
                <Button size="compact" variant="outline" type="button" onClick={() => startEdit(s)}>
                  Edit
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {editingId !== null ? (
        <div className="mt-3 space-y-3 rounded-md border border-brand-primary/30 bg-brand-primary/5 p-3">
          <p className="text-sm font-medium text-brand-dark">
            {editingId === "new" ? "New sub-section" : "Edit sub-section"}
          </p>
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          <div>
            <label className="text-xs font-medium text-brand-dark">Name *</label>
            <Input
              className="mt-1"
              maxLength={120}
              value={draft.name}
              onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. IT Infrastructure"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-brand-dark">Section manager</label>
            <Select
              className="mt-1"
              value={draft.managerUserId}
              onChange={(e) => setDraft((p) => ({ ...p, managerUserId: e.target.value }))}
            >
              <option value="">No manager</option>
              {managerOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-brand-dark">Status</label>
            <Select
              className="mt-1"
              value={draft.isActive ? "Active" : "Inactive"}
              onChange={(e) => setDraft((p) => ({ ...p, isActive: e.target.value === "Active" }))}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button size="compact" variant="outline" type="button" onClick={cancel} disabled={saving}>
              Cancel
            </Button>
            <Button size="compact" type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save section"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
