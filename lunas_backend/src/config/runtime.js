const PLACEHOLDER_SECRET = /(replace|change[_-]?this|your[_-]|example|minimum[_-]?32)/i;

const requireValue = (environment, name) => {
  const value = String(environment[name] || '').trim();
  if (!value) throw new Error(`${name} must be configured in production`);
  return value;
};

const requireSecret = (environment, name) => {
  const value = requireValue(environment, name);
  if (value.length < 32 || PLACEHOLDER_SECRET.test(value)) {
    throw new Error(`${name} must be a non-placeholder secret of at least 32 characters`);
  }
  return value;
};

const validateRuntimeConfig = (environment = process.env) => {
  if (environment.NODE_ENV !== 'production') return;

  const mongoUri = requireValue(environment, 'MONGODB_URI');
  if (!/^mongodb(?:\+srv)?:\/\//i.test(mongoUri)) {
    throw new Error('MONGODB_URI must be a valid MongoDB connection URI');
  }

  const accessSecret = requireSecret(environment, 'JWT_SECRET');
  const refreshSecret = requireSecret(environment, 'JWT_REFRESH_SECRET');
  if (accessSecret === refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET must be distinct from JWT_SECRET');
  }

  requireValue(environment, 'TURNSTILE_SECRET_KEY');
  requireValue(environment, 'TURNSTILE_ALLOWED_HOSTNAMES');
};

module.exports = { validateRuntimeConfig };
