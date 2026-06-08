import { PrismaService } from '../../src/prisma/prisma.service';
import { EMAILS, SEED } from './seed-constants';

export type ResolvedSeedUsers = {
  admin: string;
  jane: string;
  henryHr: string;
  maryMkt: string;
  helenHr: string;
  markMkt: string;
};

const EMAIL_KEYS = {
  admin: EMAILS.admin,
  jane: EMAILS.jane,
  henryHr: EMAILS.henry,
  maryMkt: EMAILS.mary,
  helenHr: EMAILS.helen,
  markMkt: EMAILS.mark,
} as const;

/** Resolve demo user IDs by email so e2e works when only addresses differ from 002 UUIDs. */
export async function resolveSeedUsers(
  prisma: PrismaService,
): Promise<ResolvedSeedUsers> {
  const rows = await prisma.user.findMany({
    where: {
      email: { in: Object.values(EMAIL_KEYS), mode: 'insensitive' },
    },
    select: { id: true, email: true },
  });
  const byEmail = new Map(
    rows.map((r) => [r.email.toLowerCase(), r.id]),
  );
  const pick = (key: keyof typeof EMAIL_KEYS, fallback: string) =>
    byEmail.get(EMAIL_KEYS[key].toLowerCase()) ?? fallback;

  return {
    admin: pick('admin', SEED.users.admin),
    jane: pick('jane', SEED.users.jane),
    henryHr: pick('henryHr', SEED.users.henryHr),
    maryMkt: pick('maryMkt', SEED.users.maryMkt),
    helenHr: pick('helenHr', SEED.users.helenHr),
    markMkt: pick('markMkt', SEED.users.markMkt),
  };
}
