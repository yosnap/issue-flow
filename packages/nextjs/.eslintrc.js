module.exports = {
  root: true,
  extends: ['eslint:recommended', 'next/core-web-vitals'],
  env: {
    browser: true,
    es2017: true,
    node: true,
  },
  rules: {
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': 'off',
  },
};