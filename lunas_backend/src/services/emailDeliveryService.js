const axios = require('axios');
const logger = require('../utils/logger');

const RESEND_API_URL = process.env.RESEND_API_URL || 'https://api.resend.com';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const providerName = () => {
  const configured = String(process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
  if (configured) return configured;
  return process.env.RESEND_API_KEY ? 'resend' : 'webhook';
};

const result = (configured, delivered) => ({ configured, delivered });

/**
 * Transactional email boundary.
 *
 * Resend is the production provider when RESEND_API_KEY and EMAIL_FROM are
 * configured. The existing signed webhook contract remains the local/test
 * fallback so deployments can migrate without changing controller behavior.
 * Email bodies are never logged because they may contain reset tokens or OTPs.
 */
exports.deliverEmail = async ({
  type,
  recipient,
  subject,
  text,
  html,
  webhookPayload,
  deliveryUrl,
  deliveryToken,
  timeoutMs
}) => {
  const provider = providerName();
  const timeout = Number.parseInt(timeoutMs, 10) || 10000;

  if (provider === 'resend') {
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      logger.warn(`Email delivery requested for ${type}, but Resend is not fully configured`);
      return result(false, false);
    }

    try {
      await axios.post(`${RESEND_API_URL}/emails`, {
        from: process.env.EMAIL_FROM,
        to: [recipient.email],
        subject,
        text,
        html
      }, {
        timeout,
        headers: {
          authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'content-type': 'application/json'
        }
      });
      return result(true, true);
    } catch (_error) {
      logger.error(`Email delivery failed for ${type}`);
      return result(true, false);
    }
  }

  if (provider !== 'webhook' || !deliveryUrl) {
    logger.warn(`Email delivery requested for ${type}, but no supported provider is configured`);
    return result(false, false);
  }

  try {
    await axios.post(deliveryUrl, webhookPayload, {
      timeout,
      ...(deliveryToken ? { headers: { authorization: `Bearer ${deliveryToken}` } } : {})
    });
    return result(true, true);
  } catch (_error) {
    logger.error(`Email delivery failed for ${type}`);
    return result(true, false);
  }
};

exports.escapeHtml = escapeHtml;
