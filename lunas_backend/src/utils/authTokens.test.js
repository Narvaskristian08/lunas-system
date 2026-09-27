const {
  createAccessToken,
  hashToken,
  isCurrentTokenVersion,
  issueTokenPair,
  verifyAccessToken,
  verifyRefreshToken
} = require('./authTokens');

describe('authentication token helpers', () => {
  const originalEnvironment = { ...process.env };

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-access-secret-that-is-long-enough';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-that-is-long-enough';
    process.env.JWT_EXPIRE = '15m';
    process.env.JWT_REFRESH_EXPIRE = '30d';
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  test('issues purpose-bound access and refresh tokens with a token version', () => {
    const pair = issueTokenPair({ _id: '507f191e810c19729de860ea', tokenVersion: 4 });
    const access = verifyAccessToken(pair.accessToken);
    const refresh = verifyRefreshToken(pair.refreshToken);

    expect(access.tokenType).toBe('access');
    expect(refresh.tokenType).toBe('refresh');
    expect(access.tokenVersion).toBe(4);
    expect(refresh.tokenVersion).toBe(4);
    expect(pair.refreshTokenHash).toBe(hashToken(pair.refreshToken));
    expect(pair.refreshTokenExpiresAt).toBeInstanceOf(Date);
  });

  test('requires a matching explicit token version', () => {
    const user = { tokenVersion: 2 };

    expect(isCurrentTokenVersion({ tokenVersion: 2 }, user)).toBe(true);
    expect(isCurrentTokenVersion({ tokenVersion: 1 }, user)).toBe(false);
    expect(isCurrentTokenVersion({}, user)).toBe(false);
  });

  test('refuses privileged tokens without MFA and preserves proof across the pair', () => {
    const user = {
      _id: '507f191e810c19729de860eb',
      role: 'admin',
      tokenVersion: 1
    };

    expect(() => issueTokenPair(user)).toThrow('verified MFA');
    expect(() => createAccessToken(user)).toThrow('verified MFA');

    const pair = issueTokenPair(user, {
      mfaVerified: true,
      mfaAuthenticatedAt: 1789920000
    });
    const access = verifyAccessToken(pair.accessToken);
    const refresh = verifyRefreshToken(pair.refreshToken);

    expect(access.amr).toEqual(['pwd', 'email_otp']);
    expect(refresh.amr).toEqual(['pwd', 'email_otp']);
    expect(access.mfaAuthenticatedAt).toBe(1789920000);
    expect(refresh.mfaAuthenticatedAt).toBe(1789920000);
  });
});
