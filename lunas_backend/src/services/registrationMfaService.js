const crypto = require('crypto');
const { deliverEmail } = require('./emailDeliveryService');
const { renderBrandedEmail } = require('./emailTemplates');

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
  const expiresInMinutes = Math.max(
    5,
    parseInt(process.env.REGISTRATION_MFA_EXPIRE_MINUTES, 10) || 10
  );
  const message = renderBrandedEmail({
    preheader: 'Complete your LUNAS registration with this verification code.',
    title: 'Verify your email',
    greeting: `Hello ${firstName || 'there'},`,
    intro: 'Use the one-time code below to finish creating your LUNAS account.',
    code,
    expiryText: `This code expires in ${expiresInMinutes} minutes.`,
    outro: 'If you did not start a registration, you can safely ignore this email.'
  });
  return deliverEmail({
    type: 'registration_mfa',
    recipient: { email, firstName },
    subject: 'Your LUNAS verification code',
    ...message,
    webhookPayload: {
      type: 'registration_mfa',
      recipient: { email, firstName },
      code,
      expiresInMinutes
    },
    deliveryUrl: process.env.REGISTRATION_MFA_DELIVERY_URL,
    deliveryToken: process.env.REGISTRATION_MFA_DELIVERY_TOKEN,
    timeoutMs: process.env.REGISTRATION_MFA_DELIVERY_TIMEOUT_MS
  });
};

exports.registrationChallengeResponse = ({ challenge, email }) => ({
  challengeToken: challenge.challengeToken,
  email,
  expiresInSeconds: challenge.expiresInSeconds,
  resendAfterSeconds: Math.max(
    30,
    parseInt(process.env.REGISTRATION_MFA_RESEND_SECONDS, 10) || 60
  )
});
