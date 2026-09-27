const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

const codeSecret = () => process.env.REGISTRATION_MFA_SECRET || process.env.JWT_SECRET;

const hashChallengeToken = (token) => crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');

const hashCode = ({ email, challengeToken, code }) => {
  const secret = codeSecret();
  if (!secret) throw new Error('REGISTRATION_MFA_SECRET or JWT_SECRET must be configured');
  return crypto
    .createHmac('sha256', secret)
    .update(`${email.toLowerCase()}:${challengeToken}:${code}`)
    .digest('hex');
};

const safeEqual = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

exports.createRegistrationChallenge = (email) => {
  const challengeToken = crypto.randomBytes(32).toString('hex');
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresInMinutes = Math.max(
    5,
    parseInt(process.env.REGISTRATION_MFA_EXPIRE_MINUTES, 10) || 10
  );
  return {
    challengeToken,
    challengeTokenHash: hashChallengeToken(challengeToken),
    code,
    codeHash: hashCode({ email, challengeToken, code }),
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    expiresInSeconds: expiresInMinutes * 60
  };
};

exports.verifyRegistrationChallenge = ({ user, challengeToken, code }) => {
  if (!user.registrationMfaExpires || user.registrationMfaExpires <= new Date()) {
    return { valid: false, reason: 'expired' };
  }
  if (!safeEqual(user.registrationChallengeHash, hashChallengeToken(challengeToken))) {
    return { valid: false, reason: 'invalid' };
  }
  const submittedHash = hashCode({ email: user.email, challengeToken, code });
  if (!safeEqual(user.registrationMfaCodeHash, submittedHash)) {
    return { valid: false, reason: 'invalid' };
  }
  return { valid: true };
};

exports.isRegistrationChallengeTokenValid = (user, challengeToken) => (
  safeEqual(user?.registrationChallengeHash, hashChallengeToken(challengeToken))
);

exports.deliverRegistrationCode = async ({ email, firstName, code }) => {
  const deliveryUrl = process.env.REGISTRATION_MFA_DELIVERY_URL;
  const deliveryToken = process.env.REGISTRATION_MFA_DELIVERY_TOKEN;
  if (!deliveryUrl) {
    logger.warn('Registration MFA requested but no delivery provider is configured');
    return { configured: false, delivered: false };
  }

  try {
    await axios.post(deliveryUrl, {
      type: 'registration_mfa',
      recipient: { email, firstName },
      code,
      expiresInMinutes: Math.max(
        5,
        parseInt(process.env.REGISTRATION_MFA_EXPIRE_MINUTES, 10) || 10
      )
    }, {
      timeout: parseInt(process.env.REGISTRATION_MFA_DELIVERY_TIMEOUT_MS, 10) || 10000,
      ...(deliveryToken ? { headers: { authorization: `Bearer ${deliveryToken}` } } : {})
    });
    return { configured: true, delivered: true };
  } catch (error) {
    logger.error(`Registration MFA delivery failed: ${error.message}`);
    return { configured: true, delivered: false };
  }
};

exports.registrationChallengeResponse = ({ challenge, email }) => ({
  challengeToken: challenge.challengeToken,
  email,
  expiresInSeconds: challenge.expiresInSeconds,
  resendAfterSeconds: Math.max(
    30,
    parseInt(process.env.REGISTRATION_MFA_RESEND_SECONDS, 10) || 60
  ),
  ...(
    process.env.NODE_ENV !== 'production'
    && process.env.REGISTRATION_MFA_EXPOSE_CODE === 'true'
      ? { developmentCode: challenge.code }
      : {}
  )
});
