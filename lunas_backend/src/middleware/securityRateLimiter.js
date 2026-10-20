const crypto = require('crypto');
const { isIP } = require('net');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');

const positiveInteger = (environment, name, fallback) => {
  const value = environment[name];
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > 2147483647) {
    throw new Error(`${name} must be an integer between 1 and 2147483647`);
  }
  return parsed;
};

// Never trust an arbitrary hop count or trust-all setting. Express resolves
// the first untrusted address from the socket outward through these proxies.
const trustedProxy = (value = '') => {
  const text = String(value).trim();
  if (!text || ['0', 'false'].includes(text)) return false;
  const addresses = text.split(',').map(s => s.trim());
  if (addresses.some(s => {
    const [ip, prefix, extra] = s.split('/');
    const version = isIP(ip);
    return !version || extra !== undefined || (prefix !== undefined
      && (!/^\d+$/.test(prefix) || Number(prefix) < 1 || Number(prefix) > (version === 4 ? 32 : 128)));
  })) throw new Error('TRUST_PROXY must be false/0 or explicit proxy IP addresses/CIDRs (not hop counts or trust-all)');
  return addresses;
};

const ipKey = req => {
  const ip = String(req.ip || '').split('%')[0];
  if (isIP(ip) === 4) return `ip:${ip}`;
  if (isIP(ip) !== 6) return 'ip:unknown';
  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  const mapped = canonical.match(/^::ffff:([\da-f]+):([\da-f]+)$/i);
  if (mapped) {
    const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
    return `ip:${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
  }
  const [left, right = ''] = canonical.split('::');
  const head = left ? left.split(':') : [], tail = right ? right.split(':') : [];
  const groups = canonical.includes('::') ? [...head, ...Array(8 - head.length - tail.length).fill('0'), ...tail] : head;
  const prefix = groups.slice(0, 3).map(g => parseInt(g, 16).toString(16));
  prefix.push((parseInt(groups[3], 16) & 0xff00).toString(16));
  return `ip:${prefix.join(':')}::/56`;
};
const digestKey = (kind, value) => `${kind}:${crypto.createHash('sha256').update(String(value)).digest('hex')}`;
const normalizedEmailKey = req => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : '';
  return email ? digestKey('account', email) : ipKey(req);
};
const normalizeAuthEmail = body('email').optional().isString().bail().isLength({ max: 254 })
  .bail().isEmail().bail().normalizeEmail();
const responseBody = { success: false, code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' };
const rateLimitHandler = (_req, res) => res.status(429).json(responseBody);
const commonOptions = { standardHeaders: 'draft-7', legacyHeaders: false, handler: rateLimitHandler };
const createApiLimiter = (environment = process.env) => rateLimit({ ...commonOptions,
  windowMs: positiveInteger(environment, 'RATE_LIMIT_WINDOW_MS', 900000),
  limit: positiveInteger(environment, 'RATE_LIMIT_MAX_REQUESTS', 1000), keyGenerator: ipKey
});
const createAuthLimiters = (environment = process.env) => {
  const windowMs = positiveInteger(environment, 'AUTH_RATE_LIMIT_WINDOW_MS', 900000);
  const make = (name, fallback, options = {}) => rateLimit({ ...commonOptions, windowMs,
    limit: positiveInteger(environment, name, fallback), keyGenerator: ipKey, ...options });
  return {
    authMutationIpLimiter: make('AUTH_RATE_LIMIT_MAX_REQUESTS', 200, { skip: req => ['GET', 'HEAD', 'OPTIONS'].includes(req.method) }),
    publicSensitiveIpLimiter: make('AUTH_SENSITIVE_IP_MAX_REQUESTS', 60),
    publicAccountLimiter: make('AUTH_ACCOUNT_MAX_REQUESTS', 20, {
      keyGenerator: normalizedEmailKey, skip: req => typeof req.body?.email !== 'string' || !req.body.email
    }),
    refreshIpLimiter: make('REFRESH_RATE_LIMIT_MAX_REQUESTS', 120),
    securityAccountLimiter: make('SECURITY_ACCOUNT_MAX_REQUESTS', 20, {
      keyGenerator: req => digestKey('user', req.user._id)
    })
  };
};
module.exports = { positiveInteger, trustedProxy, ipKey, normalizedEmailKey, normalizeAuthEmail,
  rateLimitHandler, commonOptions, createApiLimiter, createAuthLimiters };
