import { config } from 'dotenv';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    dir: 'tests',
    environment: 'node',
    watch: false,
    testTimeout: 10000,
    include: ['**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'src/**/*.spec.ts'],
    typecheck: {
      enabled: true,
      ignoreSourceErrors: false,
      include: ['**/*.ts'],
    },
    env: {
      // Sandbox environment
      ...config({ path: './.env.testing' }).parsed,
    },
  },
});
