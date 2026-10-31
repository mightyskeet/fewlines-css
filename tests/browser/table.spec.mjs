import { expect, test } from '../fixtures/test.mjs';

/**
 * Table component tests (tests/README.md).
 * Table is a native table: semantics (roles, caption association, scope)
 * are native. Tests cover token theming, zebra/hover surfaces, the sticky
 * header contract in a scroll container and the wrap model.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test('header cells use muted text; default header is transparent', async ({ page }) => {
  const th = page.locator('#table-default thead th').first();
  const styles = await th.evaluate((el) => {
    const s = getComputedStyle(el);
    return { color: s.color, background: s.backgroundColor };
  });
  expect(styles.color).toBe(await token(page, '--ui-color-text-muted'));
  expect(styles.background).toBe('rgba(0, 0, 0, 0)');
});

test('sticky header gets an opaque surface background', async ({ page }) => {
  const background = await page
    .locator('#table-sticky thead th')
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(background).toBe(await token(page, '--ui-color-surface'));
});

test('body cells inherit the base text color', async ({ page }) => {
  const color = await page
    .locator('#table-default tbody td')
    .first()
    .evaluate((el) => getComputedStyle(el).color);
  expect(color).toBe(await token(page, '--ui-color-text'));
});

test('cells carry a hairline bottom border under the separate border model', async ({ page }) => {
  const table = await page
    .locator('#table-default')
    .evaluate((el) => getComputedStyle(el).borderCollapse);
  expect(table).toBe('separate');

  const cell = await page
    .locator('#table-default tbody td')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { width: s.borderBottomWidth, style: s.borderBottomStyle };
    });
  expect(cell.width).toBe('1px');
  expect(cell.style).toBe('solid');

  // No closing line: the last body row (and tfoot cells) drop the hairline.
  const last = await page
    .locator('#table-default tbody tr')
    .last()
    .locator('td')
    .first()
    .evaluate((el) => getComputedStyle(el).borderBottomStyle);
  expect(last).toBe('none');
});

test('zebra stripes apply to odd body rows only', async ({ page }) => {
  const raised = await token(page, '--ui-color-surface-raised');
  const rows = page.locator('#table-zebra tbody tr');
  const odd = await rows.nth(0).evaluate((el) => getComputedStyle(el).backgroundColor);
  const even = await rows.nth(1).evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(odd).toBe(raised);
  expect(even).toBe('rgba(0, 0, 0, 0)');
});

test('non-zebra rows stay unstriped', async ({ page }) => {
  const background = await page
    .locator('#table-default tbody tr')
    .nth(0)
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(background).toBe('rgba(0, 0, 0, 0)');
});

test('hover fills the row with the hover token (zebra-safe)', async ({ page }) => {
  const hover = await token(page, '--ui-color-hover');

  const row = page.locator('#table-default tbody tr').nth(0);
  await row.locator('td').first().hover();
  expect(await row.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(hover);

  const zebraRow = page.locator('#table-zebra tbody tr').nth(0);
  await zebraRow.locator('td').first().hover();
  expect(await zebraRow.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(hover);
});

test('data-align="end" right-aligns and uses tabular numerals', async ({ page }) => {
  const styles = await page
    .locator('#table-default [data-align="end"]')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { align: s.textAlign, numeric: s.fontVariantNumeric };
    });
  expect(styles.align).toBe('end');
  expect(styles.numeric).toContain('tabular-nums');
});

test('caption is the accessible name of the table', async ({ page }) => {
  await expect(page.locator('#table-default')).toHaveAccessibleName('Quarterly revenue');
});

test('native table roles are preserved', async ({ page }) => {
  await expect(page.locator('#table-default thead th').first()).toHaveRole('columnheader');
  await expect(page.locator('#table-default tbody th').first()).toHaveRole('rowheader');
  await expect(page.locator('#table-default tbody td').first()).toHaveRole('cell');
});

test('sticky header stays at the top of the scroll container', async ({ page }) => {
  const wrap = page.locator('#table-wrap');
  await wrap.evaluate((el) => el.scrollTo(0, el.scrollHeight));

  const scrolled = await wrap.evaluate((el) => el.scrollTop);
  expect(scrolled).toBeGreaterThan(0);

  const boxes = await page.evaluate(() => {
    const wrapBox = document.querySelector('#table-wrap').getBoundingClientRect();
    const thBox = document.querySelector('#table-sticky thead th').getBoundingClientRect();
    return { wrapTop: wrapBox.top, thTop: thBox.top };
  });
  expect(Math.abs(boxes.thTop - boxes.wrapTop)).toBeLessThan(2);
});

test('wrap is a scroll container on both axes (sticky binding contract)', async ({ page }) => {
  const styles = await page.locator('#table-wrap').evaluate((el) => {
    const s = getComputedStyle(el);
    return { x: s.overflowX, y: s.overflowY };
  });
  // overflow-inline: auto; per CSS Overflow the other axis computes to auto.
  expect(styles.x).toBe('auto');
  expect(styles.y).toBe('auto');
});

test('scroll container is keyboard reachable (host contract in fixture)', async ({ page }) => {
  const tabindex = await page.locator('#table-wrap').evaluate((el) => el.getAttribute('tabindex'));
  expect(tabindex).toBe('0');
});
