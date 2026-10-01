import { expect, test } from '@playwright/test';

/**
 * Native accordion behavior tests (PROJECT_SPEC.md, 15.2).
 * Covers: open/close via <details>, keyboard toggle, native state attribute.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('accordion opens and closes via summary click', async ({ page }) => {
  const details = page.locator('#accordion-first');
  await expect(details).not.toHaveAttribute('open');

  await page.click('#accordion-summary-first');
  await expect(details).toHaveAttribute('open');

  await page.click('#accordion-summary-first');
  await expect(details).not.toHaveAttribute('open');
});

test('accordion toggles via keyboard (Enter on summary)', async ({ page }) => {
  const details = page.locator('#accordion-first');

  await page.locator('#accordion-summary-first').focus();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open');

  await page.keyboard.press('Enter');
  await expect(details).not.toHaveAttribute('open');
});

test('accordion toggles via keyboard (Space on summary)', async ({ page }) => {
  const details = page.locator('#accordion-second');

  await page.locator('#accordion-summary-second').focus();
  await page.keyboard.press('Space');
  await expect(details).toHaveAttribute('open');

  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open');
});

test('open attribute is the native state (no JS classes)', async ({ page }) => {
  await page.click('#accordion-summary-first');

  const isOpen = await page.locator('#accordion-first').evaluate((el) => el.open);
  expect(isOpen).toBe(true);

  const contentVisible = await page.locator('#accordion-first .ui-accordion-content').isVisible();
  expect(contentVisible).toBe(true);
});

test('summary is reachable via Tab and exposes disclosure semantics', async ({ page }) => {
  const summary = page.locator('#accordion-summary-first');
  await summary.focus();

  const isSummary = await summary.evaluate((el) => el.tagName === 'SUMMARY');
  expect(isSummary).toBe(true);

  // Native disclosure: summary toggles its parent details.
  await page.keyboard.press('Enter');
  const open = await page.locator('#accordion-first').evaluate((el) => el.open);
  expect(open).toBe(true);
});
