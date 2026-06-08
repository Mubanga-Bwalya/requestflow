import { assertBootstrapSecurity } from './bootstrap-security';
import { parseCorsOrigins } from './cors';
import { assertProductionEnvFlags } from './production-env';

describe('production env guards', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.NODE_ENV;
    delete process.env.ALLOW_DEMO_DEFAULT_PASSWORD;
    delete process.env.ALLOW_LEGACY_PLAINTEXT_PASSWORDS;
    delete process.env.JWT_SECRET;
    delete process.env.CORS_ORIGINS;
  });

  afterAll(() => {
    process.env = env;
  });

  it('allows demo flags in development', () => {
    process.env.ALLOW_DEMO_DEFAULT_PASSWORD = 'true';
    process.env.ALLOW_LEGACY_PLAINTEXT_PASSWORDS = 'true';
    expect(() => assertProductionEnvFlags()).not.toThrow();
  });

  it('rejects ALLOW_DEMO_DEFAULT_PASSWORD=true in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_DEMO_DEFAULT_PASSWORD = 'true';
    expect(() => assertProductionEnvFlags()).toThrow(
      /ALLOW_DEMO_DEFAULT_PASSWORD/,
    );
  });

  it('rejects ALLOW_LEGACY_PLAINTEXT_PASSWORDS=true in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_LEGACY_PLAINTEXT_PASSWORDS = 'true';
    expect(() => assertProductionEnvFlags()).toThrow(
      /ALLOW_LEGACY_PLAINTEXT_PASSWORDS/,
    );
  });

  it('rejects wildcard entries in CORS_ORIGINS in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://app.example.com,https://*.example.com';
    expect(() => parseCorsOrigins()).toThrow(/wildcards/);
  });

  it('assertBootstrapSecurity fails on unsafe production bundle', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_DEMO_DEFAULT_PASSWORD = 'true';
    process.env.JWT_SECRET = 'a'.repeat(40);
    process.env.CORS_ORIGINS = 'https://user.example.com';
    expect(() => assertBootstrapSecurity()).toThrow(
      /ALLOW_DEMO_DEFAULT_PASSWORD/,
    );
  });
});
