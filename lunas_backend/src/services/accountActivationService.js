const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

const hashActivationToken = token => crypto.createHash('sha256').update(token).digest('hex');
const createActivation = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const minutes = Math.min(1440, Math.max(10, Number(process.env.ACCOUNT_ACTIVATION_EXPIRE_MINUTES) || 60));
  return { token, tokenHash: hashActivationToken(token), expiresAt: new Date(Date.now() + minutes * 60000) };
};

// Same approved email-webhook boundary as citizen OTP/reset delivery. Tokens
// travel only to the email provider, never to an admin response or application log.
const deliverActivation = async (user, activation) => {
  const deliveryUrl = process.env.ACCOUNT_ACTIVATION_DELIVERY_URL || process.env.REGISTRATION_MFA_DELIVERY_URL;
  const deliveryToken = process.env.ACCOUNT_ACTIVATION_DELIVERY_TOKEN || process.env.REGISTRATION_MFA_DELIVERY_TOKEN;
  const appUrl = process.env.ACCOUNT_ACTIVATION_APP_URL;
  if (!deliveryUrl || !appUrl) return { configured: false, delivered: false };
  try {
    const url = new URL(appUrl);
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production'
      && ['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol === 'http:')) {
      return { configured: false, delivered: false };
    }
    // Fragments are not sent in HTTP URLs, access logs, or Referer headers.
    url.search = '';
    url.hash = new URLSearchParams({ token: activation.token }).toString();
    await axios.post(deliveryUrl, {
      type: 'account_activation',
      recipient: { email: user.email, firstName: user.firstName },
      activationUrl: url.toString(),
      expiresAt: activation.expiresAt
    }, {
      timeout: 10000,
      ...(deliveryToken ? { headers: { authorization: `Bearer ${deliveryToken}` } } : {})
    });
    return { configured: true, delivered: true };
  } catch (_error) {
    logger.warn('Account activation email delivery failed');
    return { configured: true, delivered: false };
  }
};

module.exports = { createActivation, hashActivationToken, deliverActivation };
