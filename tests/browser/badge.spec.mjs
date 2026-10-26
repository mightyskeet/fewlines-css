import { expect, test } from '@playwright/test';

/**
 * Badge component tests.
 * Badge is a static inline label: there is no native behavior to exercise,
 * so the contract under test is theming (variant tokens), theme switching,
 * inline flow and the absence of interactive semantics (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('default variant uses the raised surface and neutral text', async ({ page }) => {
  const styles = await page.locator('#badge-default').evaluate((el) => {
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, color: s.color };
  });

  const raised = await page
    .evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-surface-raised'),
    )
    .then((v) => v.trim());
  expect(styles.background).toBe(raised);

  const text = await page
    .evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ui-color-text'))
    .then((v) => v.trim());
  expect(styles.color).toBe(text);
});

test('variants resolve to distinct tint surfaces', async ({ page }) => {
  const ids = ['badge-default', 'badge-accent', 'badge-success', 'badge-warning', 'badge-danger'];
  const backgrounds = new Set();
  const colors = new Set();
  for (const id of ids) {
    const styles = await page.locator(`#${id}`).evaluate((el) => {
      const s = getComputedStyle(el);
      return { background: s.backgroundColor, color: s.color };
    });
    backgrounds.add(styles.background);
    colors.add(styles.color);
  }
  expect(backgrounds.size).toBe(5);
  expect(colors.size).toBe(5);
});

test('variant label color uses the -strong token of its family', async ({ page }) => {
  const strong = await page
    .evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-danger-strong'),
    )
    .then((v) => v.trim());
  const color = await page.locator('#badge-danger').evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe(strong);
});

test('tint surfaces follow the theme switch (light-dark tokens)', async ({ page }) => {
  const readBg = () =>
    page.locator('#badge-warning').evaluate((el) => getComputedStyle(el).backgroundColor);

  await page.emulateMedia({ colorScheme: 'light' });
  const light = await readBg();

  await page.emulateMedia({ colorScheme: 'dark' });
  const dark = await readBg();

  expect(light).not.toBe(dark);
});

test('badges stay inline (adjacent badges share a line)', async ({ page }) => {
  const boxes = await page.locator('#badges .ui-badge').evaluateAll((els) =>
    els.map((el) => {
      const box = el.getBoundingClientRect();
      return { top: box.top, height: box.height };
    }),
  );
  const display = await page
    .locator('#badge-default')
    .evaluate((el) => getComputedStyle(el).display);
  expect(display).toBe('inline-flex');
  for (const box of boxes) {
    // Same inline row: no badge dropped below the others.
    expect(Math.abs(box.top - boxes[0].top)).toBeLessThan(1);
  }
});

test('badge exposes no interactive semantics', async ({ page }) => {
  const badge = page.locator('#badge-default');
  await expect(badge).not.toHaveRole('button');
  await expect(badge).not.toHaveRole('link');
  const tabindex = await badge.evaluate((el) => el.getAttribute('tabindex'));
  expect(tabindex).toBeNull();
});

test('counter label is exposed via the host-supplied accessible name', async ({ page }) => {
  const counter = page.locator('#badge-counter');
  await expect(counter).toHaveAccessibleName('3 unread messages');
});
