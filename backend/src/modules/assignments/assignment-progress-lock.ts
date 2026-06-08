import { Prisma } from '@prisma/client';

/**
 * Transaction-scoped advisory lock per assignment.
 * Serializes milestone progress recalculation when multiple users update milestones concurrently.
 */
export async function withAssignmentProgressLock(
  tx: Prisma.TransactionClient,
  assignmentId: string,
): Promise<void> {
  await tx.$executeRaw(
    Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${assignmentId}))`,
  );
}
