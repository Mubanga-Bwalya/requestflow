"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchDepartments, type ApiDepartment } from "@/lib/departments-api";
import { apiErrorMessage } from "@/lib/api-error";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { peekApiCache } from "@/lib/query-cache";
import { LIST_PAGE_SIZE } from "@/lib/page-size";
import { TEMPLATE_DESC_MAX, TEMPLATE_NAME_MAX } from "@/lib/admin-form-utils";
import { createTemplate, fetchTemplates, updateTemplateActive, type ApiTemplateSummary } from "@/lib/templates-api";
import type { TemplateCreateForm } from "@/components/admin-templates/template-create-dialog";

const emptyCreateForm = (): TemplateCreateForm => ({
  parentDepartmentId: "",
  sectionId: "",
  name: "",
  description: "",
});

function resolveParentDepartmentId(deptId: string, departments: ApiDepartment[]): string {
  if (!deptId || deptId === "ALL") return departments[0]?.id ?? "";
  const topLevel = departments.find((d) => d.id === deptId);
  if (topLevel) return topLevel.id;
  for (const dept of departments) {
    if (dept.sections?.some((s) => s.id === deptId)) return dept.id;
  }
  return deptId;
}

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
  const [createForm, setCreateForm] = useState<TemplateCreateForm>(emptyCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    setLoadError(null);
    try {
      setResult(
        await fetchTemplates({
          page,
          limit: LIST_PAGE_SIZE,
          ...(isActive !== undefined ? { isActive } : { activeOnly: false }),
          departmentId: deptId,
        }),
      );
    } catch (e) {
      if (!cached) {
        setResult({ items: [], total: 0, page: 1, totalPages: 1 });
        setLoadError(apiErrorMessage(e, "Could not load templates. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, deptId, page]);

  useEffect(() => {
    let cancelled = false;
    const isActive = activeTab === "ACTIVE" ? true : activeTab === "INACTIVE" ? false : undefined;
    const cacheKey = `templates:page:${page}:${LIST_PAGE_SIZE}:${activeTab}:${deptId}`;
    const cached = peekApiCache<typeof result>(cacheKey);
    if (cached) {
      setResult(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setLoadError(null);
    void (async () => {
      try {
        const data = await fetchTemplates({
          page,
          limit: LIST_PAGE_SIZE,
          ...(isActive !== undefined ? { isActive } : { activeOnly: false }),
          departmentId: deptId,
        });
        if (!cancelled) setResult(data);
      } catch (e) {
        if (!cancelled && !cached) {
          setResult({ items: [], total: 0, page: 1, totalPages: 1 });
          setLoadError(apiErrorMessage(e, "Could not load templates. Please try again."));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, deptId, page]);

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
      ...emptyCreateForm(),
      parentDepartmentId: resolveParentDepartmentId(deptId, departments),
    });
    setCreateError(null);
    setCreateOpen(true);
  }

  async function submitCreate() {
    setCreateError(null);
    const name = createForm.name.trim();
    const targetDepartmentId = createForm.sectionId || createForm.parentDepartmentId;
    if (!createForm.parentDepartmentId) {
      setCreateError("Select a department.");
      return;
    }
    if (!targetDepartmentId) {
      setCreateError("Select a department.");
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
        departmentId: targetDepartmentId,
        name,
        description: createForm.description.trim() || undefined,
        isActive: true,
      });
      setCreateOpen(false);
      setCreateForm(emptyCreateForm());
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
    loadError,
  };
}
