import { parseCorsOrigins } from './cors';
import { assertProductionEnvFlags } from './production-env';
import { resolveJwtSecret } from './jwt-secret';

/** Validates security-related env before the HTTP server listens. */
export function assertBootstrapSecurity(): void {
  assertProductionEnvFlags();
  resolveJwtSecret();
  parseCorsOrigins();
}
