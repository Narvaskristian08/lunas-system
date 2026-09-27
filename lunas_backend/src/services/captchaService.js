const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const allowedHostnames = () => String(process.env.TURNSTILE_ALLOWED_HOSTNAMES || '')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

exports.verifyLoginCaptcha = async ({ token, remoteIp }) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    logger.error('Web login CAPTCHA is required but TURNSTILE_SECRET_KEY is not configured');
    return { success: false, unavailable: true };
  }

  try {
    const payload = new URLSearchParams({
      secret,
      response: token,
      idempotency_key: crypto.randomUUID()
    });
    if (remoteIp) payload.set('remoteip', remoteIp);

    const response = await axios.post(SITEVERIFY_URL, payload.toString(), {
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      timeout: parseInt(process.env.TURNSTILE_TIMEOUT_MS, 10) || 8000
    });
    const result = response.data || {};
    const hostnames = allowedHostnames();
    const hostnameValid = !hostnames.length
      || (typeof result.hostname === 'string' && hostnames.includes(result.hostname.toLowerCase()));
    const actionValid = !result.action || result.action === 'login';

    return {
      success: result.success === true && hostnameValid && actionValid,
      unavailable: false
    };
  } catch (error) {
    logger.error(`Turnstile verification failed: ${error.message}`);
    return { success: false, unavailable: true };
  }
};
