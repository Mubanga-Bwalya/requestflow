import type { Priority } from "@/types/request";
import type { RequestFieldDef, RequestTypeDef } from "@/lib/request-templates";

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function priorityLabel(value: Priority | string): string {
  return PRIORITY_OPTIONS.find((o) => o.value === value)?.label ?? String(value);
}

export function deriveRequestTitle(values: Record<string, string>, requestType: RequestTypeDef): string {
  const title = values.title?.trim();
  if (title) return title;
  return requestType.name;
}

export function deriveRequestDescription(
  values: Record<string, string>,
  requestType: RequestTypeDef,
): string | undefined {
  const description = values.description?.trim();
  if (description) return description;

  const longText = requestType.fields.find(
    (f) => f.type === "LONG_TEXT" && f.key !== "description" && values[f.key]?.trim(),
  );
  return longText ? values[longText.key].trim() : undefined;
}

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
}

export function validateTemplateFields(
  fields: RequestFieldDef[],
  values: Record<string, string>,
  allowUploads: boolean,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const raw = values[field.key] ?? "";
    const trimmed = raw.trim();

    if (field.required && !(field.type === "FILE" && !allowUploads)) {
      if (field.type === "CHECKBOX") {
        if (raw !== "true") errors[field.key] = `${field.label} is required.`;
      } else if (!trimmed) {
        errors[field.key] = `${field.label} is required.`;
      }
    }

    if (trimmed && field.type === "DATE" && !isValidDateString(trimmed)) {
      errors[field.key] = `Enter a valid date for ${field.label}.`;
    }

    if (trimmed && field.type === "EMAIL" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      errors[field.key] = `Enter a valid email for ${field.label}.`;
    }
  }

  return errors;
}

export function trimFieldValues(values: Record<string, string>): Record<string, string> {
  const next: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    next[key] = typeof value === "string" ? value.trim() : value;
  }
  return next;
}
