"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiErrorMessage } from "@/lib/api-error";
import {
  assignSectionMembers,
  createDepartment,
  fetchDepartmentRoster,
  invalidateDepartmentCaches,
  unassignSectionMembers,
  updateDepartment,
  type ApiDepartmentRoster,
  type ApiDepartmentRosterSection,
} from "@/lib/departments-api";
import { fetchDepartmentUsers, fetchUsers } from "@/lib/users-api";
import type { AssignableMember } from "@/components/admin-departments/section-member-picker";

type ManagerOption = { id: string; fullName: string; email?: string | null; jobTitle?: string | null };
type SectionDraft = { name: string; managerUserId: string; isActive: boolean };

type ActiveFlow =
  | {
      mode: "create";
      step: 1 | 2;
      sectionId: string | null;
      sectionName: string;
    }
  | {
      mode: "edit";
      step: 1;
      sectionId: string;
      sectionName: string;
    }
  | {
      mode: "members";
      sectionId: string;
      sectionName: string;
    };

const emptyDraft = (): SectionDraft => ({ name: "", managerUserId: "", isActive: true });

function buildAssignablePool(
  roster: ApiDepartmentRoster,
  targetSectionId: string,
): AssignableMember[] {
  const pool: AssignableMember[] = [];
  for (const user of roster.departmentUsers) {
    pool.push({ ...user, currentSection: null });
  }
  for (const section of roster.sections) {
    if (section.id === targetSectionId) continue;
    for (const user of section.users) {
      pool.push({ ...user, currentSection: section.name });
    }
  }
  return pool.sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function useDepartmentSections(departmentId: string) {
  const [roster, setRoster] = useState<ApiDepartmentRoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [parentManagers, setParentManagers] = useState<ManagerOption[]>([]);
  const [flow, setFlow] = useState<ActiveFlow | null>(null);
  const [draft, setDraft] = useState<SectionDraft>(emptyDraft());
  const [sectionManagers, setSectionManagers] = useState<ManagerOption[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchDepartmentRoster(departmentId);
      setRoster(data);
      const parentUsers = await fetchUsers({
        departmentName: data.department.name,
        limit: 500,
        status: "Active",
      });
      setParentManagers(
        parentUsers.items.map((u) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          jobTitle: u.jobTitle,
        })),
      );
    } catch (e) {
      setRoster(null);
      setLoadError(apiErrorMessage(e, "Could not load department structure."));
    } finally {
      setLoading(false);
    }
  }, [departmentId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const editingSectionId = useMemo(() => {
    if (!flow || flow.mode === "members") return null;
    if (flow.mode === "create" && flow.step === 2) return null;
    return flow.mode === "create" ? "new" : flow.sectionId;
  }, [flow]);

  useEffect(() => {
    if (!flow || flow.mode === "members" || flow.mode === "create") {
      setSectionManagers([]);
      return;
    }
    const section = roster?.sections.find((s) => s.id === flow.sectionId);
    if (!section) return;
    let cancelled = false;
    fetchDepartmentUsers(section.name)
      .then((users) => {
        if (!cancelled) {
          setSectionManagers(
            users.map((u) => ({
              id: u.id,
              fullName: u.fullName,
              email: u.email,
              jobTitle: null,
            })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setSectionManagers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [flow, roster]);

  const managerOptions = useMemo(() => {
    const byId = new Map<string, ManagerOption>();
    for (const m of parentManagers.concat(sectionManagers)) byId.set(m.id, m);
    return Array.from(byId.values()).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [parentManagers, sectionManagers]);

  const totalMembers = useMemo(() => {
    if (!roster) return 0;
    return (
      roster.departmentUsers.length +
      roster.sections.reduce((sum, section) => sum + section.users.length, 0)
    );
  }, [roster]);

  const unassignedCount = roster?.departmentUsers.length ?? 0;

  const activeSection = useMemo(() => {
    if (!flow || !roster) return null;
    const sectionId =
      flow.mode === "create" && flow.step === 2
        ? flow.sectionId
        : flow.mode === "members"
          ? flow.sectionId
          : null;
    if (!sectionId) return null;
    return roster.sections.find((s) => s.id === sectionId) ?? null;
  }, [flow, roster]);

  const assignableMembers = useMemo(() => {
    if (!roster || !flow) return [];
    const targetId =
      flow.mode === "members"
        ? flow.sectionId
        : flow.mode === "create" && flow.step === 2
          ? flow.sectionId
          : null;
    if (!targetId) return [];
    return buildAssignablePool(roster, targetId);
  }, [flow, roster]);

  function resetFlow() {
    setFlow(null);
    setDraft(emptyDraft());
    setSelectedUserIds(new Set());
    setError(null);
  }

  function startAddSection() {
    setFlow({ mode: "create", step: 1, sectionId: null, sectionName: "" });
    setDraft(emptyDraft());
    setSelectedUserIds(new Set());
    setError(null);
  }

  function startEditSection(section: ApiDepartmentRosterSection) {
    setFlow({ mode: "edit", step: 1, sectionId: section.id, sectionName: section.name });
    setDraft({
      name: section.name,
      managerUserId: section.manager?.id ?? "",
      isActive: section.isActive,
    });
    setError(null);
  }

  function startManageMembers(section: ApiDepartmentRosterSection) {
    setFlow({ mode: "members", sectionId: section.id, sectionName: section.name });
    setSelectedUserIds(new Set());
    setError(null);
  }

  function toggleUser(userId: string) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function selectUsers(userIds: string[]) {
    setSelectedUserIds(new Set(userIds));
  }

  async function saveSectionDetails() {
    if (!roster) return;
    const name = draft.name.trim();
    if (name.length < 2) {
      setError("Section name must be at least 2 characters.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (flow?.mode === "create") {
        const created = await createDepartment({
          name,
          parentDepartmentId: roster.department.id,
          cloneTemplatesFromDepartmentId: roster.department.id,
          managerUserId: draft.managerUserId || undefined,
          isActive: draft.isActive,
        });
        invalidateDepartmentCaches();
        setFlow({
          mode: "create",
          step: 2,
          sectionId: created.id,
          sectionName: created.name,
        });
        setSelectedUserIds(new Set());
        await reload();
      } else if (flow?.mode === "edit") {
        await updateDepartment(flow.sectionId, {
          name,
          managerUserId: draft.managerUserId || null,
          isActive: draft.isActive,
        });
        invalidateDepartmentCaches();
        resetFlow();
        await reload();
      }
    } catch (e) {
      setError(apiErrorMessage(e, "Could not save the section. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  async function assignSelectedMembers() {
    if (!roster || !flow) return;
    const sectionId =
      flow.mode === "members"
        ? flow.sectionId
        : flow.mode === "create" && flow.step === 2
          ? flow.sectionId
          : null;
    if (!sectionId) return;

    if (selectedUserIds.size === 0) {
      resetFlow();
      await reload();
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await assignSectionMembers(
        roster.department.id,
        sectionId,
        Array.from(selectedUserIds),
      );
      resetFlow();
      await reload();
    } catch (e) {
      setError(apiErrorMessage(e, "Could not assign team members. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(userId: string) {
    if (!roster || !flow || flow.mode !== "members") return;
    setSaving(true);
    setError(null);
    try {
      await unassignSectionMembers(roster.department.id, flow.sectionId, [userId]);
      await reload();
    } catch (e) {
      setError(apiErrorMessage(e, "Could not remove team member. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return {
    roster,
    loading,
    loadError,
    totalMembers,
    unassignedCount,
    flow,
    draft,
    setDraft,
    managerOptions,
    saving,
    error,
    editingSectionId,
    activeSection,
    assignableMembers,
    selectedUserIds,
    reload,
    resetFlow,
    startAddSection,
    startEditSection,
    startManageMembers,
    toggleUser,
    selectUsers,
    saveSectionDetails,
    assignSelectedMembers,
    removeMember,
  };
}
