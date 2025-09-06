module.exports = {
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'react/react-in-jsx-scope': 'off',
  },
  ignorePatterns: ['dist/**', 'node_modules/**'],
};