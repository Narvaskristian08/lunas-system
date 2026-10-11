const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000;
const accountLimit = parseInt(process.env.LOGIN_RATE_LIMIT_MAX_REQUESTS, 10) || 10;
const ipLimit = parseInt(process.env.LOGIN_IP_RATE_LIMIT_MAX_REQUESTS, 10) || 100;

const responseBody = {
  success: false,
  code: 'RATE_LIMITED',
  message: 'Too many sign-in attempts. Please wait a few minutes before trying again.'
};

const rateLimitHandler = (_req, res) => res.status(429).json(responseBody);

const commonOptions = {
  windowMs,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: rateLimitHandler
};

const getLoginRateLimitKey = (req) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (email) {
    return `account:${crypto.createHash('sha256').update(email).digest('hex')}`;
  }
  return `ip:${String(req.ip || 'unknown')}`;
};

// The web frontend uses a server-side BFF, so several legitimate users can
// share one outbound IP. Keep the IP bucket generous and enforce the tighter
// limit per normalized account identifier below.
const loginIpLimiter = rateLimit({
  ...commonOptions,
  limit: ipLimit
});

const loginAccountLimiter = rateLimit({
  ...commonOptions,
  limit: accountLimit,
  keyGenerator: getLoginRateLimitKey
});

module.exports = { getLoginRateLimitKey, loginAccountLimiter, loginIpLimiter };
