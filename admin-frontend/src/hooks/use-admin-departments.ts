"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEPT_EXTERNAL_CODE_MAX, DEPT_NAME_MAX, DEPT_NAME_MIN, isValidUuid } from "@/lib/admin-form-utils";
import { apiErrorMessage } from "@/lib/api-error";
import { fetchDepartmentUsers } from "@/lib/users-api";
import { peekApiCache } from "@/lib/query-cache";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import {
  createDepartment,
  fetchDepartments,
  fetchDepartmentsPage,
  updateDepartment,
  type ApiDepartment,
} from "@/lib/departments-api";

export type DeptFormState = {
  name: string;
  externalDepartmentCode: string;
  isActive: boolean;
  managerUserId: string;
  cloneTemplatesFromDepartmentId: string;
};

const emptyForm = (): DeptFormState => ({
  name: "",
  externalDepartmentCode: "",
  isActive: true,
  managerUserId: "",
  cloneTemplatesFromDepartmentId: "",
});

function validateDeptForm(form: DeptFormState) {
  const errors: Partial<Record<keyof DeptFormState, string>> = {};
  const name = form.name.trim();

  if (!name) errors.name = "Department name is required.";
  else if (name.length < DEPT_NAME_MIN) errors.name = "Department name must be at least 2 characters.";
  else if (name.length > DEPT_NAME_MAX) errors.name = `Name must be ${DEPT_NAME_MAX} characters or fewer.`;

  if (form.externalDepartmentCode.trim().length > DEPT_EXTERNAL_CODE_MAX) {
    errors.externalDepartmentCode = `External code must be ${DEPT_EXTERNAL_CODE_MAX} characters or fewer.`;
  }

  if (form.managerUserId && !isValidUuid(form.managerUserId)) {
    errors.managerUserId = "Selected manager is invalid.";
  }

  return errors;
}

export function useAdminDepartments() {
  const [allDepartments, setAllDepartments] = useState<ApiDepartment[]>([]);
  const [result, setResult] = useState({ items: [] as ApiDepartment[], total: 0, page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<ApiDepartment | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<DeptFormState>(emptyForm());
  const [deptUsers, setDeptUsers] = useState<{ id: string; fullName: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldErrors = useMemo(() => validateDeptForm(form), [form]);
  const canSave = Object.keys(fieldErrors).length === 0;

  const reload = useCallback(async () => {
    const cacheKey = `departments:page:${page}:${LIST_PAGE_SIZE}:false`;
    const cached = peekApiCache<typeof result>(cacheKey);
    if (cached) {
      setResult(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const [paged, all] = await Promise.all([
        fetchDepartmentsPage({ page, limit: LIST_PAGE_SIZE, activeOnly: false }),
        fetchDepartments(false),
      ]);
      setResult(paged);
      setAllDepartments(all);
    } catch {
      if (!cached) setResult({ items: [], total: 0, page: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (dialogMode !== "edit" || !editing) {
      setDeptUsers([]);
      return;
    }
    fetchDepartmentUsers(editing.name)
      .then((users) => setDeptUsers(users.map((u) => ({ id: u.id, fullName: u.fullName }))))
      .catch(() => setDeptUsers([]));
  }, [dialogMode, editing]);

  function openAdd() {
    setDialogMode("add");
    setEditing(null);
    setShowAdvanced(false);
    setForm(emptyForm());
    setError(null);
  }

  function openEdit(d: ApiDepartment) {
    setDialogMode("edit");
    setEditing(d);
    setShowAdvanced(Boolean(d.externalDepartmentCode));
    setForm({
      name: d.name,
      externalDepartmentCode: d.externalDepartmentCode ?? "",
      isActive: d.isActive,
      managerUserId: d.manager?.id ?? "",
      cloneTemplatesFromDepartmentId: "",
    });
    setError(null);
  }

  function closeDialog() {
    setDialogMode(null);
    setEditing(null);
  }

  async function save() {
    setError(null);
    if (Object.keys(fieldErrors).length) return;

    setSaving(true);
    try {
      if (dialogMode === "add") {
        await createDepartment({
          name: form.name.trim(),
          externalDepartmentCode: form.externalDepartmentCode.trim() || undefined,
          cloneTemplatesFromDepartmentId: form.cloneTemplatesFromDepartmentId || undefined,
        });
      } else if (editing) {
        await updateDepartment(editing.id, {
          name: form.name.trim(),
          externalDepartmentCode: form.externalDepartmentCode.trim() || null,
          isActive: form.isActive,
          managerUserId: form.managerUserId || null,
        });
      }
      await reload();
      closeDialog();
    } catch (e) {
      setError(apiErrorMessage(e, "Could not save department. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  return {
    result,
    allDepartments,
    loading,
    page,
    setPage,
    dialogMode,
    editing,
    form,
    setForm,
    showAdvanced,
    setShowAdvanced,
    fieldErrors,
    canSave,
    deptUsers,
    saving,
    error,
    openAdd,
    openEdit,
    closeDialog,
    save,
  };
}
