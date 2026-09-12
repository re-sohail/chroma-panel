import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        // Colour maths, store, quantizer, and server rendering. The SSR tests
        // deliberately run with NO DOM so a stray `window` access fails here.
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/**/*.test.ts', 'tests/**/*.ssr.test.tsx'],
        },
      },
      {
        // Anything involving a pointer drag.
        //
        // jsdom cannot host these: getBoundingClientRect() returns zeros
        // (jsdom#653, open since 2016) and PointerEvent does not exist, so
        // every position calculation would divide by zero. Mocking the rect
        // only asserts that the mock agrees with itself — it cannot catch a
        // CSS, transform or scroll-offset regression, which is most of the
        // surface area of a colour picker.
        test: {
          name: 'browser',
          include: ['tests/**/*.browser.test.tsx'],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            // Explicit desktop viewport: the picker switches to a bottom
            // sheet below 640px, and the default browser-mode viewport is
            // narrower than that. Tests that want the sheet resize themselves.
            viewport: { width: 1280, height: 900 },
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
