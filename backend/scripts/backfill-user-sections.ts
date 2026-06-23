/**
 * Assign users on a top-level department to existing sub-sections using the
 * same title rules as LDAP sync.
 *
 *   npm run db:backfill-sections
 */
import { PrismaClient } from '@prisma/client';
import { inferSectionFromTitle } from '../src/modules/users/department-section-aliases';

async function main() {
  const prisma = new PrismaClient();

  const parents = await prisma.department.findMany({
    where: { parentDepartmentId: null, isActive: true },
    select: {
      id: true,
      name: true,
      sections: {
        where: { isActive: true },
        select: { id: true, name: true },
      },
    },
  });

  let updated = 0;
  let unchanged = 0;

  for (const parent of parents) {
    if (!parent.sections.length) continue;

    const sectionByName = new Map(
      parent.sections.map((s) => [s.name.toLowerCase(), s.id]),
    );

    const users = await prisma.user.findMany({
      where: { departmentId: parent.id },
      select: { id: true, jobTitle: true },
    });

    for (const user of users) {
      const sectionName = inferSectionFromTitle(parent.name, user.jobTitle);
      if (!sectionName) {
        unchanged += 1;
        continue;
      }
      const sectionId = sectionByName.get(sectionName.toLowerCase());
      if (!sectionId) {
        unchanged += 1;
        continue;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { departmentId: sectionId },
      });
      updated += 1;
    }
  }

  console.log(`Section backfill complete. ${updated} user(s) moved, ${unchanged} unchanged.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
