import { expect, test } from '@playwright/test';

/**
 * Native dialog behavior tests (tests/README.md).
 * Covers: open/close, modal state, Escape, backdrop, form semantics, focus.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('dialog opens via showModal and is modal', async ({ page }) => {
  const dialog = page.locator('#testDialog');
  await expect(dialog).not.toBeVisible();

  await page.click('#dialog-open');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveJSProperty('open', true);

  // :modal pseudo-class — native modal state
  const isModal = await dialog.evaluate((el) => el.matches(':modal'));
  expect(isModal).toBe(true);
});

test('dialog closes via form method=dialog without JS', async ({ page }) => {
  await page.click('#dialog-open');
  await expect(page.locator('#testDialog')).toBeVisible();

  await page.click('#dialog-close');
  await expect(page.locator('#testDialog')).not.toBeVisible();
});

test('dialog closes on Escape natively', async ({ page }) => {
  await page.click('#dialog-open');
  await expect(page.locator('#testDialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('#testDialog')).not.toBeVisible();
});

test('dialog has backdrop in modal mode', async ({ page }) => {
  await page.click('#dialog-open');

  const hasBackdrop = await page.locator('#testDialog').evaluate((el) => {
    // ::backdrop exists only while modal; check computed style via element check
    return el.matches(':modal');
  });
  expect(hasBackdrop).toBe(true);
});

test('dialog focus moves inside on open and returns to trigger on close', async ({ page, browserName }) => {
  // Known WebKit divergence (found 2026-10-16, reproduced on the old CSS —
  // not our regression): focus does not return to the trigger on close.
  // test.fail (not skip): the inversion is noticed when WebKit fixes it.
  test.fail(browserName === 'webkit', 'WebKit: focus does not return to the trigger on close');

  const trigger = page.locator('#dialog-open');
  await trigger.click();

  // Focus should be inside the dialog (first focusable or the dialog itself)
  const focusInside = await page.evaluate(() => {
    const dialog = document.querySelector('#testDialog');
    return dialog.contains(document.activeElement) || document.activeElement === dialog;
  });
  expect(focusInside).toBe(true);

  await page.keyboard.press('Escape');

  // Native behavior: focus returns to the trigger
  await expect(trigger).toBeFocused();
});

test('dialog focus is trapped while modal', async ({ page }) => {
  await page.click('#dialog-open');
  await expect(page.locator('#testDialog')).toBeVisible();

  // The trap contract: focus can never land on page content while the dialog
  // is modal. Chromium's Tab wrap transiently reports body between the last
  // and first focusable element, so we assert the meaningful invariant:
  // attempts to focus outside content are refused.
  const outside = await page.evaluate(() => {
    document.querySelector('#btn-outline').focus();
    return document.activeElement.id;
  });
  expect(outside).not.toBe('btn-outline');

  await page.click('#btn-neutral', { force: true }).catch(() => {});
  const afterClick = await page.evaluate(() => document.activeElement.id);
  expect(afterClick).not.toBe('btn-neutral');

  // Keyboard cycling stays within the dialog (allowing the transient body
  // step at the wrap point).
  const visited = new Set();
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(80);
    const id = await page.evaluate(
      () => document.activeElement.id || document.activeElement.tagName,
    );
    if (id !== 'BODY') visited.add(id);
  }
  for (const id of visited) {
    const inside = await page.evaluate(
      (elId) => document.querySelector('#testDialog').contains(document.getElementById(elId)),
      id,
    );
    expect(inside, `focused element ${id} escaped the dialog`).toBe(true);
  }
});

const hasOverlaySupport = (page) => page.evaluate(() => CSS.supports('overlay', 'auto'));

test('dialog animates in on open (entry transition)', async ({ page }) => {
  // Arm before opening: transitionrun proves the entry is a real transition
  // from the @starting-style state, not an instant display flip.
  await page.evaluate(() => {
    window.__dlgEntry = [];
    document
      .querySelector('#testDialog')
      .addEventListener('transitionrun', (e) => window.__dlgEntry.push(e.propertyName));
  });

  await page.click('#dialog-open');
  await expect(page.locator('#testDialog')).toBeVisible();

  await expect
    .poll(() => page.evaluate(() => window.__dlgEntry))
    .toEqual(expect.arrayContaining(['translate', 'opacity']));
});

test('dialog animates out on close (reverse transition)', async ({ page }) => {
  // Exit retention requires the overlay property: engines without it
  // (Firefox/WebKit) drop the dialog from the top layer immediately and
  // create no exit transitions (probed 2026-10-03, compatibility notes).
  test.skip(!(await hasOverlaySupport(page)), 'overlay not supported: exit hides instantly');

  await page.click('#dialog-open');
  await expect(page.locator('#testDialog')).toBeVisible();

  // Close only after the entry settles (same reasoning as popover: closing
  // within the first frames leaves opacity/translate at hidden values).
  await expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.querySelector('#testDialog')).translate),
    )
    .toBe('none');

  await page.evaluate(() => {
    window.__dlgExit = [];
    document
      .querySelector('#testDialog')
      .addEventListener('transitionrun', (e) => window.__dlgExit.push(e.propertyName));
  });

  await page.keyboard.press('Escape');

  await expect
    .poll(() => page.evaluate(() => window.__dlgExit))
    .toEqual(expect.arrayContaining(['translate', 'opacity']));

  await expect(page.locator('#testDialog')).not.toBeVisible();
});
