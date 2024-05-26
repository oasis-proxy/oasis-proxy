/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  env: {
    es6: true,
    browser: true,
    webextensions: true
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  globals: {
    bootstrap: 'readonly' // 添加这一行
  },
  rules: {
    semi: ['off', 'never']
  },
  ignorePatterns: ['public/']
}
