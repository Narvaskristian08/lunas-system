const crypto = require('crypto');
const { deliverEmail, escapeHtml } = require('./emailDeliveryService');

const hashActivationToken = token => crypto.createHash('sha256').update(token).digest('hex');
const createActivation = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const minutes = Math.min(1440, Math.max(10, Number(process.env.ACCOUNT_ACTIVATION_EXPIRE_MINUTES) || 60));
  return { token, tokenHash: hashActivationToken(token), expiresAt: new Date(Date.now() + minutes * 60000) };
};

// Tokens travel only to the transactional email provider, never to an admin
// response or application log.
const deliverActivation = async (user, activation) => {
  const deliveryToken = process.env.ACCOUNT_ACTIVATION_DELIVERY_TOKEN || process.env.REGISTRATION_MFA_DELIVERY_TOKEN;
  const appUrl = process.env.ACCOUNT_ACTIVATION_APP_URL;
  if (!appUrl) return { configured: false, delivered: false };
  try {
    const url = new URL(appUrl);
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production'
      && ['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol === 'http:')) {
      return { configured: false, delivered: false };
    }
    // Fragments are not sent in HTTP URLs, access logs, or Referer headers.
    url.search = '';
    url.hash = new URLSearchParams({ token: activation.token }).toString();
    const firstName = user.firstName || 'there';
    return await deliverEmail({
      type: 'account_activation',
      recipient: { email: user.email, firstName },
      subject: 'Activate your Luna account',
      text: `Hello ${firstName},\n\nActivate your Luna account here:\n${url.toString()}\n\nThis link expires on ${activation.expiresAt.toISOString()}.`,
      html: `<p>Hello ${escapeHtml(firstName)},</p><p><a href="${escapeHtml(url.toString())}">Activate your Luna account</a></p><p>This link expires on ${escapeHtml(activation.expiresAt.toISOString())}.</p>`,
      webhookPayload: {
        type: 'account_activation',
        recipient: { email: user.email, firstName },
        activationUrl: url.toString(),
        expiresAt: activation.expiresAt
      },
      deliveryUrl: process.env.ACCOUNT_ACTIVATION_DELIVERY_URL || process.env.REGISTRATION_MFA_DELIVERY_URL,
      deliveryToken,
      timeoutMs: process.env.ACCOUNT_ACTIVATION_DELIVERY_TIMEOUT_MS || 10000
    });
  } catch (_error) {
    return { configured: true, delivered: false };
  }
};

module.exports = { createActivation, hashActivationToken, deliverActivation };
