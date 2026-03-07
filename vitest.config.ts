import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@obseqia/openpay-node': './dist/openpay',
    },
  },
  test: {
    watch: false,
    testTimeout: 10000,
    include: ['./tests/**/*.spec.ts'],
    env: {
      // Sandbox environment
      ...config({ path: './.env.testing' }).parsed,
    },
  },
});
