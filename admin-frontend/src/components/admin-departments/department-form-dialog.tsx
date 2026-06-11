"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fieldLabelClassName } from "@/components/ui/field-control";
import { DEPT_EXTERNAL_CODE_MAX, DEPT_NAME_MAX } from "@/lib/admin-form-utils";
import type { ApiDepartment } from "@/lib/departments-api";
import type { DeptFormState } from "@/hooks/use-admin-departments";

type Props = {
  mode: "add" | "edit" | null;
  editing: ApiDepartment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: DeptFormState;
  setForm: React.Dispatch<React.SetStateAction<DeptFormState>>;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  fieldErrors: Partial<Record<keyof DeptFormState, string>>;
  allDepartments: ApiDepartment[];
  deptUsers: { id: string; fullName: string }[];
  error: string | null;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function DepartmentFormDialog({
  mode,
  editing,
  open,
  onOpenChange,
  form,
  setForm,
  showAdvanced,
  setShowAdvanced,
  fieldErrors,
  allDepartments,
  deptUsers,
  error,
  saving,
  canSave,
  onSave,
}: Props) {
  const advancedLabel = mode === "add" ? "Advanced setup options" : "Advanced options";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "add" ? "Add department" : "Edit department"}
      description={
        mode === "add"
          ? "Create a department that can receive and manage requests."
          : "Update the department name, manager, or active status."
      }
    >
      {error ? <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <div className="grid gap-4">
        <div>
          <label className={fieldLabelClassName} htmlFor="dept-form-name">
            Department name *
          </label>
          <Input
            id="dept-form-name"
            className="mt-1"
            maxLength={DEPT_NAME_MAX}
            autoComplete="off"
            name="departmentName"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <FieldError message={fieldErrors.name} />
        </div>

        {mode === "edit" ? (
          <>
            <div>
              <label className={fieldLabelClassName} htmlFor="dept-form-manager">
                Department manager
              </label>
              <Select
                id="dept-form-manager"
                className="mt-1"
                value={form.managerUserId}
                onChange={(e) => setForm((p) => ({ ...p, managerUserId: e.target.value }))}
              >
                <option value="">No manager</option>
                {deptUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-zamtel-muted">
                Select who manages this department&apos;s inbox. Assignment is manual — not inferred from user role.
              </p>
              <FieldError message={fieldErrors.managerUserId} />
            </div>
            <div>
              <label className={fieldLabelClassName} htmlFor="dept-form-status">
                Status
              </label>
              <Select
                id="dept-form-status"
                className="mt-1"
                value={form.isActive ? "Active" : "Inactive"}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value === "Active" }))}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>
          </>
        ) : null}

        <details
          className="rounded-md border border-brand-dark/10 bg-brand-primary/5 p-3"
          open={showAdvanced}
          onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
        >
          <summary className="rf-summary-toggle px-1 text-sm font-medium text-brand-dark">{advancedLabel}</summary>
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-sm font-medium">External department code (optional)</label>
              <Input
                className="mt-1"
                maxLength={DEPT_EXTERNAL_CODE_MAX}
                value={form.externalDepartmentCode}
                onChange={(e) => setForm((p) => ({ ...p, externalDepartmentCode: e.target.value }))}
                placeholder="Finance system or org chart code"
              />
              <FieldError message={fieldErrors.externalDepartmentCode} />
            </div>
            {mode === "add" ? (
              <div>
                <label className="text-sm font-medium">Copy request types from (optional)</label>
                <Select
                  className="mt-1"
                  value={form.cloneTemplatesFromDepartmentId}
                  onChange={(e) => setForm((p) => ({ ...p, cloneTemplatesFromDepartmentId: e.target.value }))}
                >
                  <option value="">None — add types manually later</option>
                  {allDepartments
                    .filter((d) => d.templateCount > 0)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.templateCount} types)
                      </option>
                    ))}
                </Select>
                <p className="mt-1 text-xs text-zamtel-muted">Useful during initial setup to duplicate existing forms.</p>
              </div>
            ) : null}
          </div>
        </details>
      </div>
      <div className="rf-dialog-footer">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          Cancel
        </Button>
        <Button disabled={saving || !canSave} onClick={onSave}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Dialog>
  );
}
