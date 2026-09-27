jest.mock('axios', () => ({ post: jest.fn() }));

const axios = require('axios');
const {
  createRegistrationChallenge,
  deliverRegistrationCode,
  registrationChallengeResponse,
  verifyRegistrationChallenge
} = require('./registrationMfaService');

describe('registration email MFA', () => {
  const originalSecret = process.env.REGISTRATION_MFA_SECRET;
  const originalDeliveryUrl = process.env.REGISTRATION_MFA_DELIVERY_URL;
  const originalExpose = process.env.REGISTRATION_MFA_EXPOSE_CODE;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REGISTRATION_MFA_SECRET = 'a-distinct-test-registration-secret';
    process.env.REGISTRATION_MFA_DELIVERY_URL = 'https://mailer.example/registration';
    process.env.REGISTRATION_MFA_EXPOSE_CODE = 'false';
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.REGISTRATION_MFA_SECRET;
    else process.env.REGISTRATION_MFA_SECRET = originalSecret;
    if (originalDeliveryUrl === undefined) delete process.env.REGISTRATION_MFA_DELIVERY_URL;
    else process.env.REGISTRATION_MFA_DELIVERY_URL = originalDeliveryUrl;
    if (originalExpose === undefined) delete process.env.REGISTRATION_MFA_EXPOSE_CODE;
    else process.env.REGISTRATION_MFA_EXPOSE_CODE = originalExpose;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });

  test('hashes the code and verifies only the matching challenge', () => {
    const challenge = createRegistrationChallenge('juan@example.com');
    const user = {
      email: 'juan@example.com',
      registrationChallengeHash: challenge.challengeTokenHash,
      registrationMfaCodeHash: challenge.codeHash,
      registrationMfaExpires: challenge.expiresAt
    };

    expect(verifyRegistrationChallenge({
      user,
      challengeToken: challenge.challengeToken,
      code: challenge.code
    })).toEqual({ valid: true });
    expect(verifyRegistrationChallenge({
      user,
      challengeToken: challenge.challengeToken,
      code: '000000'
    })).toEqual({ valid: false, reason: 'invalid' });
  });

  test('delivers through the configured provider without exposing the code in production data', async () => {
    axios.post.mockResolvedValue({ data: { accepted: true } });
    const challenge = createRegistrationChallenge('juan@example.com');

    await expect(deliverRegistrationCode({
      email: 'juan@example.com',
      firstName: 'Juan',
      code: challenge.code
    })).resolves.toEqual({ configured: true, delivered: true });
    expect(registrationChallengeResponse({
      challenge,
      email: 'juan@example.com'
    })).not.toHaveProperty('developmentCode');
  });
});
