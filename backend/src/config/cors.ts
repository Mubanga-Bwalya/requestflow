import { isProduction } from './env';

const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

/** Explicit origin list for CORS. Never returns `true` (wildcard) in production. */
export function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS?.trim();

  if (!raw) {
    if (isProduction()) {
      throw new Error(
        'CORS_ORIGINS is required in production (comma-separated portal URLs).',
      );
    }
    return [...DEV_ORIGINS];
  }

  if (raw === '*') {
    if (isProduction()) {
      throw new Error(
        'CORS_ORIGINS cannot be "*" in production when credentials are enabled.',
      );
    }
    return [...DEV_ORIGINS];
  }

  const origins = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (isProduction() && origins.length === 0) {
    throw new Error(
      'CORS_ORIGINS must list at least one origin in production.',
    );
  }
  if (isProduction()) {
    for (const origin of origins) {
      if (origin === '*' || origin.includes('*')) {
        throw new Error(
          'CORS_ORIGINS cannot contain wildcards in production when credentials are enabled.',
        );
      }
    }
  }
  return origins.length > 0 ? origins : [...DEV_ORIGINS];
}
