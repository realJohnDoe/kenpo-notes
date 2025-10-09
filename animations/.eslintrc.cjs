/** @type {import('eslint').Linter.Config} */
const config = {
  export: true,
  root: true,
  env: {
    browser: true,
    es2017: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    eCmaVersion: 2017,
    sourceType: 'module',
    extraFileExtensions: ['.svelte'],
    parser: '@typescript-eslint/parser'
  },
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['*.cjs'],
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  ]
};

export default config;
