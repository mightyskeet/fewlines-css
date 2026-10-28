import { expect, test } from '@playwright/test';

/**
 * Alert component tests.
 * Alert is a static container: there is no native behavior to exercise,
 * so the contract under test is theming (variant tokens), theme switching
 * and the host-owned live-region roles (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('default variant uses the info tint surface and info border', async ({ page }) => {
  const styles = await page.locator('#alert-info').evaluate((el) => {
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, borderColor: s.borderTopColor };
  });

  // Tint background must differ from the neutral surfaces (component consumes
  // the dedicated tint token, not surface/surface-raised).
  const surface = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ui-color-surface'),
  );
  expect(styles.background).not.toBe(surface.trim());

  // Border carries the variant color: same as the title color token.
  const info = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--ui-color-info').trim(),
  );
  expect(styles.borderColor).toBe(info);
});

test('variants resolve to distinct tint surfaces', async ({ page }) => {
  const ids = ['alert-info', 'alert-success', 'alert-warning', 'alert-danger'];
  const backgrounds = new Set();
  const borders = new Set();
  for (const id of ids) {
    const styles = await page.locator(`#${id}`).evaluate((el) => {
      const s = getComputedStyle(el);
      return { background: s.backgroundColor, border: s.borderTopColor };
    });
    backgrounds.add(styles.background);
    borders.add(styles.border);
  }
  expect(backgrounds.size).toBe(4);
  expect(borders.size).toBe(4);
});

test('title color follows the variant via family tokens', async ({ page }) => {
  const titleColors = new Set();
  for (const id of ['alert-info', 'alert-success', 'alert-warning', 'alert-danger']) {
    const color = await page
      .locator(`#${id} .ui-alert-title`)
      .evaluate((el) => getComputedStyle(el).color);
    titleColors.add(color);
  }
  expect(titleColors.size).toBe(4);
});

test('body text stays neutral across variants (max readability)', async ({ page }) => {
  const text = await page
    .locator('#alert-info .ui-alert-body')
    .evaluate((el) => getComputedStyle(el).color);
  const textOnSunken = await page
    .locator('#alert-danger .ui-alert-body')
    .evaluate((el) => getComputedStyle(el).color);
  expect(text).toBe(textOnSunken);
});

test('tint surfaces follow the theme switch (light-dark tokens)', async ({ page }) => {
  const readBg = () =>
    page.locator('#alert-warning').evaluate((el) => getComputedStyle(el).backgroundColor);

  await page.emulateMedia({ colorScheme: 'light' });
  const light = await readBg();

  await page.emulateMedia({ colorScheme: 'dark' });
  const dark = await readBg();

  expect(light).not.toBe(dark);
});

test('host-owned live region roles are exposed to the accessibility tree', async ({ page }) => {
  await expect(page.getByRole('alert')).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveCount(1);
});

test('alert box hugs its content (edge margins trimmed)', async ({ page }) => {
  // The last child inside .ui-alert must not add a bottom gap after the
  // padding: content edge == padding edge.
  const gap = await page.locator('#alert-info').evaluate((el) => {
    const box = el.getBoundingClientRect();
    const last = el.lastElementChild.getBoundingClientRect();
    const padBottom = Number.parseFloat(getComputedStyle(el).paddingBlockEnd);
    return last.bottom + padBottom - box.bottom;
  });
  expect(Math.abs(gap)).toBeLessThanOrEqual(1);
});
