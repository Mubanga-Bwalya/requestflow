"use client";

import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { DataTablePlaceholder } from "@/components/shared/data-table-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLocalStore } from "@/lib/local-store";
import type { User } from "@/types/user";

export default function Page() {
  const { state, actions } = useLocalStore();
  const [q, setQ] = useState("");
  const [deptFilter, setDeptFilter] = useState<"ALL" | "HR" | "Marketing">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Active" | "Inactive">("ALL");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", department: "HR" as User["department"], role: "Employee", status: "Active" as User["status"] });
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.users.filter((u) => {
      if (deptFilter !== "ALL" && u.department !== deptFilter) return false;
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
      if (!query) return true;
      return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || u.role.toLowerCase().includes(query);
    });
  }, [deptFilter, q, state.users, statusFilter]);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", email: "", department: "HR", role: "Employee", status: "Active" });
    setError(null);
    setOpen(true);
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, department: u.department, role: u.role, status: u.status });
    setError(null);
    setOpen(true);
  }

  function save() {
    setError(null);
    if (!form.name.trim() || !form.email.trim()) return setError("Name and email are required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Enter a valid email.");
    if (editing) {
      actions.updateUser(editing.id, { ...form, name: form.name.trim(), email: form.email.trim() });
    } else {
      actions.addUser({ ...form, name: form.name.trim(), email: form.email.trim() });
    }
    setOpen(false);
  }

  return (
    <AdminShell title="Manage Users">
      <PageHeader
        title="Manage Users"
        description="Create and maintain employee and manager profiles."
        actions={<Button onClick={openAdd}>Add User</Button>}
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Input placeholder="Search users..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value as typeof deptFilter)}>
          <option value="ALL">All departments</option>
          <option value="HR">HR</option>
          <option value="Marketing">Marketing</option>
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="ALL">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </Select>
      </div>

      {filtered.length ? (
        <DataTablePlaceholder
          columns={[
            { key: "name", label: "Name" },
            { key: "email", label: "Email" },
            { key: "department", label: "Department" },
            { key: "role", label: "Role" },
            { key: "status", label: "Status" },
            { key: "__actions", label: "Actions" },
          ]}
          rows={filtered.map((u) => ({
            ...u,
            __actions: (
              <div className="flex gap-2">
                <button type="button" className="text-brand-primary hover:underline" onClick={() => openEdit(u)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="text-slate-700 hover:underline"
                  onClick={() => actions.updateUser(u.id, { status: u.status === "Active" ? "Inactive" : "Active" })}
                >
                  {u.status === "Active" ? "Deactivate" : "Activate"}
                </button>
              </div>
            ) as unknown as string,
          }))}
        />
      ) : (
        <div className="rounded-md border border-brand-dark/10 bg-brand-primary/5 p-6 text-sm text-slate-700">No users match your filters.</div>
      )}

      <Dialog open={open} onOpenChange={setOpen} title={editing ? "Edit User" : "Add User"} description="Local-only user management.">
        {error ? <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">Department</label>
            <Select value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value as User["department"] }))}>
              <option value="HR">HR</option>
              <option value="Marketing">Marketing</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <Select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
              <option>Employee</option>
              <option>HR Manager</option>
              <option>Marketing Manager</option>
              <option>HR Team Member</option>
              <option>Marketing Team Member</option>
              <option>Admin</option>
            </Select>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{editing ? "Save" : "Add User"}</Button>
        </div>
      </Dialog>
    </AdminShell>
  );
}
