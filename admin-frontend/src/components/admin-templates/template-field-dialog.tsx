"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { fieldLabelClassName } from "@/components/ui/field-control";
import { FIELD_HELP_MAX, FIELD_LABEL_MAX } from "@/lib/admin-form-utils";
import {
  FIELD_TYPE_LABELS,
  FIELD_TYPES,
  OPTION_FIELD_TYPES,
  type TemplateFieldType,
} from "@/components/admin-templates/template-field-utils";

export type TemplateFieldFormState = {
  label: string;
  fieldType: TemplateFieldType;
  required: boolean;
  helpText: string;
  options: string;
};

type FieldErrors = Partial<Record<keyof TemplateFieldFormState, string>>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  form: TemplateFieldFormState;
  onFormChange: (patch: Partial<TemplateFieldFormState>) => void;
  formError: string | null;
  fieldErrors: FieldErrors;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function TemplateFieldDialog({
  open,
  onOpenChange,
  editing,
  form,
  onFormChange,
  formError,
  fieldErrors,
  saving,
  canSave,
  onSave,
}: Props) {
  const showOptions = OPTION_FIELD_TYPES.has(form.fieldType);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit field" : "Add field"}
      description="Field key and display order are generated automatically."
    >
      {formError ? (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={fieldLabelClassName}>Field label *</label>
          <Input
            className="mt-1"
            maxLength={FIELD_LABEL_MAX}
            value={form.label}
            onChange={(e) => onFormChange({ label: e.target.value })}
            placeholder="e.g. Request title"
          />
          <FieldError message={fieldErrors.label} />
        </div>
        <div>
          <label className={fieldLabelClassName}>Field type *</label>
          <Select
            className="mt-1"
            value={form.fieldType}
            onChange={(e) => onFormChange({ fieldType: e.target.value as TemplateFieldType })}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {FIELD_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className={fieldLabelClassName}>Required *</label>
          <Select
            className="mt-1"
            value={form.required ? "yes" : "no"}
            onChange={(e) => onFormChange({ required: e.target.value === "yes" })}
          >
            <option value="yes">Required</option>
            <option value="no">Optional</option>
          </Select>
        </div>
        {showOptions ? (
          <div className="md:col-span-2">
            <label className={fieldLabelClassName}>Options *</label>
            <Input
              className="mt-1"
              value={form.options}
              onChange={(e) => onFormChange({ options: e.target.value })}
              placeholder="Option A, Option B, Option C"
            />
            <p className="mt-1 text-xs text-zamtel-muted">Comma-separated list shown to requesters.</p>
            <FieldError message={fieldErrors.options} />
          </div>
        ) : null}
        <div className="md:col-span-2">
          <label className={fieldLabelClassName}>Help text (optional)</label>
          <Textarea
            className="mt-1"
            rows={2}
            maxLength={FIELD_HELP_MAX}
            value={form.helpText}
            onChange={(e) => onFormChange({ helpText: e.target.value })}
            placeholder="Short guidance shown on the create-request form"
          />
          <FieldError message={fieldErrors.helpText} />
        </div>
      </div>
      <div className="rf-dialog-footer">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          Cancel
        </Button>
        <Button disabled={saving || !canSave} onClick={onSave}>
          {saving ? "Saving…" : editing ? "Save" : "Add field"}
        </Button>
      </div>
    </Dialog>
  );
}
