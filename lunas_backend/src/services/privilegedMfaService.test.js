jest.mock('axios', () => ({ post: jest.fn() }));

const axios = require('axios');
const {
  createPrivilegedMfaChallenge,
  deliverPrivilegedMfaCode,
  isPrivilegedMfaChallengeTokenValid,
  privilegedMfaChallengeResponse,
  requiresPrivilegedMfa,
  verifyPrivilegedMfaChallenge
} = require('./privilegedMfaService');

describe('privileged account email MFA', () => {
  const originalEnvironment = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PRIVILEGED_MFA_SECRET = 'a-distinct-test-privileged-mfa-secret';
    process.env.PRIVILEGED_MFA_DELIVERY_URL = 'https://mailer.example/privileged-login';
    process.env.PRIVILEGED_MFA_EXPOSE_CODE = 'false';
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  test.each(['barangay_official', 'city_engineer', 'utility_provider', 'admin'])(
    'requires MFA for %s',
    (role) => expect(requiresPrivilegedMfa(role)).toBe(true)
  );

  test.each(['citizen', 'repair_personnel'])(
    'does not require privileged MFA for %s',
    (role) => expect(requiresPrivilegedMfa(role)).toBe(false)
  );

  test('binds the code to the account and one-time challenge token', () => {
    const challenge = createPrivilegedMfaChallenge('official@example.com');
    const user = {
      email: 'official@example.com',
      privilegedMfaChallengeHash: challenge.challengeTokenHash,
      privilegedMfaCodeHash: challenge.codeHash,
      privilegedMfaExpires: challenge.expiresAt
    };

    expect(verifyPrivilegedMfaChallenge({
      user,
      challengeToken: challenge.challengeToken,
      code: challenge.code
    })).toEqual({ valid: true });
    expect(verifyPrivilegedMfaChallenge({
      user,
      challengeToken: '0'.repeat(64),
      code: challenge.code
    })).toEqual({ valid: false, reason: 'invalid' });
    expect(isPrivilegedMfaChallengeTokenValid({
      user,
      challengeToken: challenge.challengeToken
    })).toBe(true);
  });

  test('delivers through the configured provider without exposing the code', async () => {
    axios.post.mockResolvedValue({ data: { accepted: true } });
    const challenge = createPrivilegedMfaChallenge('official@example.com');

    await expect(deliverPrivilegedMfaCode({
      email: 'official@example.com',
      firstName: 'Officer',
      code: challenge.code
    })).resolves.toEqual({ configured: true, delivered: true });
    expect(privilegedMfaChallengeResponse({
      challenge,
      email: 'official@example.com'
    })).not.toHaveProperty('developmentCode');
  });
});
