import { assertBootstrapSecurity } from './bootstrap-security';
import { parseCorsOrigins } from './cors';
import { assertProductionEnvFlags } from './production-env';

describe('production env guards', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.NODE_ENV;
    delete process.env.ZAMTEL_AUTH_BASE_URL;
    delete process.env.JWT_SECRET;
    delete process.env.CORS_ORIGINS;
  });

  afterAll(() => {
    process.env = env;
  });

  it('does not require Zamtel config in development', () => {
    expect(() => assertProductionEnvFlags()).not.toThrow();
  });

  it('requires ZAMTEL_AUTH_BASE_URL in production', () => {
    process.env.NODE_ENV = 'production';
    expect(() => assertProductionEnvFlags()).toThrow(/ZAMTEL_AUTH_BASE_URL/);
  });

  it('accepts a configured Zamtel base URL in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.ZAMTEL_AUTH_BASE_URL = 'http://10.3.104.141:7071';
    expect(() => assertProductionEnvFlags()).not.toThrow();
  });

  it('rejects wildcard entries in CORS_ORIGINS in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGINS = 'https://app.example.com,https://*.example.com';
    expect(() => parseCorsOrigins()).toThrow(/wildcards/);
  });

  it('assertBootstrapSecurity fails when Zamtel auth is unconfigured in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a'.repeat(40);
    process.env.CORS_ORIGINS = 'https://user.example.com';
    expect(() => assertBootstrapSecurity()).toThrow(/ZAMTEL_AUTH_BASE_URL/);
  });
});
