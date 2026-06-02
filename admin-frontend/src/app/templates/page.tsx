"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { DataTablePlaceholder } from "@/components/shared/data-table-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tab, Tabs } from "@/components/ui/tabs";
import { useLocalStore } from "@/lib/local-store";

export default function Page() {
  const { state, actions } = useLocalStore();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState<"ALL" | "HR" | "MARKETING">("ALL");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return state.templates.filter((t) => {
      if (dept !== "ALL" && t.department !== dept) return false;
      if (activeTab === "ACTIVE" && !t.isActive) return false;
      if (activeTab === "INACTIVE" && t.isActive) return false;
      if (!query) return true;
      return t.name.toLowerCase().includes(query);
    });
  }, [activeTab, dept, q, state.templates]);

  return (
    <AdminShell title="Manage Request Templates">
      <PageHeader
        title="Manage Request Templates"
        description="Template definitions for HR and Marketing request intake."
        actions={<Button onClick={() => alert("Add Template placeholder — use existing HR/Marketing templates for MVP.")}>Add Template</Button>}
      />

      <div className="mb-4 space-y-3">
        <Input placeholder="Search templates..." value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Select value={dept} onChange={(e) => setDept(e.target.value as typeof dept)}>
            <option value="ALL">All departments</option>
            <option value="HR">HR</option>
            <option value="MARKETING">Marketing</option>
          </Select>
          <Tabs>
            <Tab active={activeTab === "ALL"} onClick={() => setActiveTab("ALL")}>
              All
            </Tab>
            <Tab active={activeTab === "ACTIVE"} onClick={() => setActiveTab("ACTIVE")}>
              Active
            </Tab>
            <Tab active={activeTab === "INACTIVE"} onClick={() => setActiveTab("INACTIVE")}>
              Inactive
            </Tab>
          </Tabs>
        </div>
      </div>

      {filtered.length ? (
        <DataTablePlaceholder
          columns={[
            { key: "name", label: "Template Name" },
            { key: "department", label: "Department" },
            { key: "fieldCount", label: "Fields" },
            { key: "active", label: "Active Status" },
            { key: "__actions", label: "Actions" },
          ]}
          rows={filtered.map((t) => ({
            name: t.name,
            department: t.department,
            fieldCount: t.fieldCount,
            active: t.isActive ? "Active" : "Inactive",
            __actions: (
              <div className="flex gap-2">
                <Link href={`/templates/${t.id}`} className="text-brand-primary hover:underline">
                  View
                </Link>
                <button type="button" className="text-slate-700 hover:underline" onClick={() => actions.toggleTemplateActive(t.id)}>
                  {t.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            ) as unknown as string,
          }))}
        />
      ) : (
        <div className="rounded-md border border-brand-dark/10 bg-brand-primary/5 p-6 text-sm text-slate-700">No templates match your filters.</div>
      )}
    </AdminShell>
  );
}
