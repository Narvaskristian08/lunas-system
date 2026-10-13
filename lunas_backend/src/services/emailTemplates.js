const { escapeHtml } = require('./emailDeliveryService');

const BRAND = 'LUNAS';
const PRODUCT = 'Account security';

const asText = value => String(value ?? '').trim();

const renderBrandedEmail = ({
  preheader,
  title,
  greeting = 'Hello there,',
  intro,
  code,
  codeLabel = 'Verification code',
  ctaLabel,
  ctaUrl,
  secondaryCtaLabel,
  secondaryCtaUrl,
  expiryText,
  outro = 'If you did not request this email, you can safely ignore it.'
}) => {
  const safePreheader = asText(preheader);
  const safeTitle = asText(title);
  const safeGreeting = asText(greeting);
  const safeIntro = asText(intro);
  const safeCode = asText(code);
  const safeCodeLabel = asText(codeLabel);
  const safeCtaLabel = asText(ctaLabel);
  const safeCtaUrl = asText(ctaUrl);
  const safeSecondaryCtaLabel = asText(secondaryCtaLabel);
  const safeSecondaryCtaUrl = asText(secondaryCtaUrl);
  const safeExpiryText = asText(expiryText);
  const safeOutro = asText(outro);

  const codeBlock = safeCode
    ? `
      <tr>
        <td style="padding:8px 0 24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="background:#f4f7fb;border:1px solid #dce5f0;border-radius:12px;padding:18px 16px;text-align:center;">
                <div style="color:#5b6b82;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">${escapeHtml(safeCodeLabel)}</div>
                <div style="color:#0b1f3a;font-size:32px;font-weight:800;letter-spacing:8px;line-height:1.2;padding:8px 0 0;">${escapeHtml(safeCode)}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : '';

  const ctaBlock = safeCtaLabel && safeCtaUrl
    ? `
      <tr>
        <td style="padding:4px 0 24px;text-align:center;">
          <a href="${escapeHtml(safeCtaUrl)}" style="background:#0b1f3a;border-radius:8px;color:#ffffff;display:inline-block;font-size:15px;font-weight:700;line-height:48px;padding:0 26px;text-decoration:none;">${escapeHtml(safeCtaLabel)}</a>
        </td>
      </tr>`
    : '';

  const secondaryCtaBlock = safeSecondaryCtaLabel && safeSecondaryCtaUrl
    ? `
      <tr>
        <td style="padding:0 0 24px;text-align:center;">
          <a href="${escapeHtml(safeSecondaryCtaUrl)}" style="color:#0b5cab;font-size:13px;font-weight:700;text-decoration:underline;">${escapeHtml(safeSecondaryCtaLabel)}</a>
        </td>
      </tr>`
    : '';

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${escapeHtml(safeTitle)}</title>
  </head>
  <body style="background:#f3f6fb;margin:0;padding:0;width:100%;font-family:Arial,Helvetica,sans-serif;color:#24344d;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(safePreheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f6fb;width:100%;">
      <tr>
        <td align="center" style="padding:32px 12px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #e1e8f0;border-radius:16px;max-width:600px;overflow:hidden;width:100%;">
            <tr>
              <td style="background:#0b1f3a;padding:26px 32px;">
                <div style="color:#ffffff;font-size:24px;font-weight:800;letter-spacing:2px;line-height:1;">${BRAND}</div>
                <div style="color:#b9c8dc;font-size:11px;letter-spacing:.5px;padding-top:8px;">${PRODUCT}</div>
              </td>
            </tr>
            <tr>
              <td style="border-top:4px solid #e4b74a;padding:34px 36px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td>
                      <div style="color:#60718a;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">LUNAS account message</div>
                      <h1 style="color:#0b1f3a;font-size:28px;line-height:1.25;margin:10px 0 22px;">${escapeHtml(safeTitle)}</h1>
                      <p style="font-size:16px;line-height:1.65;margin:0 0 14px;">${escapeHtml(safeGreeting)}</p>
                      <p style="font-size:16px;line-height:1.65;margin:0 0 20px;">${escapeHtml(safeIntro)}</p>
                    </td>
                  </tr>
                  ${codeBlock}
                  ${ctaBlock}
                  ${secondaryCtaBlock}
                  ${safeExpiryText ? `<tr><td><p style="color:#5b6b82;font-size:14px;line-height:1.6;margin:0 0 14px;">${escapeHtml(safeExpiryText)}</p></td></tr>` : ''}
                  ${safeOutro ? `<tr><td><p style="color:#5b6b82;font-size:14px;line-height:1.6;margin:0 0 12px;">${escapeHtml(safeOutro)}</p></td></tr>` : ''}
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;border-top:1px solid #e7edf4;padding:20px 36px;">
                <p style="color:#718096;font-size:12px;line-height:1.6;margin:0;">This is an automated message from ${BRAND}. Please do not reply to this email.</p>
                <p style="color:#9aa8b8;font-size:12px;line-height:1.6;margin:8px 0 0;">LUNAS account security</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textParts = [
    BRAND,
    PRODUCT,
    '',
    safeTitle,
    '',
    safeGreeting,
    safeIntro,
    safeCode ? `${safeCodeLabel}: ${safeCode}` : '',
    safeCtaLabel && safeCtaUrl ? `${safeCtaLabel}: ${safeCtaUrl}` : '',
    safeSecondaryCtaLabel && safeSecondaryCtaUrl ? `${safeSecondaryCtaLabel}: ${safeSecondaryCtaUrl}` : '',
    safeExpiryText,
    safeOutro,
    '',
    `This is an automated message from ${BRAND}. Please do not reply to this email.`
  ].filter(Boolean);

  return { html, text: textParts.join('\n\n') };
};

module.exports = { BRAND, PRODUCT, renderBrandedEmail };
