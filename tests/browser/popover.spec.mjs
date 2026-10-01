import { expect, test } from '@playwright/test';

/**
 * Native popover behavior tests (PROJECT_SPEC.md, 15.2).
 * Covers: declarative trigger, open state, light dismiss, Escape.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('popover opens via declarative popovertarget', async ({ page }) => {
  const popover = page.locator('#testPopover');
  await expect(popover).not.toBeVisible();

  await page.click('#popover-trigger');
  await expect(popover).toBeVisible();

  // Popover elements expose state via :popover-open (the open attribute is
  // internal; unlike <dialog> there is no .open IDL property on HTMLElement).
  const isOpen = await popover.evaluate((el) => el.matches(':popover-open'));
  expect(isOpen).toBe(true);
});

test('popover closes on second trigger click (toggle)', async ({ page }) => {
  await page.click('#popover-trigger');
  await expect(page.locator('#testPopover')).toBeVisible();

  await page.click('#popover-trigger');
  await expect(page.locator('#testPopover')).not.toBeVisible();
});

test('popover light dismiss: outside click closes it', async ({ page }) => {
  await page.click('#popover-trigger');
  await expect(page.locator('#testPopover')).toBeVisible();

  // Click outside the popover (page background, away from trigger)
  await page.mouse.click(10, 300);
  await expect(page.locator('#testPopover')).not.toBeVisible();
});

test('popover closes on Escape natively', async ({ page }) => {
  await page.click('#popover-trigger');
  await expect(page.locator('#testPopover')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('#testPopover')).not.toBeVisible();
});

test('popover is in top layer when open', async ({ page }) => {
  await page.click('#popover-trigger');

  const inTopLayer = await page.evaluate(() => {
    const popover = document.querySelector('#testPopover');
    // Top-layer elements are rendered above everything; check via
    // the native ::popover-open state plus visibility
    return popover.matches(':popover-open') && getComputedStyle(popover).display !== 'none';
  });
  expect(inTopLayer).toBe(true);
});
