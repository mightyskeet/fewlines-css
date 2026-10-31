/**
 * Playwright `test` with the shared fixture page routed in.
 *
 * The browser specs navigate to /fixture.html on the served site root
 * (apps/docs). The fixture is test scaffolding and must not live in the
 * published site folder, so the request is intercepted and fulfilled
 * straight from tests/fixtures/fixture.html.
 */
import { fileURLToPath } from 'node:url';
import { test as base } from '@playwright/test';

const fixture = fileURLToPath(new URL('./fixture.html', import.meta.url));

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route('**/fixture.html', (route) =>
      route.fulfill({ path: fixture, contentType: 'text/html' }),
    );
    await use(page);
  },
});

export { expect } from '@playwright/test';
