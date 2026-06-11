/**
 * DEV-ONLY load test seed — adds requests for an existing user.
 * Does NOT delete data. Does NOT run in CI/production.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-load-test.ts --requests=1000
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function arg(name: string, fallback: number): number {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  const n = parseInt(hit.split('=')[1] ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('seed-load-test.ts must not run in production.');
  }

  const count = arg('requests', 100);
  const user = await prisma.user.findFirst({
    where: { email: 'musa@requestflow.local', isActive: true },
    include: { department: true },
  });
  const hr = await prisma.department.findFirst({ where: { name: 'HR' } });
  const template = await prisma.requestTemplate.findFirst({
    where: { departmentId: hr?.id, isActive: true },
  });

  if (!user?.departmentId || !hr || !template) {
    throw new Error('Seed core data (002) required: Musa, HR department, template.');
  }

  const year = new Date().getFullYear();
  const existing = await prisma.request.count();
  console.log(`Adding ${count} requests (existing: ${existing})…`);

  for (let i = 0; i < count; i++) {
    const n = String(existing + i + 1).padStart(4, '0');
    await prisma.request.create({
      data: {
        requestNumber: `RF-${year}-LT${n}`,
        title: `Load test request ${n}`,
        description: 'Dev-only performance seed',
        createdByUserId: user.id,
        sourceDepartmentId: user.departmentId,
        targetDepartmentId: hr.id,
        templateId: template.id,
        status: i % 5 === 0 ? 'SUBMITTED' : 'IN_PROGRESS',
        priority: 'MEDIUM',
        progressPercentage: i % 100,
        submittedAt: new Date(),
      },
    });
    if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${count}`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
