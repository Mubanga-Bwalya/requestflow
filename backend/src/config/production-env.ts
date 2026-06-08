import { isProduction } from './env';

function isTruthyEnv(name: string): boolean {
  return process.env[name]?.trim().toLowerCase() === 'true';
}

/** Fails fast when unsafe overrides are set alongside NODE_ENV=production. */
export function assertProductionEnvFlags(): void {
  if (!isProduction()) return;

  if (isTruthyEnv('ALLOW_DEMO_DEFAULT_PASSWORD')) {
    throw new Error(
      'ALLOW_DEMO_DEFAULT_PASSWORD must not be true in production. Unset it or set to false.',
    );
  }

  if (isTruthyEnv('ALLOW_LEGACY_PLAINTEXT_PASSWORDS')) {
    throw new Error(
      'ALLOW_LEGACY_PLAINTEXT_PASSWORDS must not be true in production. Use bcrypt hashes only.',
    );
  }
}
