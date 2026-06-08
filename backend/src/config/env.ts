/** True when NODE_ENV is production (case-insensitive). */
export function isProduction(): boolean {
  return process.env.NODE_ENV?.trim().toLowerCase() === 'production';
}

/** Demo-only default password allowed outside production. */
export function allowDemoDefaultPassword(): boolean {
  if (isProduction()) return false;
  return process.env.ALLOW_DEMO_DEFAULT_PASSWORD?.trim() !== 'false';
}

/** Legacy plain-text password compare (pre-bcrypt seeds). Never in production unless explicitly enabled. */
export function allowLegacyPlaintextPasswords(): boolean {
  if (isProduction()) {
    return process.env.ALLOW_LEGACY_PLAINTEXT_PASSWORDS?.trim() === 'true';
  }
  return process.env.ALLOW_LEGACY_PLAINTEXT_PASSWORDS?.trim() !== 'false';
}
