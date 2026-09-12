import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/**/*.test.ts', 'tests/**/*.ssr.test.tsx'],
        },
      },
      {
        test: {
          name: 'browser',
          include: ['tests/**/*.browser.test.tsx'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            viewport: { width: 1280, height: 900 },
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
