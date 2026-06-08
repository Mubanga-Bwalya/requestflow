import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/** Load backend/.env for local e2e when DATABASE_URL is not already set. */
const dotenvPath = resolve(__dirname, '../.env');
if (existsSync(dotenvPath)) {
  for (const line of readFileSync(dotenvPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

/** Loaded before e2e tests (see jest-e2e.json). */
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'e2e-test-jwt-secret-minimum-32-characters-long';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:3001';
process.env.ALLOW_LEGACY_PLAINTEXT_PASSWORDS =
  process.env.ALLOW_LEGACY_PLAINTEXT_PASSWORDS ?? 'true';
/** Most e2e suites disable throttling; rate-limit.e2e-spec.ts enables it. */
process.env.E2E_DISABLE_THROTTLE = process.env.E2E_DISABLE_THROTTLE ?? 'true';
