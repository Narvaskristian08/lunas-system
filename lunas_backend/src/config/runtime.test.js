const { validateRuntimeConfig } = require('./runtime');

const productionEnvironment = (overrides = {}) => ({
  NODE_ENV: 'production',
  MONGODB_URI: 'mongodb://database.example/lunas',
  JWT_SECRET: 'access-secret-with-at-least-32-characters',
  JWT_REFRESH_SECRET: 'refresh-secret-with-at-least-32-characters',
  TURNSTILE_SECRET_KEY: 'configured-turnstile-secret',
  TURNSTILE_ALLOWED_HOSTNAMES: 'lunas.example.gov.ph',
  ...overrides
});

describe('production runtime configuration', () => {
  test('accepts distinct access and refresh secrets', () => {
    expect(() => validateRuntimeConfig(productionEnvironment())).not.toThrow();
  });

  test.each([
    ['JWT_SECRET', ''],
    ['JWT_SECRET', 'replace_with_a_secret_that_is_long_enough'],
    ['JWT_REFRESH_SECRET', 'too-short'],
    ['MONGODB_URI', 'http://not-mongodb.example'],
    ['TURNSTILE_SECRET_KEY', ''],
    ['TURNSTILE_ALLOWED_HOSTNAMES', '']
  ])('rejects unsafe production %s configuration', (name, value) => {
    expect(() => validateRuntimeConfig(productionEnvironment({ [name]: value }))).toThrow(name);
  });

  test('requires a distinct refresh-token secret', () => {
    const shared = 'one-shared-secret-is-not-safe-for-both-token-types';
    expect(() => validateRuntimeConfig(productionEnvironment({
      JWT_SECRET: shared,
      JWT_REFRESH_SECRET: shared
    }))).toThrow('distinct');
  });

  test('does not impose production requirements on local tests and development', () => {
    expect(() => validateRuntimeConfig({ NODE_ENV: 'test' })).not.toThrow();
  });
});
