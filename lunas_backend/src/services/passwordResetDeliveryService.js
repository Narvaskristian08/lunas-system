const { deliverEmail } = require('./emailDeliveryService');
const { renderBrandedEmail } = require('./emailTemplates');

const buildResetUrl = (baseUrl, token, extraParams = {}) => {
  if (!baseUrl) return null;
  const url = new URL(baseUrl);
  url.searchParams.set('token', token);
  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

/**
 * Password-reset delivery boundary. Resend is selected when configured;
 * otherwise the existing approved webhook contract remains supported.
 */
exports.deliverPasswordReset = async ({ user, resetToken }) => {
  const recipientEmail = user.recoveryEmail && user.recoveryEmailVerifiedAt
    ? user.recoveryEmail
    : user.role === 'citizen' && user.isVerified
      ? user.email
      : null;

  if (!recipientEmail) {
    return { configured: false, delivered: false };
  }
  const mobileResetUrl = buildResetUrl(process.env.PASSWORD_RESET_MOBILE_URL, resetToken);
  const webResetUrl = buildResetUrl(
    process.env.PASSWORD_RESET_APP_URL,
    resetToken,
    mobileResetUrl ? { openApp: '1' } : {}
  );
  const resetUrl = webResetUrl || mobileResetUrl;

  if (!resetUrl) {
    return { configured: false, delivered: false };
  }

  const firstName = user.firstName || 'there';
  const message = renderBrandedEmail({
    preheader: 'Use this secure link to reset your LUNAS password.',
    title: 'Reset your password',
    greeting: `Hello ${firstName},`,
    intro: 'We received a request to reset your LUNAS password.',
    ctaLabel: webResetUrl ? 'Reset password' : 'Open in LUNAS Mobile',
    ctaUrl: resetUrl,
    secondaryCtaLabel: mobileResetUrl && webResetUrl ? 'Open in LUNAS Mobile' : undefined,
    // Gmail and some mail clients block custom URI schemes such as lunas://.
    // Keep every visible email action HTTPS; the reset page performs the app handoff.
    secondaryCtaUrl: mobileResetUrl && webResetUrl ? webResetUrl : undefined,
    expiryText: 'This link expires soon. For your security, it can only be used once.',
    outro: 'If you did not request a password reset, you can safely ignore this email.'
  });
  return deliverEmail({
    type: 'password_reset',
    recipient: { email: recipientEmail, firstName },
    subject: 'Reset your LUNAS password',
    ...message,
    webhookPayload: {
      type: 'password_reset',
      recipient: { email: recipientEmail, firstName },
      resetUrl
    },
    deliveryUrl: process.env.PASSWORD_RESET_DELIVERY_URL,
    deliveryToken: process.env.PASSWORD_RESET_DELIVERY_TOKEN,
    timeoutMs: process.env.PASSWORD_RESET_DELIVERY_TIMEOUT_MS
  });
};
