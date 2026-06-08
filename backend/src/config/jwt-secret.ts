import { isProduction } from './env';

const MIN_SECRET_LENGTH = 32;

const UNSAFE_SECRETS = new Set(
  [
    'change_this_secret',
    'change_this_secre',
    'secret',
    'jwt_secret',
    'your-secret',
    'requestflow',
  ].map((s) => s.toLowerCase()),
);

export function assertJwtSecretStrength(secret: string): void {
  const trimmed = secret.trim();
  if (trimmed.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production.`,
    );
  }
  if (UNSAFE_SECRETS.has(trimmed.toLowerCase())) {
    throw new Error(
      'JWT_SECRET is a known insecure default. Set a unique random secret.',
    );
  }
}

/**
 * Resolves JWT secret. In production: required and must pass strength checks.
 * In development: uses JWT_SECRET or a local-only fallback.
 */
export function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    if (isProduction()) {
      throw new Error(
        'JWT_SECRET environment variable is required in production.',
      );
    }
    return 'dev-only-insecure-secret-not-for-production-use';
  }
  if (isProduction()) {
    assertJwtSecretStrength(secret);
  }
  return secret;
}
