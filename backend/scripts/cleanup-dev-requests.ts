/**
 * DEV-ONLY — removes all requests/notifications and seeds a small demo workflow set.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/cleanup-dev-requests.ts
 */
import {
  AssignmentStatus,
  PrismaClient,
  RequestStatus,
  type Priority,
} from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_EMAILS = {
  musa: 'musa@requestflow.local',
  henry: 'henry@requestflow.local',
  helen: 'helen@requestflow.local',
} as const;

type DemoRequest = {
  requestNumber: string;
  title: string;
  description: string;
  createdByEmail: string;
  targetDept: 'HR' | 'Marketing';
  templateName: string;
  status: RequestStatus;
  priority: Priority;
  deadlineDays?: number;
  progress?: number;
  assignToHelen?: boolean;
};

const DEMO_REQUESTS: DemoRequest[] = [
  {
    requestNumber: 'RF-DEMO-0001',
    title: 'Annual leave policy clarification',
    description: 'Need guidance on carry-over days for part-time staff.',
    createdByEmail: DEMO_EMAILS.musa,
    targetDept: 'HR',
    templateName: 'Policy / HR Support Request',
    status: 'SUBMITTED',
    priority: 'LOW',
    deadlineDays: 14,
  },
  {
    requestNumber: 'RF-DEMO-0002',
    title: 'Q3 campaign poster',
    description: 'A2 poster for the internal product launch.',
    createdByEmail: DEMO_EMAILS.musa,
    targetDept: 'Marketing',
    templateName: 'Graphic Design Request',
    status: 'SUBMITTED',
    priority: 'HIGH',
    deadlineDays: 10,
  },
  {
    requestNumber: 'RF-DEMO-0003',
    title: 'Product launch social posts',
    description: 'Three LinkedIn posts for the fibre upgrade campaign.',
    createdByEmail: DEMO_EMAILS.musa,
    targetDept: 'Marketing',
    templateName: 'Social Media Post Request',
    status: 'SUBMITTED',
    priority: 'MEDIUM',
    deadlineDays: 7,
  },
  {
    requestNumber: 'RF-DEMO-0004',
    title: 'Employee handbook update',
    description: 'Refresh remote-work section after policy change.',
    createdByEmail: DEMO_EMAILS.musa,
    targetDept: 'HR',
    templateName: 'Policy / HR Support Request',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    deadlineDays: 21,
    progress: 40,
    assignToHelen: true,
  },
  {
    requestNumber: 'RF-DEMO-0005',
    title: 'Office relocation FAQ',
    description: 'HR FAQ document for staff moving to floor 3.',
    createdByEmail: DEMO_EMAILS.musa,
    targetDept: 'HR',
    templateName: 'Policy / HR Support Request',
    status: 'COMPLETED',
    priority: 'LOW',
    progress: 100,
    assignToHelen: true,
  },
];

async function loadContext() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: Object.values(DEMO_EMAILS),
        mode: 'insensitive',
      },
    },
    include: { department: true },
  });
  const byEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));

  const departments = await prisma.department.findMany({
    where: { name: { in: ['HR', 'Marketing'], mode: 'insensitive' } },
  });
  const deptByName = new Map(
    departments.map((d) => [d.name.toLowerCase(), d]),
  );

  const templates = await prisma.requestTemplate.findMany({
    where: { isActive: true },
    include: { fields: { where: { isActive: true } } },
  });
  const templateKey = (dept: string, name: string) =>
    `${dept.toLowerCase()}::${name.toLowerCase()}`;
  const templateByKey = new Map(
    templates.map((t) => [
      templateKey(
        departments.find((d) => d.id === t.departmentId)?.name ?? '',
        t.name,
      ),
      t,
    ]),
  );

  return { byEmail, deptByName, templateByKey, templateKey };
}

function deadlineFromDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 59, 0);
  return d;
}

async function seedDemoRequests() {
  const ctx = await loadContext();
  const year = new Date().getFullYear();

  for (const spec of DEMO_REQUESTS) {
    const creator = ctx.byEmail.get(spec.createdByEmail.toLowerCase());
    if (!creator?.departmentId) {
      throw new Error(`User not found or has no department: ${spec.createdByEmail}`);
    }

    const target = ctx.deptByName.get(spec.targetDept.toLowerCase());
    if (!target) throw new Error(`Department not found: ${spec.targetDept}`);

    const template = ctx.templateByKey.get(
      ctx.templateKey(spec.targetDept, spec.templateName),
    );
    if (!template) {
      throw new Error(`Template not found: ${spec.templateName} (${spec.targetDept})`);
    }

    const titleField = template.fields.find((f) => f.fieldKey === 'title');
    const descField = template.fields.find((f) => f.fieldKey === 'description');

    const request = await prisma.request.create({
      data: {
        requestNumber: spec.requestNumber,
        title: spec.title,
        description: spec.description,
        createdByUserId: creator.id,
        sourceDepartmentId: creator.departmentId,
        targetDepartmentId: target.id,
        templateId: template.id,
        status: spec.status,
        priority: spec.priority,
        progressPercentage: spec.progress ?? 0,
        deadline: spec.deadlineDays
          ? deadlineFromDays(spec.deadlineDays)
          : null,
        submittedAt: new Date(),
        completedAt: spec.status === 'COMPLETED' ? new Date() : null,
        currentStage:
          spec.status === 'SUBMITTED'
            ? 'Awaiting manager review'
            : spec.status === 'IN_PROGRESS'
              ? 'Work in progress'
              : spec.status === 'COMPLETED'
                ? 'Ready for requester review'
                : null,
        fieldAnswers: {
          create: [
            ...(titleField
              ? [
                  {
                    templateFieldId: titleField.id,
                    answerText: spec.title,
                  },
                ]
              : []),
            ...(descField
              ? [
                  {
                    templateFieldId: descField.id,
                    answerText: spec.description,
                  },
                ]
              : []),
          ],
        },
      },
    });

    if (spec.assignToHelen) {
      const helen = ctx.byEmail.get(DEMO_EMAILS.helen.toLowerCase());
      const henry = ctx.byEmail.get(DEMO_EMAILS.henry.toLowerCase());
      if (!helen || !henry) throw new Error('Helen or Henry demo user missing');

      const assignmentStatus: AssignmentStatus =
        spec.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS';

      await prisma.assignment.create({
        data: {
          requestId: request.id,
          title: `${spec.title} — assignment`,
          assignedByUserId: henry.id,
          departmentId: target.id,
          status: assignmentStatus,
          progressPercentage: spec.progress ?? 0,
          deadline: request.deadline,
          members: {
            create: [{ userId: helen.id, isManagerMember: false }],
          },
          milestones: {
            create: [
              {
                ownerUserId: helen.id,
                title: 'Draft and review',
                status: spec.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
                progressPercentage: spec.progress ?? 0,
              },
            ],
          },
        },
      });
    }
  }

  await prisma.$executeRaw`
    INSERT INTO request_number_sequences (year, last_value)
    VALUES (${year}, ${DEMO_REQUESTS.length})
    ON CONFLICT (year) DO UPDATE SET last_value = ${DEMO_REQUESTS.length}
  `;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('cleanup-dev-requests.ts must not run in production.');
  }

  const before = await prisma.request.count();
  console.log(`Removing ${before} request(s) and related workflow data…`);

  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.request.deleteMany(),
  ]);

  console.log('Seeding demo workflow requests…');
  await seedDemoRequests();

  const after = await prisma.request.count();
  console.log(`Done. ${after} demo request(s) ready for manual testing.`);
  console.log('');
  console.log('Demo inbox (Henry / HR):     RF-DEMO-0001, RF-DEMO-0004, RF-DEMO-0005');
  console.log('Demo inbox (Mary / Mktg):   RF-DEMO-0002, RF-DEMO-0003');
  console.log('Demo tasks (Helen):         RF-DEMO-0004, RF-DEMO-0005');
  console.log('Demo approve (Musa):        RF-DEMO-0005 (COMPLETED)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
