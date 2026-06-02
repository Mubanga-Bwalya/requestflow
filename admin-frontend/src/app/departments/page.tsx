"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { DataTablePlaceholder } from "@/components/shared/data-table-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocalStore } from "@/lib/local-store";
import type { Department } from "@/types/department";

export default function Page() {
  const { state, actions } = useLocalStore();
  const [editing, setEditing] = useState<Department | null>(null);
  const [manager, setManager] = useState("");

  return (
    <AdminShell title="Manage Departments">
      <PageHeader title="Manage Departments" description="MVP departments are limited to HR and Marketing." />

      <DataTablePlaceholder
        columns={[
          { key: "name", label: "Department" },
          { key: "manager", label: "Manager" },
          { key: "teamMembers", label: "Team Members" },
          { key: "activeRequests", label: "Active Requests" },
          { key: "status", label: "Status" },
          { key: "__actions", label: "Actions" },
        ]}
        rows={state.departments.map((d) => ({
          ...d,
          __actions: (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="text-brand-primary hover:underline"
                onClick={() => {
                  setEditing(d);
                  setManager(d.manager);
                }}
              >
                Edit Manager
              </button>
              <Link href="/templates" className="text-brand-primary hover:underline">
                View Templates
              </Link>
            </div>
          ) as unknown as string,
        }))}
      />

      <Dialog
        open={!!editing}
        onOpenChange={(v) => {
          if (!v) setEditing(null);
        }}
        title="Edit Department Manager"
        description={editing ? `Update manager for ${editing.name}` : ""}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium">Manager name</label>
          <Input value={manager} onChange={(e) => setManager(e.target.value)} placeholder="e.g. Martha N." />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!editing || !manager.trim()) return;
              actions.updateDepartment(editing.id, { manager: manager.trim() });
              setEditing(null);
            }}
          >
            Save
          </Button>
        </div>
      </Dialog>
    </AdminShell>
  );
}
