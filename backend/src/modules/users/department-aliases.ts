/**
 * Maps raw AD `department` strings to the curated canonical department names.
 *
 * The live AD directory uses many variant / near-duplicate names for the same
 * department (typos, abbreviations, granular sub-teams). This table folds those
 * onto the canonical set so the recurring LDAP sync keeps users on the curated
 * departments instead of recreating drift.
 *
 * Mirrors the one-off cleanup in database/017_consolidate_ldap_departments.sql.
 * Keys are matched after normalization (trim + lowercase + collapsed spaces).
 */
const ALIAS_ENTRIES: ReadonlyArray<[string, string]> = [
  ['Audit', 'Internal Audit'],
  ['Audit & Risk Department', 'Internal Audit'],
  ['Senior Risk and Compliance Specialist', 'Risk and Compliance'],
  ['Commercail', 'Commercial'],
  ['Commerical', 'Commercial'],
  ['Commericla', 'Commercial'],
  ['Commercial Zamtel', 'Commercial'],
  ['Corporate Communications', 'Customer Experience and Public Relations'],
  ['Customer Experience', 'Customer Experience and Public Relations'],
  ['Corporate Shared Services', 'Shared Services'],
  ['Corporate Support Services', 'Shared Services'],
  ['Corporate Strategy & Planning', 'Shared Services'],
  ['Credit Control Officer', 'Finance'],
  ['Enterprise Sales', 'Zamtel Business'],
  ['Enterprise Zamtel Business', 'Zamtel Business'],
  ['Fixed Enterprise & Consumer Sales', 'Sales and Distribution'],
  ['Fixed Sales', 'Sales and Distribution'],
  ['Mobile Sales', 'Sales and Distribution'],
  ['Sales', 'Sales and Distribution'],
  ['Sales & Contribution', 'Sales and Distribution'],
  ['Sales & Distributions', 'Sales and Distribution'],
  ['Trade Development Representative', 'Sales and Distribution'],
  ['FNO Specialists', 'Technical'],
  ['FO', 'Technical'],
  ['NOC', 'Technical'],
  ['Technician', 'Technical'],
  ['Technical & Information Services', 'Technical'],
  ['Information Services', 'Information Technology'],
  ['IT', 'Information Technology'],
  ['Innovations', 'Information Technology'],
  ['Legal & Corporate Services', 'Legal'],
  ['Mobile Money', 'Zamtel Money'],
  ['Money Money', 'Zamtel Money'],
  ['Procurement', 'Supply Chain'],
];

/** Trim, lowercase, and collapse internal whitespace runs to a single space. */
export function normalizeDepartmentName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

const ALIAS_MAP = new Map<string, string>(
  ALIAS_ENTRIES.map(([src, canon]) => [normalizeDepartmentName(src), canon]),
);

/** Canonical name for a raw AD department string, or null if not aliased. */
export function resolveDepartmentAlias(normalizedName: string): string | null {
  return ALIAS_MAP.get(normalizedName) ?? null;
}

/**
 * When LDAP omits `department`, many Zamtel AD rows still encode the team in
 * `title` (e.g. "Trade Development Representative" → Sales and Distribution).
 */
export function inferDepartmentFromTitle(
  title: string | null | undefined,
): string | null {
  const trimmed = title?.trim();
  if (!trimmed) return null;
  return resolveDepartmentAlias(normalizeDepartmentName(trimmed));
}
