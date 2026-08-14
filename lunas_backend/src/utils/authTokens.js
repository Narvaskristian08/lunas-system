const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const getAccessSecret = () => process.env.JWT_SECRET;
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
const getAccessExpiry = () => process.env.JWT_EXPIRE || '15m';
const getRefreshExpiry = () => process.env.JWT_REFRESH_EXPIRE || '30d';

const ensureSecret = (secret, name) => {
  if (!secret) {
    throw new Error(`${name} must be configured`);
  }
  return secret;
};

const userId = (user) => (user._id || user.id).toString();
const tokenVersion = (user) => Number.isInteger(user.tokenVersion) ? user.tokenVersion : 0;

const buildPayload = (user, tokenType) => ({
  id: userId(user),
  tokenType,
  tokenVersion: tokenVersion(user)
});

exports.hashToken = (token) => crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');

exports.createAccessToken = (user) => jwt.sign(
  buildPayload(user, 'access'),
  ensureSecret(getAccessSecret(), 'JWT_SECRET'),
  { expiresIn: getAccessExpiry() }
);

exports.createRefreshToken = (user) => jwt.sign(
  buildPayload(user, 'refresh'),
  ensureSecret(getRefreshSecret(), 'JWT_REFRESH_SECRET'),
  { expiresIn: getRefreshExpiry(), jwtid: crypto.randomUUID() }
);

exports.issueTokenPair = (user) => {
  const accessToken = exports.createAccessToken(user);
  const refreshToken = exports.createRefreshToken(user);
  const decodedRefreshToken = jwt.decode(refreshToken);

  return {
    accessToken,
    refreshToken,
    refreshTokenHash: exports.hashToken(refreshToken),
    refreshTokenExpiresAt: new Date(decodedRefreshToken.exp * 1000)
  };
};

exports.verifyAccessToken = (token) => jwt.verify(
  token,
  ensureSecret(getAccessSecret(), 'JWT_SECRET')
);

exports.verifyRefreshToken = (token) => jwt.verify(
  token,
  ensureSecret(getRefreshSecret(), 'JWT_REFRESH_SECRET')
);

exports.isCurrentTokenVersion = (decoded, user) => (
  Number.isInteger(decoded.tokenVersion) && decoded.tokenVersion === tokenVersion(user)
);
