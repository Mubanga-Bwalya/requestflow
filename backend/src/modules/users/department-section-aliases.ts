import { normalizeDepartmentName } from './department-aliases';

/**
 * Maps job titles to admin-defined sub-sections under a top-level department.
 * Sections must already exist locally — LDAP sync never auto-creates them.
 *
 * Rules are checked in order; the first keyword match wins.
 */
const SECTION_RULES_BY_PARENT = new Map<
  string,
  ReadonlyArray<readonly [readonly string[], string]>
>([
  [
    normalizeDepartmentName('Information Technology'),
    [
      [
        [
          'innovation',
          'innovations',
          'emerging tech',
          'digital transformation',
          'ai, analytics',
        ],
        'Innovations',
      ],
      [['integration', 'integrations', 'systems integration'], 'Integrations'],
      [
        [
          'development',
          'developer',
          'developers',
          'software',
          'application developer',
          'front end',
          'backend',
        ],
        'Development',
      ],
    ],
  ],
]);

/** Best-effort section name for a user title under a resolved parent department. */
export function inferSectionFromTitle(
  parentDepartmentName: string,
  title: string | null | undefined,
): string | null {
  const trimmed = title?.trim();
  if (!trimmed) return null;

  const rules = SECTION_RULES_BY_PARENT.get(
    normalizeDepartmentName(parentDepartmentName),
  );
  if (!rules) return null;

  const titleNorm = normalizeDepartmentName(trimmed);
  for (const [keywords, sectionName] of rules) {
    if (keywords.some((kw) => titleNorm.includes(kw))) {
      return sectionName;
    }
  }
  return null;
}
