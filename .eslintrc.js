module.exports = {
  root: true,
  extends: [
    '@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  env: {
    node: true,
    es2022: true
  },
  rules: {
    // TypeScript specific
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    
    // General
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    
    // Import/Export
    'no-duplicate-imports': 'error',
    'sort-imports': ['error', { 
      'ignoreCase': true, 
      'ignoreDeclarationSort': true 
    }]
  },
  overrides: [
    {
      // React specific rules
      files: ['packages/react/**/*', 'packages/dashboard/**/*', 'packages/nextjs/**/*'],
      extends: [
        'plugin:react/recommended',
        'plugin:react-hooks/recommended'
      ],
      plugins: ['react', 'react-hooks'],
      settings: {
        react: {
          version: 'detect'
        }
      },
      env: {
        browser: true
      }
    },
    {
      // Vue specific rules  
      files: ['packages/vue/**/*'],
      extends: [
        'plugin:vue/vue3-recommended',
        '@vue/typescript/recommended'
      ],
      env: {
        browser: true
      }
    },
    {
      // Test files
      files: ['**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true
      }
    },
    {
      // CLI specific
      files: ['packages/cli/**/*'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};