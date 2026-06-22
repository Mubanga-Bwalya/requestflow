"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fieldLabelClassName } from "@/components/ui/field-control";
import { TEMPLATE_DESC_MAX, TEMPLATE_NAME_MAX } from "@/lib/admin-form-utils";
import type { ApiDepartment } from "@/lib/departments-api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: ApiDepartment[];
  form: { departmentId: string; name: string; description: string };
  setForm: React.Dispatch<React.SetStateAction<{ departmentId: string; name: string; description: string }>>;
  error: string | null;
  creating: boolean;
  onSubmit: () => void;
};

export function TemplateCreateDialog({
  open,
  onOpenChange,
  departments,
  form,
  setForm,
  error,
  creating,
  onSubmit,
}: Props) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add request type"
      description="Creates an empty template. Add fields on the next screen."
    >
      {error ? <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <div className="grid gap-4">
        <div>
          <label className={fieldLabelClassName}>Target department / section *</label>
          <Select
            className="mt-1"
            value={form.departmentId}
            onChange={(e) => setForm((p) => ({ ...p, departmentId: e.target.value }))}
          >
            <option value="">Select department…</option>
            {departments.filter((d) => d.isActive).map((d) => (
              <optgroup key={d.id} label={d.name}>
                <option value={d.id}>{d.name} (whole department)</option>
                {(d.sections ?? [])
                  .filter((s) => s.isActive)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {d.name} › {s.name}
                    </option>
                  ))}
              </optgroup>
            ))}
          </Select>
          <p className="mt-1 text-xs text-zamtel-muted">
            Choose a section to make this request type specific to that section.
          </p>
        </div>
        <div>
          <label className={fieldLabelClassName}>Template name *</label>
          <Input
            className="mt-1"
            maxLength={TEMPLATE_NAME_MAX}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div>
          <label className={fieldLabelClassName}>Description (optional)</label>
          <Textarea
            className="mt-1"
            rows={2}
            maxLength={TEMPLATE_DESC_MAX}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>
      </div>
      <div className="rf-dialog-footer">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button disabled={creating} onClick={onSubmit}>
          {creating ? "Creating…" : "Create"}
        </Button>
      </div>
    </Dialog>
  );
}
