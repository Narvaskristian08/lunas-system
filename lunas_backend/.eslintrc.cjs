module.exports = {
  env: {
    node: true,
    jest: true,
    es2022: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script'
  },
  extends: ['eslint:recommended'],
  rules: {
    // The repository predates this configuration and uses concise controller
    // signatures, so style is intentionally left to the existing formatter.
    // Recommended correctness checks remain enabled.
    'no-console': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  }
};
