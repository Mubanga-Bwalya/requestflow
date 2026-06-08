export function slugifyFieldKey(label: string) {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return base || 'field';
}

export function mapTemplateField(field: {
  id: string;
  label: string;
  fieldKey: string;
  fieldType: string;
  isRequired: boolean;
  options: unknown;
  helpText: string | null;
  displayOrder: number;
  isActive: boolean;
}) {
  return {
    id: field.id,
    label: field.label,
    fieldKey: field.fieldKey,
    fieldType: field.fieldType,
    isRequired: field.isRequired,
    options: field.options,
    helpText: field.helpText,
    displayOrder: field.displayOrder,
    isActive: field.isActive,
  };
}
