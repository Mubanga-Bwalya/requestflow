/**
 * Remove demo seed users/departments — keep only live Zamtel directory data.
 *
 *   npx ts-node --project prisma/tsconfig.seed.json scripts/purge-demo-org-data.ts
 *
 * Deletes:
 *   - Users with @requestflow.local emails and other known demo accounts
 *   - Departments with zero remaining users (and their request templates)
 *
 * Does NOT delete roles or Zamtel (@zamtel.co.zm) users.
 */
import { PrismaClient } from '@prisma/client';

const EXTRA_DEMO_EMAILS = ['mbwalya4477@gmail.com'];

async function main() {
  const prisma = new PrismaClient();

  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: '@requestflow.local', mode: 'insensitive' } },
        { email: { in: EXTRA_DEMO_EMAILS } },
      ],
    },
    select: { id: true, email: true },
  });
  const demoIds = demoUsers.map((u) => u.id);

  if (demoIds.length) {
    await prisma.department.updateMany({
      where: { managerUserId: { in: demoIds } },
      data: { managerUserId: null },
    });
    const deleted = await prisma.user.deleteMany({
      where: { id: { in: demoIds } },
    });
    console.log(
      `Removed ${deleted.count} demo users: ${demoUsers.map((u) => u.email).join(', ')}`,
    );
  } else {
    console.log('No demo users to remove.');
  }

  const emptyDepartments = await prisma.department.findMany({
    where: { users: { none: {} } },
    select: { id: true, name: true },
  });

  if (emptyDepartments.length) {
    const emptyIds = emptyDepartments.map((d) => d.id);
    const templates = await prisma.requestTemplate.deleteMany({
      where: { departmentId: { in: emptyIds } },
    });
    const depts = await prisma.department.deleteMany({
      where: { id: { in: emptyIds } },
    });
    console.log(
      `Removed ${depts.count} empty departments (${templates.count} demo templates): ${emptyDepartments.map((d) => d.name).join(', ')}`,
    );
  } else {
    console.log('No empty departments to remove.');
  }

  const [userCount, deptCount] = await Promise.all([
    prisma.user.count(),
    prisma.department.count(),
  ]);
  console.log(`Remaining: ${userCount} users, ${deptCount} departments (Zamtel directory only).`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
