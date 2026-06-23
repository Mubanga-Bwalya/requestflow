"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { fieldLabelClassName } from "@/components/ui/field-control";
import {
  USER_EMAIL_MAX,
  USER_EXTERNAL_ID_MAX,
  USER_GN_MAX,
  USER_JOB_TITLE_MAX,
  USER_NAME_MAX,
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

/** Read-only display for fields that are owned by the Zamtel directory. */
function ReadOnlyValue({ value }: { value?: string }) {
  return (
    <div className="mt-1 rounded-md border border-brand-dark/10 bg-brand-primary/5 px-3 py-2 text-sm text-zamtel-muted">
      {value?.trim() ? value : "—"}
    </div>
  );
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
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit user" : "Add user"}
      description="Manage portal access. Required fields are marked with *."
    >
      {error ? <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {editing ? (
        <div className="mb-3 rounded-md border border-brand-dark/10 bg-brand-primary/5 p-3 text-sm text-zamtel-muted">
          Profile details (name, email, position, status) are synced from the Zamtel directory and
          can&apos;t be edited here. Only <span className="font-medium text-brand-dark">department</span>{" "}
          and <span className="font-medium text-brand-dark">access</span> are editable.
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={fieldLabelClassName}>Full name{editing ? "" : " *"}</label>
          {editing ? (
            <ReadOnlyValue value={form.name} />
          ) : (
            <>
              <Input
                className="mt-1"
                maxLength={USER_NAME_MAX}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              <FieldError message={fieldErrors.name} />
            </>
          )}
        </div>
        <div>
          <label className={fieldLabelClassName}>Email{editing ? "" : " *"}</label>
          {editing ? (
            <ReadOnlyValue value={form.email} />
          ) : (
            <>
              <Input
                className="mt-1"
                type="email"
                maxLength={USER_EMAIL_MAX}
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
              <FieldError message={fieldErrors.email} />
            </>
          )}
        </div>
        <div>
          <label className={fieldLabelClassName}>Department *</label>
          <Select
            className="mt-1"
            value={form.department}
            onChange={(e) => setForm((p) => ({ ...p, department: e.target.value, sectionId: "" }))}
          >
            <option value="">Select department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </Select>
          <FieldError message={fieldErrors.department} />
        </div>
        {(() => {
          const sections =
            departments.find((d) => d.name === form.department)?.sections?.filter((s) => s.isActive) ?? [];
          if (sections.length === 0) return null;
          return (
            <div>
              <label className={fieldLabelClassName}>Section</label>
              <Select
                className="mt-1"
                value={form.sectionId}
                onChange={(e) => setForm((p) => ({ ...p, sectionId: e.target.value }))}
              >
                <option value="">Department-level (no section)</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          );
        })()}
        <div>
          <label className={fieldLabelClassName}>Position</label>
          {editing ? (
            <ReadOnlyValue value={form.jobTitle} />
          ) : (
            <>
              <Input
                className="mt-1"
                maxLength={USER_JOB_TITLE_MAX}
                value={form.jobTitle}
                onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                placeholder="Usually set from Zamtel directory on sign-in"
              />
              <FieldError message={fieldErrors.jobTitle} />
            </>
          )}
        </div>
        <div>
          <label className={fieldLabelClassName}>Access *</label>
          <Select className="mt-1" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
            <option value="">Select access level…</option>
            {ASSIGNABLE_USER_ROLES.map((r) => (
              <option key={r.name} value={r.name}>
                {r.label}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-zamtel-muted">
            Portal permissions (Employee, Manager, or Admin). Separate from the Zamtel job position
            above.
          </p>
          <FieldError message={fieldErrors.role} />
        </div>
        <div>
          <label className={fieldLabelClassName}>Status</label>
          {editing ? (
            <ReadOnlyValue value={form.status} />
          ) : (
            <Select
              className="mt-1"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as UserFormState["status"] }))}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          )}
        </div>
        <div>
          <label className={fieldLabelClassName}>Zamtel ID (GN)</label>
          {editing ? (
            <ReadOnlyValue value={form.gn} />
          ) : (
            <>
              <Input
                className="mt-1"
                type="text"
                autoComplete="off"
                value={form.gn}
                maxLength={USER_GN_MAX}
                onChange={(e) => setForm((p) => ({ ...p, gn: e.target.value }))}
                placeholder="e.g. GN1234 (optional)"
              />
              <p className="mt-1 text-xs text-zamtel-muted">
                Usually set automatically on the user&apos;s first Zamtel sign-in. Set it here only to
                pre-link a known staff number.
              </p>
              <FieldError message={fieldErrors.gn} />
            </>
          )}
        </div>
      </div>

      {editing ? null : (
        <details
          className="mt-4 rounded-md border border-brand-dark/10 bg-brand-primary/5 p-3"
          open={showAdvanced}
          onToggle={(e) => setShowAdvanced((e.target as HTMLDetailsElement).open)}
        >
          <summary className="rf-summary-toggle px-1 text-sm font-medium text-brand-dark">Advanced options</summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
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
      )}

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
