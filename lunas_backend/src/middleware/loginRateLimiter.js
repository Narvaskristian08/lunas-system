const rateLimit = require('express-rate-limit');
const { positiveInteger, normalizedEmailKey, ipKey, commonOptions: sharedOptions } = require('./securityRateLimiter');

const windowMs = positiveInteger(process.env, 'LOGIN_RATE_LIMIT_WINDOW_MS', 900000);
const accountLimit = positiveInteger(process.env, 'LOGIN_RATE_LIMIT_MAX_REQUESTS', 10);
const ipLimit = positiveInteger(process.env, 'LOGIN_IP_RATE_LIMIT_MAX_REQUESTS', 100);

const commonOptions = {
  ...sharedOptions,
  windowMs,
  skipSuccessfulRequests: true
};

const getLoginRateLimitKey = normalizedEmailKey;

// The web frontend uses a server-side BFF, so several legitimate users can
// share one outbound IP. Keep the IP bucket generous and enforce the tighter
// limit per normalized account identifier below.
const loginIpLimiter = rateLimit({
  ...commonOptions,
  limit: ipLimit,
  keyGenerator: ipKey
});

const loginAccountLimiter = rateLimit({
  ...commonOptions,
  limit: accountLimit,
  keyGenerator: getLoginRateLimitKey
});

module.exports = { getLoginRateLimitKey, loginAccountLimiter, loginIpLimiter };
