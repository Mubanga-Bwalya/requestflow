/**
 * One-shot: bcrypt-hash password_hash for all @requestflow.local users (demo password: requestflow).
 * Run: npm run hash-passwords
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const DEMO_PASSWORD = 'requestflow';
const EMAIL_SUFFIX = '@requestflow.local';

async function main() {
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = await prisma.user.findMany({
    where: { email: { endsWith: EMAIL_SUFFIX, mode: 'insensitive' } },
    select: { id: true, email: true, passwordHash: true },
  });

  let updated = 0;
  for (const u of users) {
    const stored = u.passwordHash?.trim() ?? '';
    if (
      stored.startsWith('$2') &&
      (await bcrypt.compare(DEMO_PASSWORD, stored))
    ) {
      continue;
    }
    await prisma.user.update({
      where: { id: u.id },
      data: { passwordHash: hash },
    });
    updated += 1;
    console.log(`Updated ${u.email}`);
  }

  console.log(`Done. ${updated} user(s) hashed (${users.length} total demo users).`);
  console.log(`Bcrypt hash for seeds: ${hash}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
