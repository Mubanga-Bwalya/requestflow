import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const svc = new PasswordService();
  const strong = 'StrongPass1234';

  it('hashes and verifies bcrypt passwords', async () => {
    const hash = await svc.hashUnsafe('legacy-demo-only');
    expect(svc.isBcryptHash(hash)).toBe(true);
    expect(await svc.verify('legacy-demo-only', hash)).toBe(true);
    expect(await svc.verify('wrong', hash)).toBe(false);
  });

  it('enforces policy on hash()', async () => {
    await expect(svc.hash('requestflow')).rejects.toThrow(
      /12 characters|too common/,
    );
    const hash = await svc.hash(strong);
    expect(await svc.verify(strong, hash)).toBe(true);
  });

  it('verifies legacy plain-text when allowed', async () => {
    const prev = process.env.ALLOW_LEGACY_PLAINTEXT_PASSWORDS;
    process.env.ALLOW_LEGACY_PLAINTEXT_PASSWORDS = 'true';
    expect(await svc.verify('requestflow', 'requestflow')).toBe(true);
    process.env.ALLOW_LEGACY_PLAINTEXT_PASSWORDS = prev;
  });

  it('rejects plain-text when legacy is disabled', async () => {
    const prev = process.env.ALLOW_LEGACY_PLAINTEXT_PASSWORDS;
    process.env.ALLOW_LEGACY_PLAINTEXT_PASSWORDS = 'false';
    expect(await svc.verify('requestflow', 'requestflow')).toBe(false);
    process.env.ALLOW_LEGACY_PLAINTEXT_PASSWORDS = prev;
  });
});
