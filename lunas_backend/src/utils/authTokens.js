const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { requiresPrivilegedMfa } = require('../services/privilegedMfaService');

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

const authProof = (authContext = {}) => {
  if (!authContext.mfaVerified) return {};
  const authenticatedAt = Number(authContext.mfaAuthenticatedAt);
  return {
    amr: ['pwd', 'email_otp'],
    mfaAuthenticatedAt: Number.isFinite(authenticatedAt)
      ? Math.floor(authenticatedAt)
      : Math.floor(Date.now() / 1000)
  };
};

const buildPayload = (user, tokenType, authContext) => ({
  id: userId(user),
  tokenType,
  tokenVersion: tokenVersion(user),
  ...authProof(authContext)
});

exports.hasPrivilegedMfaProof = (decoded) => (
  Array.isArray(decoded?.amr)
  && decoded.amr.includes('pwd')
  && decoded.amr.includes('email_otp')
  && Number.isFinite(Number(decoded.mfaAuthenticatedAt))
);

const assertTokenIssuanceAllowed = (user, authContext = {}) => {
  if (requiresPrivilegedMfa(user.role) && !authContext.mfaVerified) {
    throw new Error('Privileged token issuance requires verified MFA');
  }
};

exports.hashToken = (token) => crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');

exports.createAccessToken = (user, authContext = {}) => {
  assertTokenIssuanceAllowed(user, authContext);
  return jwt.sign(
    buildPayload(user, 'access', authContext),
    ensureSecret(getAccessSecret(), 'JWT_SECRET'),
    { expiresIn: getAccessExpiry() }
  );
};

exports.createRefreshToken = (user, authContext = {}) => {
  assertTokenIssuanceAllowed(user, authContext);
  return jwt.sign(
    buildPayload(user, 'refresh', authContext),
    ensureSecret(getRefreshSecret(), 'JWT_REFRESH_SECRET'),
    { expiresIn: getRefreshExpiry(), jwtid: crypto.randomUUID() }
  );
};

exports.issueTokenPair = (user, authContext = {}) => {
  const accessToken = exports.createAccessToken(user, authContext);
  const refreshToken = exports.createRefreshToken(user, authContext);
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
