module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    node: true,
    es2022: true,
    browser: true
  },
  rules: {
    // Minimal rules to prevent errors
  },
  ignorePatterns: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '*.min.js',
    '**/*.ts',
    '**/*.tsx'
  ]
};