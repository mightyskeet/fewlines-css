import { defineConfig } from '@playwright/test';

/**
 * Playwright harness for @fewlines/css.
 *
 * Serves apps/docs (which links the built core CSS) and runs:
 * - browser/   native behavior tests (dialog, popover, forms)
 * - visual/    screenshot fixtures for representative states
 * - accessibility/  axe + keyboard/focus tests
 */
export default defineConfig({
  testDir: '.',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: !process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  // CI: baselines were captured on win32; the first linux run generates
  // linux baselines (PW_UPDATE_SNAPSHOTS=1 in ci.yml). Remove the env var
  // from ci.yml once linux baselines are committed.
  updateSnapshots: process.env.PW_UPDATE_SNAPSHOTS ? 'changed' : 'missing',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    // serve apps/docs on /; the built core CSS is copied to apps/docs/core.css
    // by the test:prepare script (dist lives outside the served root).
    command: 'npx -y serve -l 4173 ../apps/docs',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
});
