const crypto = require('crypto');
const axios = require('axios');

const PRIVILEGED_MFA_ROLES = Object.freeze([
  'barangay_official',
  'city_engineer',
  'utility_provider',
  'admin'
]);

const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');

const mfaSecret = () => (
  process.env.PRIVILEGED_MFA_SECRET
  || process.env.REGISTRATION_MFA_SECRET
  || process.env.JWT_SECRET
);

const codeDigest = ({ email, challengeToken, code }) => {
  const secret = mfaSecret();
  if (!secret) throw new Error('PRIVILEGED_MFA_SECRET must be configured');
  return crypto
    .createHmac('sha256', secret)
    .update(`${email}:${challengeToken}:${code}`)
    .digest('hex');
};

const safeEqual = (left, right) => {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const positiveInteger = (value, fallback, minimum = 1) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= minimum ? parsed : fallback;
};

const challengeExpirySeconds = () => (
  positiveInteger(process.env.PRIVILEGED_MFA_EXPIRE_MINUTES, 10, 5) * 60
);

const resendAfterSeconds = () => (
  positiveInteger(process.env.PRIVILEGED_MFA_RESEND_SECONDS, 60, 30)
);

const deliveryConfig = () => ({
  url: process.env.PRIVILEGED_MFA_DELIVERY_URL
    || process.env.REGISTRATION_MFA_DELIVERY_URL,
  token: process.env.PRIVILEGED_MFA_DELIVERY_TOKEN
    || process.env.REGISTRATION_MFA_DELIVERY_TOKEN,
  timeout: positiveInteger(
    process.env.PRIVILEGED_MFA_DELIVERY_TIMEOUT_MS
      || process.env.REGISTRATION_MFA_DELIVERY_TIMEOUT_MS,
    10000
  )
});

const requiresPrivilegedMfa = (role) => PRIVILEGED_MFA_ROLES.includes(role);

const createPrivilegedMfaChallenge = (email) => {
  const challengeToken = crypto.randomBytes(32).toString('hex');
  const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  const expiresInSeconds = challengeExpirySeconds();

  return {
    challengeToken,
    challengeTokenHash: digest(challengeToken),
    code,
    codeHash: codeDigest({ email, challengeToken, code }),
    expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    expiresInSeconds
  };
};

const verifyPrivilegedMfaChallenge = ({ user, challengeToken, code }) => {
  if (!user.privilegedMfaExpires || user.privilegedMfaExpires <= new Date()) {
    return { valid: false, reason: 'expired' };
  }

  const challengeMatches = safeEqual(
    user.privilegedMfaChallengeHash,
    digest(challengeToken)
  );
  const codeMatches = safeEqual(
    user.privilegedMfaCodeHash,
    codeDigest({ email: user.email, challengeToken, code })
  );

  return challengeMatches && codeMatches
    ? { valid: true }
    : { valid: false, reason: 'invalid' };
};

const isPrivilegedMfaChallengeTokenValid = ({ user, challengeToken }) => (
  Boolean(user.privilegedMfaExpires && user.privilegedMfaExpires > new Date())
  && safeEqual(user.privilegedMfaChallengeHash, digest(challengeToken))
);

const deliverPrivilegedMfaCode = async ({ email, firstName, code }) => {
  const config = deliveryConfig();
  if (!config.url) return { configured: false, delivered: false };

  try {
    await axios.post(config.url, {
      purpose: 'privileged_login',
      email,
      firstName,
      code,
      expiresInMinutes: Math.ceil(challengeExpirySeconds() / 60)
    }, {
      timeout: config.timeout,
      headers: config.token ? { Authorization: `Bearer ${config.token}` } : undefined
    });
    return { configured: true, delivered: true };
  } catch (error) {
    return { configured: true, delivered: false };
  }
};

const privilegedMfaChallengeResponse = ({ challenge, email }) => {
  const payload = {
    mfaRequired: true,
    challengeToken: challenge.challengeToken,
    email,
    expiresInSeconds: challenge.expiresInSeconds,
    resendAfterSeconds: resendAfterSeconds()
  };

  if (process.env.NODE_ENV !== 'production' && process.env.PRIVILEGED_MFA_EXPOSE_CODE === 'true') {
    payload.developmentCode = challenge.code;
  }
  return payload;
};

module.exports = {
  PRIVILEGED_MFA_ROLES,
  createPrivilegedMfaChallenge,
  deliverPrivilegedMfaCode,
  isPrivilegedMfaChallengeTokenValid,
  privilegedMfaChallengeResponse,
  requiresPrivilegedMfa,
  resendAfterSeconds,
  verifyPrivilegedMfaChallenge
};
