"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  optionsToCommaString,
  parseOptionsCsv,
  type TemplateFieldType,
} from "@/components/admin-templates/template-field-utils";
import type { TemplateFieldFormState } from "@/components/admin-templates/template-field-dialog";
import { FIELD_HELP_MAX, FIELD_LABEL_MAX, validateTemplateOptions } from "@/lib/admin-form-utils";
import { peekApiCache } from "@/lib/query-cache";
import {
  createTemplateField,
  deactivateTemplateField,
  fetchTemplateDetail,
  updateTemplateField,
  type ApiTemplateDetail,
  type ApiTemplateField,
} from "@/lib/templates-api";
import { apiErrorMessage } from "@/lib/api-error";

const emptyForm = (): TemplateFieldFormState => ({
  label: "",
  fieldType: "TEXT",
  required: true,
  helpText: "",
  options: "",
});

function validateFieldForm(form: TemplateFieldFormState) {
  const errors: Partial<Record<keyof TemplateFieldFormState, string>> = {};
  const label = form.label.trim();

  if (!label) errors.label = "Field label is required.";
  else if (label.length > FIELD_LABEL_MAX) {
    errors.label = `Label must be ${FIELD_LABEL_MAX} characters or fewer.`;
  }

  const optionsError = validateTemplateOptions(form.fieldType, form.options);
  if (optionsError) errors.options = optionsError;

  if (form.helpText.trim().length > FIELD_HELP_MAX) {
    errors.helpText = `Help text must be ${FIELD_HELP_MAX} characters or fewer.`;
  }

  return errors;
}

export function useTemplateDetail(templateId: string) {
  const [template, setTemplate] = useState<ApiTemplateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ApiTemplateField | null>(null);
  const [form, setForm] = useState<TemplateFieldFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fieldErrors = useMemo(() => validateFieldForm(form), [form]);
  const canSave = Object.keys(fieldErrors).length === 0;

  const load = useCallback(async () => {
    const cacheKey = `template:${templateId}`;
    const cached = peekApiCache<ApiTemplateDetail>(cacheKey);
    if (cached) {
      setTemplate(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      setTemplate(await fetchTemplateDetail(templateId));
    } catch {
      setError("Could not load template.");
      if (!cached) setTemplate(null);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchForm = (patch: Partial<TemplateFieldFormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  function openAdd() {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    setOpen(true);
  }

  function openEdit(f: ApiTemplateField) {
    setEditing(f);
    setForm({
      label: f.label,
      fieldType: f.fieldType as TemplateFieldType,
      required: f.isRequired,
      helpText: f.helpText ?? "",
      options: optionsToCommaString(f.options),
    });
    setFormError(null);
    setOpen(true);
  }

  async function saveField() {
    setFormError(null);
    if (Object.keys(fieldErrors).length) return;

    setSaving(true);
    try {
      const options =
        form.fieldType === "DROPDOWN" || form.fieldType === "MULTI_SELECT"
          ? parseOptionsCsv(form.options)
          : undefined;

      const payload = {
        label: form.label.trim(),
        fieldType: form.fieldType,
        isRequired: form.required,
        helpText: form.helpText.trim() || undefined,
        ...(options?.length ? { options } : {}),
      };

      if (editing) {
        await updateTemplateField(templateId, editing.id, payload);
      } else {
        await createTemplateField(templateId, payload);
      }
      await load();
      setOpen(false);
    } catch (e) {
      setFormError(apiErrorMessage(e, "Failed to save field."));
    } finally {
      setSaving(false);
    }
  }

  async function deactivateField(f: ApiTemplateField) {
    await deactivateTemplateField(templateId, f.id);
    await load();
  }

  const activeFields = template?.fields.filter((f) => f.isActive) ?? [];

  return {
    template,
    loading,
    error,
    activeFields,
    dialog: {
      open,
      setOpen,
      editing: Boolean(editing),
      form,
      patchForm,
      formError,
      fieldErrors,
      canSave,
      saving,
      openAdd,
      openEdit,
      saveField,
    },
    deactivateField,
  };
}
