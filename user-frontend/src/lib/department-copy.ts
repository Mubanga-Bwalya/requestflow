/** Display-only department descriptions for the create-request flow. */
export const DEPARTMENT_DESCRIPTIONS: Record<string, string> = {
  Billing: "Billing-related requests",
  HR: "Employee documents, leave, and staff support",
  Marketing: "Brand, campaign, and communication support",
  Innovations: "Software, systems, and digital support",
};

export function departmentDescription(name: string, apiDescription?: string | null): string {
  return DEPARTMENT_DESCRIPTIONS[name] ?? apiDescription?.trim() ?? `Submit a request to ${name}`;
}
