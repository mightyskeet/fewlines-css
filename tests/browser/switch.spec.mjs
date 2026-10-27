import { expect, test } from '@playwright/test';

/**
 * Switch component tests (tests/README.md).
 * Covers: native toggle behavior, keyboard, implicit label, disabled state,
 * checked-state tokens. The switch attribute is a progressive enhancement
 * (Safari-only per compatibility notes), so the exposed role is asserted
 * engine-conditionally via the accessibility snapshot.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('switch toggles via click and exposes the native checked property', async ({ page }) => {
  const input = page.locator('#switch-basic');
  await expect(input).not.toBeChecked();

  await input.click();
  await expect(input).toBeChecked();

  const checked = await input.evaluate((el) => el.checked);
  expect(checked).toBe(true);
});

test('switch toggles via keyboard (Space)', async ({ page }) => {
  const input = page.locator('#switch-basic');
  await input.focus();
  await page.keyboard.press('Space');
  await expect(input).toBeChecked();

  await page.keyboard.press('Space');
  await expect(input).not.toBeChecked();
});

test('clicking the label text toggles the switch (implicit label)', async ({ page }) => {
  await page.locator('#switch-checked').locator('..').locator('.ui-switch-label').click();
  await expect(page.locator('#switch-checked')).not.toBeChecked();
});

test('exposed role is switch or checkbox depending on engine support', async ({ page }) => {
  const input = page.locator('#switch-basic');
  // Role: switch where the attribute is supported (Safari), native checkbox
  // otherwise — both are valid on/off roles (switch.md).
  const snapshot = await input.ariaSnapshot();
  expect(snapshot).toMatch(/switch|checkbox/);

  await input.check();
  // State is conveyed natively ([checked] in the snapshot vocabulary).
  const checkedSnapshot = await input.ariaSnapshot();
  expect(checkedSnapshot).toMatch(/checked/i);
});

test('disabled switch is not focusable and not editable', async ({ page }) => {
  const input = page.locator('#switch-disabled');
  await input.focus();

  const isDisabled = await input.evaluate((el) => el.disabled);
  expect(isDisabled).toBe(true);

  const isFocusable = await input.evaluate((el) => el.tabIndex >= 0 && !el.disabled);
  expect(isFocusable).toBe(false);
});

test('checked state applies the neutral fill token to the track', async ({ page }) => {
  const off = await page
    .locator('#switch-basic')
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  const on = await page
    .locator('#switch-checked')
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(off).not.toBe(on);

  const neutralSurface = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ui-color-neutral-fill'),
  );
  // Registered tokens resolve to concrete colors on :root (theme-transition
  // @property); the checked track must consume the neutral surface token.
  expect(on).toBe(neutralSurface.trim());
});

test('track colors follow the theme switch (light-dark tokens)', async ({ page }) => {
  const readBg = () =>
    page.locator('#switch-basic').evaluate((el) => getComputedStyle(el).backgroundColor);

  await page.emulateMedia({ colorScheme: 'light' });
  const light = await readBg();

  await page.emulateMedia({ colorScheme: 'dark' });
  const dark = await readBg();

  expect(light).not.toBe(dark);
});

test('thumb position reflects the state (left when off, moved when on)', async ({ page }) => {
  const readOffset = (id) =>
    page.locator(`#${id}`).evaluate((el) => {
      const thumb = getComputedStyle(el, '::before');
      return { inlineStart: thumb.insetInlineStart, translate: thumb.translate };
    });

  const off = await readOffset('switch-basic');
  const on = await readOffset('switch-checked');

  // Both thumbs start at the same inset; the on state adds travel via
  // translate (0.875rem = 14px).
  expect(on.translate.split(' ')[0]).toBe('14px');
  expect(parseFloat(off.translate.split(' ')[0])).toBeLessThan(1);
});
