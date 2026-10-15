import { expect, test } from '@playwright/test';

/**
 * Button state tests (PROJECT_SPEC.md, 15.2).
 * Computed-style checks: hover must not restyle disabled controls.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('hover does not restyle a disabled button', async ({ page }) => {
  const background = (id) =>
    page.locator(id).evaluate((el) => getComputedStyle(el).backgroundColor);

  // Control: hovering the enabled secondary button changes its background
  const idle = await background('#btn-secondary');
  await page.hover('#btn-secondary');
  expect(await background('#btn-secondary')).not.toBe(idle);

  // The disabled button keeps its base surface under the pointer
  const disabledIdle = await background('#btn-disabled');
  await page.hover('#btn-disabled', { force: true });
  expect(await background('#btn-disabled')).toBe(disabledIdle);
});
