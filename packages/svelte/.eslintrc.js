module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  ignorePatterns: ['dist', 'node_modules', '.svelte-kit'],
  env: {
    browser: true,
    es2017: true,
    node: true,
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        'prefer-const': 'error',
        'no-var': 'error',
      },
    },
    {
      files: ['*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020,
      },
      rules: {
        'no-unused-vars': 'off',
        'prefer-const': 'error',
        'no-var': 'error',
      },
    },
    {
      files: ['*.svelte'],
      extends: ['plugin:svelte/recommended'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
      },
      rules: {
        'no-unused-vars': 'off',
        'svelte/no-unused-svelte-ignore': 'off',
      },
    },
  ],
};