/**
 * Demo seed via Prisma — departments, roles, users.
 *
 *   npm run db:seed         # upsert demo org (safe to re-run)
 *   npm run db:seed:reset   # clear workflow data + reseed
 *
 * Authentication is via Zamtel staff auth (GN + password). Demo users have no
 * local password; sign in to them in development with POST /auth/dev-login
 * (email only), which is disabled in production.
 */
import { PrismaClient } from '@prisma/client';
import {
  DEMO_USERS,
  DEPARTMENTS,
  DEPT_NAME,
  ROLES,
} from './seed-data';
import { resetDemoWorkflow } from './seed-reset';

async function main() {
  const reset = process.argv.includes('--reset');
  const prisma = new PrismaClient();

  try {
    if (reset) {
      console.log('Resetting workflow data and non-admin users…');
      await resetDemoWorkflow(prisma);
    }

    console.log('Seeding roles…');
    const roleIdByName = new Map<string, string>();
    for (const role of ROLES) {
      const row = await prisma.role.upsert({
        where: { name: role.name },
        create: { id: role.id, name: role.name, description: role.description, isActive: true },
        update: { description: role.description, isActive: true },
      });
      roleIdByName.set(role.name, row.id);
    }

    console.log('Seeding departments…');
    const deptIdByName = new Map<string, string>();
    for (const dept of DEPARTMENTS) {
      // Reconcile by name first (the unique key), then by the fixed seed id, so
      // the seed stays idempotent even when a department with this name already
      // exists under a different id — e.g. one auto-created by the LDAP
      // directory sync. Falls back to creating it with the canonical id.
      const existing =
        (await prisma.department.findFirst({
          where: { name: { equals: dept.name, mode: 'insensitive' } },
        })) ??
        (await prisma.department.findUnique({ where: { id: dept.id } }));

      const data = {
        name: dept.name,
        description: dept.description,
        externalDepartmentCode: dept.externalDepartmentCode,
        isActive: true,
      };

      const row = existing
        ? await prisma.department.update({ where: { id: existing.id }, data })
        : await prisma.department.create({ data: { id: dept.id, ...data } });
      deptIdByName.set(dept.name, row.id);
    }

    console.log('Seeding users…');
    for (const user of DEMO_USERS) {
      const departmentId = deptIdByName.get(DEPT_NAME[user.departmentName]);
      const roleId = roleIdByName.get(user.roleName);
      if (!departmentId || !roleId) {
        throw new Error(`Missing department or role for ${user.email}`);
      }
      await prisma.user.upsert({
        where: { email: user.email },
        create: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          departmentId,
          roleId,
          jobTitle: user.jobTitle,
          isActive: true,
        },
        update: {
          fullName: user.fullName,
          departmentId,
          roleId,
          jobTitle: user.jobTitle,
          isActive: true,
        },
      });
    }

    console.log('Assigning department managers…');
    for (const dept of DEPARTMENTS) {
      // Real managers are assigned via the admin portal / LDAP; only the demo
      // departments that ship with a fixture manager are wired up here.
      if (!dept.managerEmail) continue;
      const manager = await prisma.user.findUnique({ where: { email: dept.managerEmail } });
      const departmentId = deptIdByName.get(dept.name);
      if (!manager || !departmentId) {
        throw new Error(`Cannot assign manager for ${dept.name}`);
      }
      await prisma.department.update({
        where: { id: departmentId },
        data: { managerUserId: manager.id },
      });
    }

    const userCount = await prisma.user.count();
    const deptCount = await prisma.department.count();
    console.log(
      `Done. ${deptCount} departments, ${userCount} users (sign in via /auth/dev-login in development).`,
    );
    if (reset) {
      console.log('Clear browser localStorage on both portals and log in again.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
