export const FIELD_TYPES = [
  "TEXT",
  "LONG_TEXT",
  "DATE",
  "DROPDOWN",
  "MULTI_SELECT",
  "FILE",
  "NUMBER",
  "CHECKBOX",
  "EMAIL",
] as const;

export type TemplateFieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<TemplateFieldType, string> = {
  TEXT: "Short text",
  LONG_TEXT: "Long text",
  DATE: "Date",
  DROPDOWN: "Dropdown",
  MULTI_SELECT: "Multi-select",
  FILE: "File upload",
  NUMBER: "Number",
  CHECKBOX: "Checkbox",
  EMAIL: "Email",
};

export const OPTION_FIELD_TYPES = new Set<TemplateFieldType>(["DROPDOWN", "MULTI_SELECT"]);

export function optionsToCommaString(options: unknown): string {
  if (!options) return "";
  if (Array.isArray(options)) return options.map(String).join(", ");
  if (typeof options === "string") return options;
  return "";
}

export function parseOptionsCsv(options: string): string[] {
  return options
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
