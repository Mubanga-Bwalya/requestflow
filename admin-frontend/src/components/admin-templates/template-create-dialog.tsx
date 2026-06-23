"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fieldLabelClassName } from "@/components/ui/field-control";
import { TEMPLATE_DESC_MAX, TEMPLATE_NAME_MAX } from "@/lib/admin-form-utils";
import type { ApiDepartment } from "@/lib/departments-api";

export type TemplateCreateForm = {
  parentDepartmentId: string;
  sectionId: string;
  name: string;
  description: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: ApiDepartment[];
  form: TemplateCreateForm;
  setForm: React.Dispatch<React.SetStateAction<TemplateCreateForm>>;
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
  const activeDepartments = useMemo(
    () => departments.filter((dept) => dept.isActive),
    [departments],
  );

  const selectedDepartment = useMemo(
    () => activeDepartments.find((d) => d.id === form.parentDepartmentId) ?? null,
    [activeDepartments, form.parentDepartmentId],
  );

  const activeSections = useMemo(
    () => (selectedDepartment?.sections ?? []).filter((s) => s.isActive),
    [selectedDepartment],
  );

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
          <label className={fieldLabelClassName} htmlFor="template-create-department">
            Department *
          </label>
          <Select
            id="template-create-department"
            className="mt-1"
            value={form.parentDepartmentId}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                parentDepartmentId: e.target.value,
                sectionId: "",
              }))
            }
          >
            <option value="">Select department…</option>
            {activeDepartments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>

        {form.parentDepartmentId && activeSections.length > 0 ? (
          <div>
            <label className={fieldLabelClassName} htmlFor="template-create-section">
              Sub-section
            </label>
            <Select
              id="template-create-section"
              className="mt-1"
              value={form.sectionId}
              onChange={(e) => setForm((p) => ({ ...p, sectionId: e.target.value }))}
            >
              <option value="">
                {selectedDepartment?.name} (department-wide)
              </option>
              {activeSections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-zamtel-muted">
              Pick a sub-section to limit this request type to that team, or keep it department-wide.
            </p>
          </div>
        ) : form.parentDepartmentId ? (
          <p className="text-sm text-zamtel-muted">
            This request type will apply to all of {selectedDepartment?.name} (no sub-sections defined).
          </p>
        ) : null}

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
        <Button disabled={creating || !form.parentDepartmentId} onClick={onSubmit}>
          {creating ? "Creating…" : "Create"}
        </Button>
      </div>
    </Dialog>
  );
}
