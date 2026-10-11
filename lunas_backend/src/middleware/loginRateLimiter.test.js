const { getLoginRateLimitKey } = require('./loginRateLimiter');

describe('login rate-limit key', () => {
  test('uses a stable one-way account key for email variants', () => {
    const first = getLoginRateLimitKey({ body: { email: 'User@Example.com ' }, ip: '127.0.0.1' });
    const second = getLoginRateLimitKey({ body: { email: 'user@example.com' }, ip: '10.0.0.2' });

    expect(first).toBe(second);
    expect(first).toMatch(/^account:/);
    expect(first).not.toContain('user@example.com');
  });

  test('falls back to the request IP when no email was supplied', () => {
    expect(getLoginRateLimitKey({ body: {}, ip: '127.0.0.1' })).toBe('ip:127.0.0.1');
  });
});
