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

const hasOverlaySupport = (page) => page.evaluate(() => CSS.supports('overlay', 'auto'));

test('popover animates in on open (entry transition)', async ({ page }) => {
  // Arm before opening: transitionrun proves the entry is a real transition
  // from the @starting-style state, not an instant display flip.
  await page.evaluate(() => {
    window.__popEntry = [];
    document
      .querySelector('#testPopover')
      .addEventListener('transitionrun', (e) => window.__popEntry.push(e.propertyName));
  });

  await page.click('#popover-trigger');
  await expect(page.locator('#testPopover')).toBeVisible();

  await expect
    .poll(() => page.evaluate(() => window.__popEntry))
    .toEqual(expect.arrayContaining(['translate', 'opacity']));
});

test('popover animates out on close (reverse transition)', async ({ page }) => {
  // Exit retention requires the overlay property: engines without it
  // (Firefox/WebKit) drop the popover from the top layer immediately and
  // create no exit transitions (probed 2026-10-03, compatibility notes).
  test.skip(!(await hasOverlaySupport(page)), 'overlay not supported: exit hides instantly');

  await page.click('#popover-trigger');
  await expect(page.locator('#testPopover')).toBeVisible();

  // Close only after the entry settles: closing within the first frames
  // leaves opacity/translate at their hidden values, so no reverse
  // transition runs for them (display/overlay still flip).
  await expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.querySelector('#testPopover')).translate),
    )
    .toBe('none');

  await page.evaluate(() => {
    window.__popExit = [];
    document
      .querySelector('#testPopover')
      .addEventListener('transitionrun', (e) => window.__popExit.push(e.propertyName));
  });

  await page.keyboard.press('Escape');

  await expect
    .poll(() => page.evaluate(() => window.__popExit))
    .toEqual(expect.arrayContaining(['translate', 'opacity']));

  await expect(page.locator('#testPopover')).not.toBeVisible();
});
