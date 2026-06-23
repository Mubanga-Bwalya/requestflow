"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeEmail } from "@/lib/admin-form-utils";
import {
  emptyUserForm,
  validateUserForm,
  type UserFormState,
} from "@/lib/admin-users-form";
import { fetchDepartments, type ApiDepartment } from "@/lib/departments-api";
import { normalizeAssignableRole } from "@/lib/assignable-roles";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { peekApiCache } from "@/lib/query-cache";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { apiErrorMessage } from "@/lib/api-error";
import { createUser, fetchUsers, syncUsersDirectory, updateUser, type ApiUser } from "@/lib/users-api";

export type { UserFormState };

export function useAdminUsers() {
  const [result, setResult] = useState({ items: [] as ApiUser[], total: 0, page: 1, totalPages: 1 });
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 200);
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<UserFormState>(emptyUserForm(""));
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const refreshDirectoryOnNextLoad = useRef(true);

  const defaultDept = departments[0]?.name ?? "";

  const fieldErrors = useMemo(() => validateUserForm(form), [form]);
  const canSave = Object.keys(fieldErrors).length === 0;

  /**
   * A user's stored department is their leaf (a section, or a top-level dept).
   * Resolve it back into { department (top-level name), sectionId } for the form.
   */
  const resolveDeptSection = useCallback(
    (leafName: string | null): { department: string; sectionId: string } => {
      if (!leafName) return { department: defaultDept, sectionId: "" };
      const topLevel = departments.find((d) => d.name === leafName);
      if (topLevel) return { department: topLevel.name, sectionId: "" };
      for (const d of departments) {
        const section = d.sections?.find((s) => s.name === leafName);
        if (section) return { department: d.name, sectionId: section.id };
      }
      return { department: leafName, sectionId: "" };
    },
    [departments, defaultDept],
  );

  /** The leaf department name to persist (the section's name when one is chosen). */
  const leafDepartmentName = useCallback((): string => {
    const dept = departments.find((d) => d.name === form.department);
    const section = dept?.sections?.find((s) => s.id === form.sectionId);
    return section ? section.name : form.department;
  }, [departments, form.department, form.sectionId]);

  const loadMeta = useCallback(async () => {
    const cachedDepts = peekApiCache<ApiDepartment[]>("departments:active");
    if (cachedDepts) setDepartments(cachedDepts);
    try {
      setDepartments(await fetchDepartments(true));
    } catch {
      if (!cachedDepts) setDepartments([]);
    }
  }, []);

  const reload = useCallback(async () => {
    const cacheKey = `users:page:${page}:${LIST_PAGE_SIZE}:${deptFilter === "ALL" ? "ALL" : deptFilter}:${debouncedQ}:${statusFilter}`;
    const cached = peekApiCache<typeof result>(cacheKey);
    if (cached) {
      setResult(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      setLoadError(null);
      setResult(
        await fetchUsers({
          page,
          limit: LIST_PAGE_SIZE,
          departmentName: deptFilter,
          search: debouncedQ || undefined,
          status: statusFilter,
          refreshDirectory: refreshDirectoryOnNextLoad.current,
        }),
      );
      refreshDirectoryOnNextLoad.current = false;
    } catch (e) {
      setLoadError(apiErrorMessage(e, "Could not load users. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, deptFilter, page, statusFilter]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const refreshDirectory = refreshDirectoryOnNextLoad.current;
    refreshDirectoryOnNextLoad.current = false;
    const cacheKey = `users:page:${page}:${LIST_PAGE_SIZE}:${deptFilter === "ALL" ? "ALL" : deptFilter}:${debouncedQ}:${statusFilter}`;
    const useCache = !debouncedQ && !refreshDirectory;
    const cached = useCache ? peekApiCache<typeof result>(cacheKey) : null;
    if (cached) {
      setResult(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    void (async () => {
      try {
        setLoadError(null);
        const data = await fetchUsers(
          {
            page,
            limit: LIST_PAGE_SIZE,
            departmentName: deptFilter,
            search: debouncedQ || undefined,
            status: statusFilter,
            refreshDirectory,
          },
          controller.signal,
        );
        if (!cancelled) setResult(data);
      } catch (e) {
        if (cancelled || (axios.isAxiosError(e) && (e.code === "ERR_CANCELED" || e.name === "CanceledError"))) {
          return;
        }
        setLoadError(apiErrorMessage(e, "Could not load users. Please try again."));
      } finally {
        if (!cancelled && !controller.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedQ, deptFilter, page, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [deptFilter, debouncedQ, statusFilter]);

  function openAdd() {
    setEditing(null);
    setShowAdvanced(false);
    setForm(emptyUserForm(defaultDept));
    setError(null);
    setOpen(true);
  }

  function openEdit(u: ApiUser) {
    setEditing(u);
    setShowAdvanced(Boolean(u.externalEmployeeId || u.jobTitle));
    let department = u.departmentName ?? defaultDept;
    let sectionId = u.sectionId ?? "";
    if (!u.sectionName && u.departmentName) {
      const resolved = resolveDeptSection(u.departmentName);
      department = resolved.department;
      sectionId = resolved.sectionId;
    }
    setForm({
      name: u.fullName,
      email: u.email,
      jobTitle: u.jobTitle ?? "",
      externalEmployeeId: u.externalEmployeeId ?? "",
      department: department || defaultDept,
      sectionId,
      role: normalizeAssignableRole(u.roleName),
      status: u.isActive ? "Active" : "Inactive",
      gn: u.gn ?? "",
    });
    setError(null);
    setOpen(true);
  }

  async function save() {
    setError(null);
    const errors = validateUserForm(form);
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      if (editing) {
        // Profile fields are owned by the Zamtel directory; admins may only
        // change the local overlay — department/section and role. The leaf
        // (the section when one is chosen) is what's persisted.
        await updateUser(editing.id, {
          departmentName: leafDepartmentName(),
          roleName: form.role,
        });
      } else {
        await createUser({
          fullName: form.name.trim(),
          email: normalizeEmail(form.email),
          departmentName: leafDepartmentName(),
          roleName: form.role,
          jobTitle: form.jobTitle.trim() || undefined,
          externalEmployeeId: form.externalEmployeeId.trim() || undefined,
          isActive: form.status === "Active",
          gn: form.gn.trim() || undefined,
        });
      }
      await reload();
      setOpen(false);
    } catch (e) {
      setError(apiErrorMessage(e, "Failed to save user. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  async function syncFromZamtel() {
    setSyncMessage(null);
    setSyncing(true);
    try {
      const result = await syncUsersDirectory();
      setSyncMessage(result.message);
      if (result.ok) {
        refreshDirectoryOnNextLoad.current = true;
        setPage(1);
        await reload();
      }
    } catch (e) {
      setSyncMessage(apiErrorMessage(e, "Could not sync from Zamtel directory."));
    } finally {
      setSyncing(false);
    }
  }

  return {
    result,
    departments,
    loading,
    page,
    setPage,
    q,
    setQ,
    deptFilter,
    setDeptFilter,
    statusFilter,
    setStatusFilter,
    items: result.items,
    open,
    setOpen,
    editing,
    form,
    setForm,
    fieldErrors,
    showAdvanced,
    setShowAdvanced,
    canSave,
    error,
    loadError,
    saving,
    syncing,
    syncMessage,
    openAdd,
    openEdit,
    save,
    syncFromZamtel,
  };
}
