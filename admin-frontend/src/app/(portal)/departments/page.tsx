"use client";

import { DepartmentFormDialog } from "@/components/admin-departments/department-form-dialog";
import { DataTable, type DataTableRow } from "@/components/shared/data-table";
import { TableActionButton } from "@/components/shared/table-action-button";
import { TableOpenLink } from "@/components/shared/table-open-link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { ApiErrorBanner } from "@/components/shared/api-error-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { useAdminDepartments } from "@/hooks/use-admin-departments";
import { Building2 } from "lucide-react";

export default function Page() {
  const d = useAdminDepartments();

  return (
    <>
      <PageHeader
        title="Manage Departments"
        description="Add departments and assign managers. Request types (procedures) are managed per department under Templates."
        actions={<Button onClick={d.openAdd}>Add Department</Button>}
      />

      <ApiErrorBanner message={d.loadError} onRetry={() => void d.reload()} className="mb-4" />

      {d.loading ? (
        <p className="text-sm text-muted">Loading departments…</p>
      ) : d.loadError ? null : d.result.items.length === 0 ? (
        <EmptyState
          icon={Building2}
          heading="No departments yet"
          body="Add a department so teams can receive and manage requests."
        />
      ) : (
        <>
          <DataTable
            caption="Departments"
            columns={[
              { key: "name", label: "Department" },
              { key: "templates", label: "Request types" },
              { key: "manager", label: "Manager" },
              { key: "teamMembers", label: "Team Members" },
              { key: "activeRequests", label: "Active Requests" },
              { key: "status", label: "Status" },
              { key: "__actions", label: "Actions" },
            ]}
            rows={d.result.items.map((row): DataTableRow => ({
              name: row.name,
              templates: row.templateCount,
              manager: row.manager?.fullName ?? "—",
              teamMembers: row.userCount,
              activeRequests: row.activeRequestCount,
              status: row.isActive ? "Active" : "Inactive",
              __actions: (
                <div className="flex flex-wrap gap-2">
                  <TableActionButton onClick={() => d.openEdit(row)}>Edit</TableActionButton>
                  <TableOpenLink href={`/templates?departmentId=${row.id}`} label="Templates" />
                </div>
              ),
            }))}
          />
          <PaginationBar
            page={d.result.page}
            totalPages={d.result.totalPages}
            total={d.result.total}
            onPageChange={d.setPage}
          />
        </>
      )}

      <DepartmentFormDialog
        mode={d.dialogMode}
        editing={d.editing}
        open={d.dialogMode !== null}
        onOpenChange={(v) => {
          if (!v) d.closeDialog();
        }}
        form={d.form}
        setForm={d.setForm}
        showAdvanced={d.showAdvanced}
        setShowAdvanced={d.setShowAdvanced}
        fieldErrors={d.fieldErrors}
        canSave={d.canSave}
        allDepartments={d.allDepartments}
        deptUsers={d.deptUsers}
        error={d.error}
        saving={d.saving}
        onSave={() => void d.save()}
      />
    </>
  );
}
