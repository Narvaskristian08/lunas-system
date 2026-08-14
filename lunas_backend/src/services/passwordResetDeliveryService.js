const axios = require('axios');
const logger = require('../utils/logger');

const buildResetUrl = (token) => {
  const baseUrl = process.env.PASSWORD_RESET_APP_URL;
  if (!baseUrl) return null;

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}token=${encodeURIComponent(token)}`;
};

/**
 * Optional password-reset delivery boundary.
 *
 * A deployment can point PASSWORD_RESET_DELIVERY_URL at its approved email
 * provider integration. Without both settings this function deliberately
 * does not pretend that mail was sent.
 */
exports.deliverPasswordReset = async ({ user, resetToken }) => {
  const deliveryUrl = process.env.PASSWORD_RESET_DELIVERY_URL;
  const resetUrl = buildResetUrl(resetToken);

  if (!deliveryUrl || !resetUrl) {
    logger.warn('Password reset requested but no delivery provider is configured');
    return { configured: false, delivered: false };
  }

  try {
    await axios.post(deliveryUrl, {
      type: 'password_reset',
      recipient: { email: user.email, firstName: user.firstName },
      resetUrl
    }, {
      timeout: parseInt(process.env.PASSWORD_RESET_DELIVERY_TIMEOUT_MS, 10) || 10000
    });
    return { configured: true, delivered: true };
  } catch (error) {
    // Never include the reset URL or token in logs.
    logger.error(`Password reset delivery failed: ${error.message}`);
    return { configured: true, delivered: false };
  }
};
