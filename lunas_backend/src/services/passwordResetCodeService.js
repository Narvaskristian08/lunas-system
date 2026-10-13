const crypto = require('crypto');

exports.hashResetCode = (email, code) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET must be configured');
  return crypto.createHmac('sha256', secret)
    .update(`password-reset:${email.trim().toLowerCase()}:${code}`)
    .digest('hex');
};

exports.createResetCode = email => {
  const code = crypto.randomInt(100000, 1000000).toString();
  return {
    code,
    hash: exports.hashResetCode(email, code),
    expires: new Date(Date.now() + 10 * 60 * 1000)
  };
};
