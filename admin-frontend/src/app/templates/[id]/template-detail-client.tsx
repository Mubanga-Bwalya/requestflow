"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { DataTablePlaceholder } from "@/components/shared/data-table-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useLocalStore } from "@/lib/local-store";
import type { TemplateField } from "@/types/template";

export function TemplateDetailClient({ templateId }: { templateId: string }) {
  const router = useRouter();
  const { state, actions } = useLocalStore();
  const template = useMemo(() => {
    return state.templateDetailsById[templateId] ?? state.templates.find((t) => t.id === templateId) ?? null;
  }, [state.templateDetailsById, state.templates, templateId]);

  const fields = template && "fields" in template ? (template.fields ?? []) : [];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateField | null>(null);
  const [form, setForm] = useState({
    label: "",
    fieldType: "TEXT" as TemplateField["fieldType"],
    required: true,
    displayOrder: 1,
    options: "",
  });

  function openAdd() {
    setEditing(null);
    setForm({ label: "", fieldType: "TEXT", required: true, displayOrder: fields.length + 1, options: "" });
    setOpen(true);
  }

  function openEdit(f: TemplateField) {
    setEditing(f);
    setForm({ label: f.label, fieldType: f.fieldType, required: f.required, displayOrder: f.displayOrder, options: "" });
    setOpen(true);
  }

  if (!template) {
    return (
      <AdminShell title="Template Details">
        <PageHeader title="Template not found" description="This template does not exist in local mock state." actions={<Button onClick={() => router.push("/templates")}>Back</Button>} />
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Template Details">
      <PageHeader
        title="Template Details"
        description="Field-level configuration view for a request template."
        actions={<Button onClick={openAdd}>Add Field</Button>}
      />
      <div className="space-y-4">
        <Card>
          <CardContent>
            <p className="text-sm text-slate-600">Template</p>
            <p className="text-xl font-semibold text-brand-dark">{template.name}</p>
            <p className="text-sm text-slate-600">Department: {template.department}</p>
            <p className="text-sm text-slate-600">Status: {template.isActive ? "Active" : "Inactive"}</p>
          </CardContent>
        </Card>

        <DataTablePlaceholder
          columns={[
            { key: "label", label: "Field" },
            { key: "fieldType", label: "Type" },
            { key: "required", label: "Required" },
            { key: "displayOrder", label: "Order" },
            { key: "__actions", label: "Actions" },
          ]}
          rows={fields.map((f) => ({
            ...f,
            required: f.required ? "Required" : "Optional",
            __actions: (
              <div className="flex gap-2">
                <button type="button" className="text-brand-primary hover:underline" onClick={() => openEdit(f)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="text-red-600 hover:underline"
                  onClick={() => {
                    if (confirm(`Delete field "${f.label}"?`)) actions.deleteTemplateField(templateId, f.id);
                  }}
                >
                  Delete
                </button>
              </div>
            ) as unknown as string,
          }))}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen} title={editing ? "Edit Field" : "Add Field"} description="Local-only template field editor.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Field label</label>
            <Input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-medium">Field type</label>
            <Select value={form.fieldType} onChange={(e) => setForm((p) => ({ ...p, fieldType: e.target.value as TemplateField["fieldType"] }))}>
              <option value="TEXT">TEXT</option>
              <option value="LONG_TEXT">LONG_TEXT</option>
              <option value="DATE">DATE</option>
              <option value="DROPDOWN">DROPDOWN</option>
              <option value="MULTI_SELECT">MULTI_SELECT</option>
              <option value="FILE">FILE</option>
              <option value="NUMBER">NUMBER</option>
              <option value="CHECKBOX">CHECKBOX</option>
              <option value="EMAIL">EMAIL</option>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Display order</label>
            <Input type="number" value={String(form.displayOrder)} onChange={(e) => setForm((p) => ({ ...p, displayOrder: Number(e.target.value || 1) }))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Required</label>
            <Select value={form.required ? "yes" : "no"} onChange={(e) => setForm((p) => ({ ...p, required: e.target.value === "yes" }))}>
              <option value="yes">Required</option>
              <option value="no">Optional</option>
            </Select>
          </div>
          {(form.fieldType === "DROPDOWN" || form.fieldType === "MULTI_SELECT") && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Options (comma-separated)</label>
              <Input value={form.options} onChange={(e) => setForm((p) => ({ ...p, options: e.target.value }))} placeholder="Option A, Option B" />
            </div>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!form.label.trim()) return alert("Label is required.");
              const payload = {
                label: form.label.trim(),
                fieldType: form.fieldType,
                required: form.required,
                displayOrder: form.displayOrder,
              };
              if (editing) actions.updateTemplateField(templateId, editing.id, payload);
              else actions.addTemplateField(templateId, payload);
              setOpen(false);
            }}
          >
            {editing ? "Save" : "Add Field"}
          </Button>
        </div>
      </Dialog>
    </AdminShell>
  );
}
