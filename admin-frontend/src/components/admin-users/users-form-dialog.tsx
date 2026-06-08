"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fieldLabelClassName } from "@/components/ui/field-control";
import {
  USER_EMAIL_MAX,
  USER_EXTERNAL_ID_MAX,
  USER_JOB_TITLE_MAX,
  USER_NAME_MAX,
  USER_PASSWORD_MIN,
} from "@/lib/admin-form-utils";
import { ASSIGNABLE_USER_ROLES } from "@/lib/assignable-roles";
import type { ApiDepartment } from "@/lib/departments-api";
import type { UserFormState } from "@/hooks/use-admin-users";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: UserFormState;
  setForm: React.Dispatch<React.SetStateAction<UserFormState>>;
  fieldErrors: Partial<Record<keyof UserFormState, string>>;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  departments: ApiDepartment[];
  error: string | null;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function UsersFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  fieldErrors,
  showAdvanced,
  setShowAdvanced,
  departments,
  error,
  saving,
  canSave,
  onSave,
}: Props) {
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit user" : "Add user"}
      description="Manage portal access. Required fields are marked with *."
    >
      {error ? <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={fieldLabelClassName}>Full name *</label>
          <Input
            className="mt-1"
            maxLength={USER_NAME_MAX}
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <FieldError message={fieldErrors.name} />
        </div>
        <div>
          <label className={fieldLabelClassName}>Email *</label>
          <Input
            className="mt-1"
            type="email"
            maxLength={USER_EMAIL_MAX}
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          <FieldError message={fieldErrors.email} />
        </div>
        <div>
          <label className={fieldLabelClassName}>Department *</label>
          <Select className="mt-1" value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}>
            <option value="">Select department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </Select>
          <FieldError message={fieldErrors.department} />
        </div>
        <div>
          <label className={fieldLabelClassName}>Role *</label>
          <Select className="mt-1" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
            <option value="">Select role…</option>
            {ASSIGNABLE_USER_ROLES.map((r) => (
              <option key={r.name} value={r.name}>
                {r.label}
              </option>
            ))}
          </Select>
          <FieldError message={fieldErrors.role} />
        </div>
        <div>
          <label className={fieldLabelClassName}>Status</label>
          <Select
            className="mt-1"
            value={form.status}
            onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as UserFormState["status"] }))}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </div>
        {!editing ? (
          <div>
            <label className={fieldLabelClassName}>Initial password (optional)</label>
            <Input
              className="mt-1"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder={`At least ${USER_PASSWORD_MIN} characters`}
            />
            <p className="mt-1 text-xs text-zamtel-muted">
              Set a strong initial password. Users should change it after first login.
            </p>
            {isDev ? (
              <p className="mt-1 text-xs text-amber-800">
                Development only: if left blank, a temporary demo password may be applied. Production requires an
                admin-set password or invite flow.
              </p>
            ) : (
              <p className="mt-1 text-xs text-amber-800">Production requires an initial password when creating users.</p>
            )}
            <FieldError message={fieldErrors.password} />
          </div>
        ) : null}
      </div>

      <details
        className="mt-4 rounded-md border border-brand-dark/10 bg-brand-primary/5 p-3"
        open={showAdvanced}
        onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
      >
        <summary className="rf-summary-toggle px-1 text-sm font-medium text-brand-dark">Advanced options</summary>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Job title (optional)</label>
            <Input
              className="mt-1"
              maxLength={USER_JOB_TITLE_MAX}
              value={form.jobTitle}
              onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
            />
            <FieldError message={fieldErrors.jobTitle} />
          </div>
          <div>
            <label className="text-sm font-medium">External employee ID (optional)</label>
            <Input
              className="mt-1"
              maxLength={USER_EXTERNAL_ID_MAX}
              value={form.externalEmployeeId}
              onChange={(e) => setForm((p) => ({ ...p, externalEmployeeId: e.target.value }))}
              placeholder="HRIS / directory reference"
            />
            <FieldError message={fieldErrors.externalEmployeeId} />
          </div>
        </div>
      </details>

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
