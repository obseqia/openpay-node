// @ts-check

import eslint from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // The SDK uses the IOpenpay namespace pattern intentionally (documented in AGENTS.md)
      '@typescript-eslint/no-namespace': 'off',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
);
