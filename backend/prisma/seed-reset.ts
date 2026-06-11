import { PrismaClient } from '@prisma/client';
import { ADMIN_EMAIL } from './seed-data';

/** Clears workflow data and non-admin users. Keeps admin account. */
export async function resetDemoWorkflow(prisma: PrismaClient): Promise<void> {
  await prisma.department.updateMany({
    where: { managerUserId: { not: null } },
    data: { managerUserId: null },
  });

  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.assignmentMember.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.missingInformationItem.deleteMany();
  await prisma.missingInformationRequest.deleteMany();
  await prisma.requestFieldAnswer.deleteMany();
  await prisma.request.deleteMany();
  await prisma.systemEvent.deleteMany();
  await prisma.$executeRawUnsafe('TRUNCATE request_number_sequences');

  await prisma.user.deleteMany({
    where: { email: { not: ADMIN_EMAIL } },
  });
}
