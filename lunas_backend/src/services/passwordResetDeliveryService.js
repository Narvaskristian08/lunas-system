const { deliverEmail } = require('./emailDeliveryService');
const { renderBrandedEmail } = require('./emailTemplates');

/**
 * Password-reset delivery boundary. Resend is selected when configured;
 * otherwise the existing approved webhook contract remains supported.
 */
exports.deliverPasswordReset = async ({ user, code }) => {
  const recipientEmail = user.recoveryEmail && user.recoveryEmailVerifiedAt
    ? user.recoveryEmail
    : user.role === 'citizen' && user.isVerified
      ? user.email
      : null;

  if (!recipientEmail) {
    return { configured: false, delivered: false };
  }
  if (!/^\d{6}$/.test(code || '')) {
    return { configured: false, delivered: false };
  }

  const firstName = user.firstName || 'there';
  const message = renderBrandedEmail({
    preheader: 'Enter this verification code in LUNAS to reset your password.',
    title: 'Your password reset code',
    greeting: `Hello ${firstName},`,
    intro: 'Return to the LUNAS app or website and enter this code to choose a new password. Never share this code.',
    code,
    expiryText: 'This code expires in 10 minutes and can only be used once.',
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
      code,
      expiresInMinutes: 10
    },
    deliveryUrl: process.env.PASSWORD_RESET_DELIVERY_URL,
    deliveryToken: process.env.PASSWORD_RESET_DELIVERY_TOKEN,
    timeoutMs: process.env.PASSWORD_RESET_DELIVERY_TIMEOUT_MS
  });
};
