export const USER_NAME_MAX = 120;
export const USER_EMAIL_MAX = 254;
export const USER_EXTERNAL_ID_MAX = 64;
export const USER_JOB_TITLE_MAX = 120;
export const USER_GN_MAX = 64;
export const DEPT_NAME_MIN = 2;
export const DEPT_NAME_MAX = 120;
export const DEPT_DESC_MAX = 500;
export const DEPT_EXTERNAL_CODE_MAX = 64;
export const TEMPLATE_NAME_MAX = 120;
export const TEMPLATE_DESC_MAX = 500;
export const FIELD_LABEL_MAX = 120;
export const FIELD_HELP_MAX = 500;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value);
  return email.length > 0 && email.length <= USER_EMAIL_MAX && EMAIL_RE.test(email);
}

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}

export function validateTemplateOptions(fieldType: string, optionsCsv: string): string | null {
  if (fieldType !== "DROPDOWN" && fieldType !== "MULTI_SELECT") return null;
  const options = optionsCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!options.length) return "Add at least one option for this field type.";
  if (options.some((o) => o.length > 120)) return "Each option must be 120 characters or fewer.";
  return null;
}
