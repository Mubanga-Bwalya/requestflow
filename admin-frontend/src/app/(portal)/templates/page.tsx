"use client";

import { useState } from "react";
import { TemplateCreateDialog } from "@/components/admin-templates/template-create-dialog";
import { DataTable, type DataTableRow } from "@/components/shared/data-table";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { TableActionButton } from "@/components/shared/table-action-button";
import { TableOpenLink } from "@/components/shared/table-open-link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tab, Tabs } from "@/components/ui/tabs";
import { ApiErrorBanner } from "@/components/shared/api-error-banner";
import { useAdminTemplates } from "@/hooks/use-admin-templates";
import { updateTemplateActive } from "@/lib/templates-api";

export default function Page() {
  const t = useAdminTemplates();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function toggleActive(id: string, active: boolean) {
    if (togglingId) return;
    setTogglingId(id);
    try {
      await updateTemplateActive(id, active);
      await t.reload();
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Manage Request Templates"
        description="Each request type is a procedure for a department — add fields on the detail page."
        actions={<Button onClick={t.openCreate}>Add Request Type</Button>}
      />

      <div className="mb-4 space-y-3">
        <Input
          placeholder="Search within this page only (template name)…"
          value={t.q}
          onChange={(e) => t.setQ(e.target.value)}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Select value={t.deptId} onChange={(e) => t.setDeptId(e.target.value)}>
            <option value="ALL">All departments</option>
            {t.departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Tabs>
            <Tab active={t.activeTab === "ALL"} onClick={() => t.setActiveTab("ALL")}>
              All
            </Tab>
            <Tab active={t.activeTab === "ACTIVE"} onClick={() => t.setActiveTab("ACTIVE")}>
              Active
            </Tab>
            <Tab active={t.activeTab === "INACTIVE"} onClick={() => t.setActiveTab("INACTIVE")}>
              Inactive
            </Tab>
          </Tabs>
        </div>
      </div>

      <ApiErrorBanner message={t.loadError} onRetry={() => void t.reload()} className="mb-4" />

      {t.loading ? (
        <p className="text-sm text-muted">Loading templates…</p>
      ) : t.loadError ? null : t.filtered.length ? (
        <>
          <DataTable
            caption="Request templates"
            columns={[
              { key: "name", label: "Template Name" },
              { key: "department", label: "Department" },
              { key: "fieldCount", label: "Fields" },
              { key: "active", label: "Active Status" },
              { key: "__actions", label: "Actions" },
            ]}
            rows={t.filtered.map((row): DataTableRow => ({
              name: row.name,
              department: row.departmentName,
              fieldCount: row.fieldCount,
              active: row.isActive ? "Active" : "Inactive",
              __actions: (
                <div className="flex flex-wrap gap-2">
                  <TableOpenLink href={`/templates/${row.id}`} label="View" />
                  {row.isActive ? (
                    <Button
                      type="button"
                      size="compact"
                      variant="destructive"
                      loading={togglingId === row.id}
                      disabled={togglingId !== null}
                      onClick={() => void toggleActive(row.id, false)}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <TableActionButton
                      disabled={togglingId !== null}
                      onClick={() => void toggleActive(row.id, true)}
                    >
                      {togglingId === row.id ? "Activating…" : "Activate"}
                    </TableActionButton>
                  )}
                </div>
              ),
            }))}
          />
          <PaginationBar
            page={t.result.page}
            totalPages={t.result.totalPages}
            total={t.result.total}
            onPageChange={t.setPage}
          />
        </>
      ) : (
        <div className="rounded-md border border-brand-dark/10 bg-brand-primary/5 p-6 text-sm text-zamtel-text">
          No templates match your filters.
        </div>
      )}

      <TemplateCreateDialog
        open={t.createOpen}
        onOpenChange={t.setCreateOpen}
        departments={t.departments}
        form={t.createForm}
        setForm={t.setCreateForm}
        error={t.createError}
        creating={t.creating}
        onSubmit={() => void t.submitCreate()}
      />
    </>
  );
}
