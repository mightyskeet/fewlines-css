import { expect, test } from '../fixtures/test.mjs';

/**
 * Alert component tests.
 * Alert is a static container: there is no native behavior to exercise,
 * so the contract under test is theming (variant tokens), theme switching
 * and the host-owned live-region roles (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('default variant is the neutral gray tint (surface-tint + border-strong)', async ({
  page,
}) => {
  const styles = await page.locator('#alert-info').evaluate((el) => {
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, borderColor: s.borderTopColor };
  });

  const tint = await page
    .evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-surface-tint'),
    )
    .then((v) => v.trim());
  expect(styles.background).toBe(tint);

  const border = await page
    .evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-border-strong'),
    )
    .then((v) => v.trim());
  expect(styles.borderColor).toBe(border);
});

test('attention variant carries the urgency family tokens', async ({ page }) => {
  const styles = await page.locator('#alert-attention').evaluate((el) => {
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, borderColor: s.borderTopColor };
  });

  const tint = await page
    .evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-attention-tint'),
    )
    .then((v) => v.trim());
  expect(styles.background).toBe(tint);

  const accent = await page
    .evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-attention'),
    )
    .then((v) => v.trim());
  expect(styles.borderColor).toBe(accent);
});

test('title color follows the variant', async ({ page }) => {
  const neutralTitle = await page
    .locator('#alert-info .ui-alert-title')
    .evaluate((el) => getComputedStyle(el).color);
  const text = await page
    .evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ui-color-text'))
    .then((v) => v.trim());
  expect(neutralTitle).toBe(text);

  const attentionTitle = await page
    .locator('#alert-attention .ui-alert-title')
    .evaluate((el) => getComputedStyle(el).color);
  const attention = await page
    .evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-attention'),
    )
    .then((v) => v.trim());
  expect(attentionTitle).toBe(attention);
});

test('body text stays neutral across variants (max readability)', async ({ page }) => {
  const text = await page
    .locator('#alert-info .ui-alert-body')
    .evaluate((el) => getComputedStyle(el).color);
  const textOnAttention = await page
    .locator('#alert-attention .ui-alert-body')
    .evaluate((el) => getComputedStyle(el).color);
  expect(text).toBe(textOnAttention);
});

test('tint surfaces follow the theme switch (light-dark tokens)', async ({ page }) => {
  const readBg = () =>
    page.locator('#alert-attention').evaluate((el) => getComputedStyle(el).backgroundColor);

  await page.emulateMedia({ colorScheme: 'light' });
  const light = await readBg();

  await page.emulateMedia({ colorScheme: 'dark' });
  const dark = await readBg();

  expect(light).not.toBe(dark);
});

test('host-owned live region roles are exposed to the accessibility tree', async ({ page }) => {
  await expect(page.getByRole('alert')).toHaveCount(1);
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
