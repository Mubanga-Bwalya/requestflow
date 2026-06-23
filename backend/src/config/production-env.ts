import { isProduction } from './env';

/** Fails fast on unsafe / incomplete configuration alongside NODE_ENV=production. */
export function assertProductionEnvFlags(): void {
  if (!isProduction()) return;

  // Staff auth is the only login path in production (dev-login is disabled),
  // so the Zamtel auth service must be configured.
  if (!process.env.ZAMTEL_AUTH_BASE_URL?.trim()) {
    throw new Error(
      'ZAMTEL_AUTH_BASE_URL must be set in production so staff can sign in via Zamtel auth.',
    );
  }
}
