/**
 * One-off backfill: assign departments to users missing department_id.
 * Uses job_title → alias map (same rules as LDAP sync), then Shared Services.
 *
 *   npx ts-node --project prisma/tsconfig.seed.json scripts/backfill-user-departments.ts
 */
import { PrismaClient } from '@prisma/client';
import {
  inferDepartmentFromTitle,
  normalizeDepartmentName,
  resolveDepartmentAlias,
} from '../src/modules/users/department-aliases';

const FALLBACK_DEPARTMENT = 'Shared Services';

async function resolveOrCreateDepartmentId(
  prisma: PrismaClient,
  cache: Map<string, string>,
  rawName: string,
): Promise<string> {
  const norm = normalizeDepartmentName(rawName);
  const displayName = resolveDepartmentAlias(norm) ?? rawName.trim();
  const targetNorm = normalizeDepartmentName(displayName);

  const cached = cache.get(targetNorm);
  if (cached) return cached;

  const existing = await prisma.department.findFirst({
    where: { name: { equals: displayName, mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  if (existing) {
    cache.set(targetNorm, existing.id);
    return existing.id;
  }

  const created = await prisma.department.create({
    data: { name: displayName },
  });
  cache.set(targetNorm, created.id);
  return created.id;
}

async function main() {
  const prisma = new PrismaClient();
  const deptCache = new Map<string, string>();
  const fallbackId = await resolveOrCreateDepartmentId(
    prisma,
    deptCache,
    FALLBACK_DEPARTMENT,
  );

  const users = await prisma.user.findMany({
    where: { departmentId: null },
    select: { id: true, jobTitle: true },
  });

  let fromTitle = 0;
  let toFallback = 0;
  for (const user of users) {
    const inferred = inferDepartmentFromTitle(user.jobTitle);
    if (inferred) {
      const departmentId = await resolveOrCreateDepartmentId(
        prisma,
        deptCache,
        inferred,
      );
      await prisma.user.update({
        where: { id: user.id },
        data: { departmentId },
      });
      fromTitle += 1;
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { departmentId: fallbackId },
      });
      toFallback += 1;
    }
  }

  console.log(
    `Backfill complete: ${fromTitle} from job title aliases, ${toFallback} to ${FALLBACK_DEPARTMENT}.`,
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
