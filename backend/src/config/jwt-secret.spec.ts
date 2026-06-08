import { assertJwtSecretStrength, resolveJwtSecret } from './jwt-secret';

describe('jwt-secret', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.NODE_ENV;
    delete process.env.JWT_SECRET;
  });

  afterAll(() => {
    process.env = env;
  });

  it('allows dev fallback when JWT_SECRET is unset', () => {
    expect(resolveJwtSecret()).toContain('dev-only');
  });

  it('rejects weak secrets in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'change_this_secret';
    expect(() => resolveJwtSecret()).toThrow(/insecure|32 characters/i);
  });

  it('accepts strong secrets in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'a'.repeat(40);
    expect(resolveJwtSecret()).toHaveLength(40);
  });

  it('assertJwtSecretStrength rejects short secrets', () => {
    expect(() => assertJwtSecretStrength('short')).toThrow(/32 characters/);
  });
});
