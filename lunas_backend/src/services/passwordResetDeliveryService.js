const { deliverEmail, escapeHtml } = require('./emailDeliveryService');

const buildResetUrl = (token) => {
  const baseUrl = process.env.PASSWORD_RESET_APP_URL;
  if (!baseUrl) return null;

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
};

/**
 * Password-reset delivery boundary. Resend is selected when configured;
 * otherwise the existing approved webhook contract remains supported.
 */
exports.deliverPasswordReset = async ({ user, resetToken }) => {
  const resetUrl = buildResetUrl(resetToken);

  if (!resetUrl) {
    return { configured: false, delivered: false };
  }

  const firstName = user.firstName || 'there';
  return deliverEmail({
    type: 'password_reset',
    recipient: { email: user.email, firstName },
    subject: 'Reset your Luna password',
    text: `Hello ${firstName},\n\nUse this link to reset your Luna password:\n${resetUrl}\n\nThis link expires soon. If you did not request a reset, you can ignore this email.`,
    html: `<p>Hello ${escapeHtml(firstName)},</p><p>Use the link below to reset your Luna password:</p><p><a href="${escapeHtml(resetUrl)}">Reset your password</a></p><p>This link expires soon. If you did not request a reset, you can ignore this email.</p>`,
    webhookPayload: {
      type: 'password_reset',
      recipient: { email: user.email, firstName },
      resetUrl
    },
    deliveryUrl: process.env.PASSWORD_RESET_DELIVERY_URL,
    deliveryToken: process.env.PASSWORD_RESET_DELIVERY_TOKEN,
    timeoutMs: process.env.PASSWORD_RESET_DELIVERY_TIMEOUT_MS
  });
};
