"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDepartments, type ApiDepartment } from "@/lib/departments-api";
import { apiErrorMessage } from "@/lib/api-error";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { peekApiCache } from "@/lib/query-cache";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { TEMPLATE_DESC_MAX, TEMPLATE_NAME_MAX } from "@/lib/admin-form-utils";
import { createTemplate, fetchTemplates, updateTemplateActive, type ApiTemplateSummary } from "@/lib/templates-api";

export function useAdminTemplates() {
  const [departments, setDepartments] = useState<ApiDepartment[]>([]);
  const [result, setResult] = useState({ items: [] as ApiTemplateSummary[], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q.trim(), 300);
  const [deptId, setDeptId] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ departmentId: "", name: "", description: "" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDepartments(false)
      .then(setDepartments)
      .catch(() => setDepartments([]));
    const fromUrl = new URLSearchParams(window.location.search).get("departmentId");
    if (fromUrl) setDeptId(fromUrl);
  }, []);

  const reload = useCallback(async () => {
    const isActive = activeTab === "ACTIVE" ? true : activeTab === "INACTIVE" ? false : undefined;
    const cacheKey = `templates:page:${page}:${LIST_PAGE_SIZE}:${activeTab}:${deptId}`;
    const cached = peekApiCache<typeof result>(cacheKey);
    if (cached) {
      setResult(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      setResult(
        await fetchTemplates({
          page,
          limit: LIST_PAGE_SIZE,
          ...(isActive !== undefined ? { isActive } : { activeOnly: false }),
          departmentId: deptId,
        }),
      );
    } catch {
      if (!cached) setResult({ items: [], total: 0, page: 1, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [activeTab, deptId, page]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    setPage(1);
  }, [deptId, activeTab]);

  const filtered = useMemo(() => {
    const query = debouncedQ.toLowerCase();
    if (!query) return result.items;
    return result.items.filter((t) => t.name.toLowerCase().includes(query));
  }, [debouncedQ, result.items]);

  function openCreate() {
    setCreateForm({
      departmentId: deptId !== "ALL" ? deptId : departments[0]?.id ?? "",
      name: "",
      description: "",
    });
    setCreateError(null);
    setCreateOpen(true);
  }

  async function submitCreate() {
    setCreateError(null);
    const name = createForm.name.trim();
    if (!createForm.departmentId) {
      setCreateError("Select a target department.");
      return;
    }
    if (!name) {
      setCreateError("Template name is required.");
      return;
    }
    if (name.length > TEMPLATE_NAME_MAX) {
      setCreateError(`Template name must be ${TEMPLATE_NAME_MAX} characters or fewer.`);
      return;
    }
    if (createForm.description.trim().length > TEMPLATE_DESC_MAX) {
      setCreateError(`Description must be ${TEMPLATE_DESC_MAX} characters or fewer.`);
      return;
    }
    setCreating(true);
    try {
      await createTemplate({
        departmentId: createForm.departmentId,
        name,
        description: createForm.description.trim() || undefined,
        isActive: true,
      });
      setCreateOpen(false);
      setCreateForm({ departmentId: "", name: "", description: "" });
      await reload();
    } catch (e) {
      setCreateError(apiErrorMessage(e, "Could not create template. Please check your entries."));
    } finally {
      setCreating(false);
    }
  }

  return {
    departments,
    result,
    loading,
    page,
    setPage,
    q,
    setQ,
    deptId,
    setDeptId,
    activeTab,
    setActiveTab,
    filtered,
    createOpen,
    setCreateOpen,
    createForm,
    setCreateForm,
    createError,
    creating,
    openCreate,
    submitCreate,
    reload,
  };
}
