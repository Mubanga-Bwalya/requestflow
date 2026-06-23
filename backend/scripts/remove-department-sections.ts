/**
 * Remove sub-sections under a top-level department. Users are moved back to the parent.
 *
 *   npx ts-node --project prisma/tsconfig.seed.json scripts/remove-department-sections.ts "Information Technology"
 */
import { PrismaClient } from '@prisma/client';

async function main() {
  const parentName = process.argv[2]?.trim();
  if (!parentName) {
    console.error('Usage: remove-department-sections.ts "<Parent department name>"');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const parent = await prisma.department.findFirst({
    where: { name: { equals: parentName, mode: 'insensitive' }, parentDepartmentId: null },
    select: { id: true, name: true },
  });
  if (!parent) {
    console.error(`Top-level department not found: ${parentName}`);
    process.exit(1);
  }

  const sections = await prisma.department.findMany({
    where: { parentDepartmentId: parent.id },
    select: { id: true, name: true },
  });
  if (!sections.length) {
    console.log(`No sub-sections under ${parent.name}.`);
    await prisma.$disconnect();
    return;
  }

  const sectionIds = sections.map((s) => s.id);
  const moved = await prisma.user.updateMany({
    where: { departmentId: { in: sectionIds } },
    data: { departmentId: parent.id },
  });

  await prisma.department.deleteMany({ where: { id: { in: sectionIds } } });

  console.log(
    `Removed ${sections.length} sub-section(s) under ${parent.name}. ` +
      `Moved ${moved.count} user(s) back to the parent department.`,
  );
  console.log(sections.map((s) => `  - ${s.name}`).join('\n'));
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
