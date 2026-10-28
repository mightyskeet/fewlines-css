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

test('default variant is the brand pastel (brand-tint + brand)', async ({ page }) => {
  const styles = await page.locator('#badge-default').evaluate((el) => {
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, color: s.color };
  });

  const tint = await page
    .evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-brand-tint'),
    )
    .then((v) => v.trim());
  expect(styles.background).toBe(tint);

  const text = await page
    .evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ui-color-brand'))
    .then((v) => v.trim());
  expect(styles.color).toBe(text);
});

test('the explicit neutral variant is the brand-independent gray pastel', async ({ page }) => {
  const styles = await page.locator('#badge-neutral').evaluate((el) => {
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, color: s.color };
  });

  const tint = await page
    .evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-surface-tint'),
    )
    .then((v) => v.trim());
  expect(styles.background).toBe(tint);

  const text = await page
    .evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ui-color-text'))
    .then((v) => v.trim());
  expect(styles.color).toBe(text);
});

test('solid model uses the on-* text over the bare family tone', async ({ page }) => {
  const cases = [
    // Bare data-solid (no variant) = the default brand family.
    {
      id: 'badge-default-solid',
      surface: '--ui-color-brand',
      on: '--ui-color-on-brand',
    },
    {
      id: 'badge-neutral-solid',
      surface: '--ui-color-text',
      on: '--ui-color-surface',
    },
    { id: 'badge-info-solid', surface: '--ui-color-info', on: '--ui-color-on-info' },
    {
      id: 'badge-success-solid',
      surface: '--ui-color-success',
      on: '--ui-color-on-success',
    },
    // warning tone doubles as its fill (calibrated to the 600 step to the 600 step (white on 500 fails body).
    { id: 'badge-warning-solid', surface: '--ui-color-warning', on: '--ui-color-on-warning' },
    { id: 'badge-danger-solid', surface: '--ui-color-danger', on: '--ui-color-on-danger' },
  ];
  for (const { id, surface, on } of cases) {
    const styles = await page.locator(`#${id}`).evaluate((el) => {
      const s = getComputedStyle(el);
      return { background: s.backgroundColor, color: s.color };
    });
    const expectedBg = await page
      .evaluate(
        (name) => getComputedStyle(document.documentElement).getPropertyValue(name),
        [surface],
      )
      .then((v) => v.trim());
    const expectedFg = await page
      .evaluate((name) => getComputedStyle(document.documentElement).getPropertyValue(name), [on])
      .then((v) => v.trim());
    expect(styles.background, id).toBe(expectedBg);
    expect(styles.color, id).toBe(expectedFg);
  }
});

test('variants resolve to distinct tint surfaces', async ({ page }) => {
  const ids = [
    'badge-default',
    'badge-neutral',
    'badge-info',
    'badge-success',
    'badge-warning',
    'badge-danger',
  ];
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
  // Label colors collapse to 5 (2026-10-28, *-strong removed): the default
  // (brand pastel) and neutral variants share the gray text under the
  // gray brand — the brand pastel IS the default look. Backgrounds collapse
  // the same way: brand-tint defaults to the same gray as surface-tint.
  expect(backgrounds.size).toBe(5);
  expect(colors.size).toBe(5);
});

test('variant label color uses the bare token of its family', async ({ page }) => {
  const bare = await page
    .evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-danger'),
    )
    .then((v) => v.trim());
  const color = await page.locator('#badge-danger').evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe(bare);
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

test('sizes scale the pill monotonically (sm < md < lg)', async ({ page }) => {
  const heightOf = (id) =>
    page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().height);
  const sm = await heightOf('badge-sm');
  const md = await heightOf('badge-default');
  const lg = await heightOf('badge-lg');
  expect(sm).toBeLessThan(md);
  expect(md).toBeLessThan(lg);
  // Integer heights: the pill keeps the device-pixel grid of the flow below.
  for (const h of [sm, md, lg]) expect(Number.isInteger(h)).toBe(true);
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
