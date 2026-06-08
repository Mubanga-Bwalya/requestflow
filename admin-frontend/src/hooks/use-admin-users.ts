"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  isValidEmail,
  normalizeEmail,
  USER_NAME_MAX,
  validateUserPassword,
} from "@/lib/admin-form-utils";
import { fetchDepartments, type ApiDepartment } from "@/lib/departments-api";
import { normalizeAssignableRole } from "@/lib/assignable-roles";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { peekApiCache } from "@/lib/query-cache";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { apiErrorMessage } from "@/lib/api-error";
import { createUser, fetchUsers, updateUser, type ApiUser } from "@/lib/users-api";

export type UserFormState = {
  name: string;
  email: string;
  jobTitle: string;
  externalEmployeeId: string;
  department: string;
  role: string;
  status: "Active" | "Inactive";
  password: string;
};

const emptyForm = (defaultDept: string): UserFormState => ({
  name: "",
  email: "",
  jobTitle: "",
  externalEmployeeId: "",
  department: defaultDept,
  role: "",
  status: "Active",
  password: "",
});

function validateForm(form: UserFormState, editing: boolean) {
  const errors: Partial<Record<keyof UserFormState, string>> = {};
  const name = form.name.trim();
  const email = normalizeEmail(form.email);

  if (!name) errors.name = "Full name is required.";
  else if (name.length > USER_NAME_MAX) errors.name = `Name must be ${USER_NAME_MAX} characters or fewer.`;

  if (!email) errors.email = "Email is required.";
  else if (!isValidEmail(email)) errors.email = "Enter a valid email address.";

  if (!form.department) errors.department = "Select a department.";
  if (!form.role) errors.role = "Select a role.";

  if (!editing) {
    const passwordError = validateUserPassword(form.password);
    if (passwordError) errors.password = passwordError;
  }

  return errors;
}

export function useAdminUsers() {
  const [result, setResult] = useState({ items: [] as ApiUser[], total: 0, page: 1, totalPages: 1 });
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState<UserFormState>(emptyForm(""));
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const defaultDept = departments[0]?.name ?? "";

  const fieldErrors = useMemo(() => validateForm(form, Boolean(editing)), [form, editing]);
  const canSave = Object.keys(fieldErrors).length === 0;

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
    const cacheKey = `users:page:${page}:${LIST_PAGE_SIZE}:${deptFilter === "ALL" ? "ALL" : deptFilter}`;
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
        }),
      );
    } catch (e) {
      setLoadError(apiErrorMessage(e, "Could not load users. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [deptFilter, page]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    setPage(1);
  }, [deptFilter]);

  const filtered = useMemo(() => {
    const query = debouncedQ.toLowerCase();
    return result.items.filter((u) => {
      const status = u.isActive ? "Active" : "Inactive";
      if (statusFilter !== "ALL" && status !== statusFilter) return false;
      if (!query) return true;
      return (
        u.fullName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.roleName ?? "").toLowerCase().includes(query)
      );
    });
  }, [debouncedQ, result.items, statusFilter]);

  function openAdd() {
    setEditing(null);
    setShowAdvanced(false);
    setForm(emptyForm(defaultDept));
    setError(null);
    setOpen(true);
  }

  function openEdit(u: ApiUser) {
    setEditing(u);
    setShowAdvanced(Boolean(u.externalEmployeeId || u.jobTitle));
    setForm({
      name: u.fullName,
      email: u.email,
      jobTitle: u.jobTitle ?? "",
      externalEmployeeId: u.externalEmployeeId ?? "",
      department: u.departmentName ?? defaultDept,
      role: normalizeAssignableRole(u.roleName),
      status: u.isActive ? "Active" : "Inactive",
      password: "",
    });
    setError(null);
    setOpen(true);
  }

  async function save() {
    setError(null);
    const errors = validateForm(form, Boolean(editing));
    if (Object.keys(errors).length) return;

    setSaving(true);
    try {
      const payload = {
        fullName: form.name.trim(),
        email: normalizeEmail(form.email),
        departmentName: form.department,
        roleName: form.role,
        jobTitle: form.jobTitle.trim() || undefined,
        externalEmployeeId: form.externalEmployeeId.trim() || undefined,
        isActive: form.status === "Active",
      };

      if (editing) {
        await updateUser(editing.id, {
          ...payload,
          externalEmployeeId: form.externalEmployeeId.trim() || null,
          jobTitle: form.jobTitle.trim() || undefined,
        });
      } else {
        await createUser({
          ...payload,
          password: form.password.trim() || undefined,
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
    filtered,
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
    openAdd,
    openEdit,
    save,
  };
}
