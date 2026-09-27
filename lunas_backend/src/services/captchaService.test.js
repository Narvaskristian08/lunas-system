jest.mock('axios', () => ({ post: jest.fn() }));

const axios = require('axios');
const { verifyLoginCaptcha } = require('./captchaService');

describe('web login CAPTCHA verification', () => {
  const originalSecret = process.env.TURNSTILE_SECRET_KEY;
  const originalHosts = process.env.TURNSTILE_ALLOWED_HOSTNAMES;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TURNSTILE_SECRET_KEY = 'test-secret';
    process.env.TURNSTILE_ALLOWED_HOSTNAMES = 'localhost,lunas.example';
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = originalSecret;
    if (originalHosts === undefined) delete process.env.TURNSTILE_ALLOWED_HOSTNAMES;
    else process.env.TURNSTILE_ALLOWED_HOSTNAMES = originalHosts;
  });

  test('accepts a successful login token for an allowed hostname', async () => {
    axios.post.mockResolvedValue({
      data: { success: true, hostname: 'lunas.example', action: 'login' }
    });

    await expect(verifyLoginCaptcha({ token: 'token', remoteIp: '127.0.0.1' }))
      .resolves.toEqual({ success: true, unavailable: false });
    expect(axios.post).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.stringContaining('response=token'),
      expect.objectContaining({
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
      })
    );
  });

  test('rejects a token with the wrong action or hostname', async () => {
    axios.post.mockResolvedValue({
      data: { success: true, hostname: 'attacker.example', action: 'signup' }
    });

    await expect(verifyLoginCaptcha({ token: 'token' }))
      .resolves.toEqual({ success: false, unavailable: false });
  });
});
