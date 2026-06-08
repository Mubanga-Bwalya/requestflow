import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { allowLegacyPlaintextPasswords, isProduction } from '../../config/env';

const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 12;

const FORBIDDEN_PASSWORDS = new Set([
  'requestflow',
  'password',
  'password123',
  'admin',
  'admin123',
]);

@Injectable()
export class PasswordService {
  isBcryptHash(stored: string): boolean {
    return (
      stored.startsWith('$2a$') ||
      stored.startsWith('$2b$') ||
      stored.startsWith('$2y$')
    );
  }

  /** Enforces password rules for admin-created or updated credentials. */
  assertMeetsPolicy(plain: string): void {
    const password = plain?.trim() ?? '';
    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      );
    }
    if (FORBIDDEN_PASSWORDS.has(password.toLowerCase())) {
      throw new BadRequestException(
        'Password is too common. Choose a stronger password.',
      );
    }
  }

  async hash(plain: string): Promise<string> {
    this.assertMeetsPolicy(plain);
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  /** Hash without policy check (e.g. migrating legacy login password to bcrypt). */
  async hashUnsafe(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    const trimmed = stored?.trim();
    if (!trimmed) return false;
    if (this.isBcryptHash(trimmed)) {
      return bcrypt.compare(plain, trimmed);
    }
    if (!allowLegacyPlaintextPasswords()) {
      if (isProduction()) {
        return false;
      }
      return false;
    }
    return plain === trimmed;
  }
}
