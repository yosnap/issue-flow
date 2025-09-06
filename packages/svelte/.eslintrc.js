module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  ignorePatterns: ['dist', 'node_modules', '.svelte-kit'],
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