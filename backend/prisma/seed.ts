/**
 * Demo seed via Prisma — departments, roles, users.
 *
 *   npm run db:seed                    # upsert demo org (safe to re-run; preserves passwords)
 *   npm run db:seed -- --reset-passwords # also reset demo passwords to requestflow
 *   npm run db:seed:reset              # clear workflow data + reseed (sets demo passwords)
 *
 * Local/demo password: requestflow (never use in production without rotation).
 */
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import {
  ADMIN_EMAIL,
  DEMO_PASSWORD,
  DEMO_USERS,
  DEPARTMENTS,
  DEPT_NAME,
  ROLES,
} from './seed-data';
import { resetDemoWorkflow } from './seed-reset';

async function main() {
  const reset = process.argv.includes('--reset');
  const resetPasswords =
    reset || process.argv.includes('--reset-passwords');
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

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
      const row = await prisma.department.upsert({
        where: { name: dept.name },
        create: {
          id: dept.id,
          name: dept.name,
          description: dept.description,
          externalDepartmentCode: dept.externalDepartmentCode,
          isActive: true,
        },
        update: {
          description: dept.description,
          externalDepartmentCode: dept.externalDepartmentCode,
          isActive: true,
        },
      });
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
          passwordHash,
          departmentId,
          roleId,
          jobTitle: user.jobTitle,
          isActive: true,
        },
        update: {
          fullName: user.fullName,
          ...(resetPasswords ? { passwordHash } : {}),
          departmentId,
          roleId,
          jobTitle: user.jobTitle,
          isActive: true,
        },
      });
    }

    console.log('Assigning department managers…');
    for (const dept of DEPARTMENTS) {
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
    const passwordNote = resetPasswords
      ? `demo password: ${DEMO_PASSWORD}`
      : 'passwords unchanged on existing users';
    console.log(`Done. ${deptCount} departments, ${userCount} users (${passwordNote}).`);
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
