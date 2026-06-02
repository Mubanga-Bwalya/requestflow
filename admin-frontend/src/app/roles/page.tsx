"use client";

import { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { DataTablePlaceholder } from "@/components/shared/data-table-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useLocalStore } from "@/lib/local-store";
import type { Role } from "@/types/role";

const permissionDetails: Record<string, string[]> = {
  Admin: ["Manage users", "Manage departments", "Manage templates", "View reports", "Configure system settings"],
  Employee: ["Create requests", "View own request progress", "Provide missing information", "Approve/reopen completed work"],
  "HR Manager": ["Review HR inbox", "Assign HR work", "Request missing information", "Reject/accept requests"],
  "Marketing Manager": ["Review Marketing inbox", "Assign Marketing work", "Request missing information", "Reject/accept requests"],
  "HR Team Member": ["View assigned HR tasks", "Manage milestones", "Update progress", "Mark ready for review"],
  "Marketing Team Member": ["View assigned Marketing tasks", "Manage milestones", "Update progress", "Mark ready for review"],
};

export default function Page() {
  const { state } = useLocalStore();
  const [selected, setSelected] = useState<Role | null>(null);

  return (
    <AdminShell title="Manage Roles">
      <PageHeader title="Manage Roles" description="Role catalog used for authorization policies and access control." />

      <DataTablePlaceholder
        columns={[
          { key: "name", label: "Role" },
          { key: "permissionSummary", label: "Permission Summary" },
          { key: "__actions", label: "" },
        ]}
        rows={state.roles.map((r) => ({
          ...r,
          __actions: (
            <button type="button" className="text-brand-primary hover:underline" onClick={() => setSelected(r)}>
              View Permissions
            </button>
          ) as unknown as string,
        }))}
      />

      <Dialog
        open={!!selected}
        onOpenChange={(v) => {
          if (!v) setSelected(null);
        }}
        title={selected ? `${selected.name} Permissions` : "Permissions"}
        description="Read-only mock permission list for prototype."
      >
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {(selected ? permissionDetails[selected.name] ?? [selected.permissionSummary] : []).map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <div className="mt-5 flex justify-end">
          <Button variant="outline" onClick={() => setSelected(null)}>
            Close
          </Button>
        </div>
      </Dialog>
    </AdminShell>
  );
}
