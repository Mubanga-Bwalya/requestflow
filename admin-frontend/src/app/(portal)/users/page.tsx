"use client";

import { UsersFormDialog } from "@/components/admin-users/users-form-dialog";
import { DataTable, type DataTableRow } from "@/components/shared/data-table";
import { PaginationBar } from "@/components/shared/pagination-bar";
import { TableActionButton } from "@/components/shared/table-action-button";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAdminUsers } from "@/hooks/use-admin-users";

export default function Page() {
  const u = useAdminUsers();

  return (
    <>
      <PageHeader
        title="Manage Users"
        description="Create and maintain employee and manager profiles (saved to database)."
        actions={<Button onClick={u.openAdd}>Add User</Button>}
      />

      {u.loadError ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {u.loadError}
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Input
          placeholder="Search within this page only (name, email, role)…"
          value={u.q}
          onChange={(e) => u.setQ(e.target.value)}
        />
        <Select value={u.deptFilter} onChange={(e) => u.setDeptFilter(e.target.value)}>
          <option value="ALL">All departments</option>
          {u.departments.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </Select>
        <Select value={u.statusFilter} onChange={(e) => u.setStatusFilter(e.target.value as typeof u.statusFilter)}>
          <option value="ALL">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </Select>
      </div>

      {u.loading ? (
        <p className="text-sm text-muted">Loading users…</p>
      ) : (
        <>
          <DataTable
            columns={[
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "department", label: "Department" },
              { key: "role", label: "Role" },
              { key: "status", label: "Status" },
              { key: "__actions", label: "" },
            ]}
            rows={u.filtered.map((row): DataTableRow => ({
              name: row.fullName,
              email: row.email,
              department: row.departmentName ?? "—",
              role: row.roleName ?? "—",
              status: row.isActive ? "Active" : "Inactive",
              __actions: <TableActionButton onClick={() => u.openEdit(row)}>Edit</TableActionButton>,
            }))}
          />
          <PaginationBar
            page={u.result.page}
            totalPages={u.result.totalPages}
            total={u.result.total}
            onPageChange={u.setPage}
          />
        </>
      )}

      <UsersFormDialog
        open={u.open}
        onOpenChange={u.setOpen}
        editing={!!u.editing}
        form={u.form}
        setForm={u.setForm}
        fieldErrors={u.fieldErrors}
        showAdvanced={u.showAdvanced}
        setShowAdvanced={u.setShowAdvanced}
        departments={u.departments}
        error={u.error}
        saving={u.saving}
        canSave={u.canSave}
        onSave={() => void u.save()}
      />
    </>
  );
}
