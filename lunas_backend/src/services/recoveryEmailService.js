const crypto = require('crypto');
const { deliverEmail, escapeHtml } = require('./emailDeliveryService');

const codeSecret = () => process.env.RECOVERY_EMAIL_SECRET || process.env.JWT_SECRET;

const hashCode = ({ email, code }) => {
  const secret = codeSecret();
  if (!secret) throw new Error('RECOVERY_EMAIL_SECRET or JWT_SECRET must be configured');
  return crypto.createHmac('sha256', secret)
    .update(`${email.toLowerCase()}:${code}`)
    .digest('hex');
};

const safeEqual = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const maskEmail = (email) => {
  const [localPart, domain] = String(email || '').split('@');
  if (!localPart || !domain) return '';
  if (localPart.length <= 2) return `${localPart[0] || '*'}***@${domain}`;
  return `${localPart[0]}${'*'.repeat(Math.max(2, localPart.length - 2))}${localPart.at(-1)}@${domain}`;
};

const createRecoveryEmailChallenge = (email) => {
  const code = crypto.randomInt(100000, 1000000).toString();
  const expiresInMinutes = Math.max(
    5,
    parseInt(process.env.RECOVERY_EMAIL_EXPIRE_MINUTES, 10) || 10
  );
  return {
    code,
    codeHash: hashCode({ email, code }),
    expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    expiresInSeconds: expiresInMinutes * 60,
    resendAfterSeconds: Math.max(
      30,
      parseInt(process.env.RECOVERY_EMAIL_RESEND_SECONDS, 10) || 60
    )
  };
};

const deliverRecoveryEmailCode = async ({ email, firstName, code }) => {
  const expiresInMinutes = Math.max(
    5,
    parseInt(process.env.RECOVERY_EMAIL_EXPIRE_MINUTES, 10) || 10
  );
  return deliverEmail({
    type: 'recovery_email_verification',
    recipient: { email, firstName },
    subject: 'Verify your Luna recovery email',
    text: `Hello ${firstName || 'there'},\n\nYour Luna recovery email verification code is ${code}. It expires in ${expiresInMinutes} minutes.`,
    html: `<p>Hello ${escapeHtml(firstName || 'there')},</p><p>Your Luna recovery email verification code is <strong>${escapeHtml(code)}</strong>.</p><p>It expires in ${expiresInMinutes} minutes.</p>`,
    webhookPayload: {
      type: 'recovery_email_verification',
      recipient: { email, firstName },
      code,
      expiresInMinutes
    },
    deliveryUrl: process.env.RECOVERY_EMAIL_DELIVERY_URL || process.env.REGISTRATION_MFA_DELIVERY_URL,
    deliveryToken: process.env.RECOVERY_EMAIL_DELIVERY_TOKEN || process.env.REGISTRATION_MFA_DELIVERY_TOKEN,
    timeoutMs: process.env.RECOVERY_EMAIL_DELIVERY_TIMEOUT_MS || process.env.REGISTRATION_MFA_DELIVERY_TIMEOUT_MS
  });
};

module.exports = {
  createRecoveryEmailChallenge,
  deliverRecoveryEmailCode,
  hashCode,
  maskEmail,
  safeEqual
};
