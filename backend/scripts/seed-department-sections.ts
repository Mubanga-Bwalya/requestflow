/**
 * Create admin-defined sub-sections under top-level departments (idempotent).
 *
 *   npm run db:seed-sections
 */
import { PrismaClient } from '@prisma/client';

const SECTIONS_BY_PARENT: Readonly<Record<string, readonly string[]>> = {};

async function main() {
  const prisma = new PrismaClient();
  let created = 0;
  let existing = 0;

  for (const [parentName, sectionNames] of Object.entries(SECTIONS_BY_PARENT)) {
    const parent = await prisma.department.findFirst({
      where: { name: { equals: parentName, mode: 'insensitive' }, parentDepartmentId: null },
      select: { id: true, name: true },
    });
    if (!parent) {
      console.warn(`Parent department not found, skipping: ${parentName}`);
      continue;
    }

    for (const sectionName of sectionNames) {
      const row = await prisma.department.findFirst({
        where: {
          parentDepartmentId: parent.id,
          name: { equals: sectionName, mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (row) {
        existing += 1;
        continue;
      }

      await prisma.department.create({
        data: {
          name: sectionName,
          parentDepartmentId: parent.id,
          isActive: true,
        },
      });
      created += 1;
      console.log(`Created section "${sectionName}" under ${parent.name}`);
    }
  }

  console.log(`Done. ${created} section(s) created, ${existing} already existed.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
