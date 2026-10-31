import { expect, test } from '../fixtures/test.mjs';

/**
 * Divider component tests.
 * Divider is a static <hr>: no native behavior to exercise, so the contract
 * under test is the line look (variant tokens), density (data-size) and the
 * absence of interactive semantics (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = async (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test('default is a solid 1px line on the border token with md margins', async ({ page }) => {
  const styles = await page.locator('#divider-default').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      style: s.borderTopStyle,
      width: s.borderTopWidth,
      color: s.borderTopColor,
      marginBlock: s.marginBlock,
    };
  });

  expect(styles.style).toBe('solid');
  expect(styles.width).toBe('1px');
  expect(styles.color).toBe(await token(page, '--ui-color-border'));
  expect(styles.marginBlock).toBe('16px');
});

test('dashed changes only the line style', async ({ page }) => {
  const styles = await page.locator('#divider-dashed').evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.borderTopStyle, color: s.borderTopColor };
  });

  expect(styles.style).toBe('dashed');
  expect(styles.color).toBe(await token(page, '--ui-color-border'));
});

test('strong uses the border-strong token, same geometry', async ({ page }) => {
  const styles = await page.locator('#divider-strong').evaluate((el) => {
    const s = getComputedStyle(el);
    return { style: s.borderTopStyle, color: s.borderTopColor, width: s.borderTopWidth };
  });

  expect(styles.style).toBe('solid');
  expect(styles.width).toBe('1px');
  expect(styles.color).toBe(await token(page, '--ui-color-border-strong'));
});

test('inset start indents the logical inline start only', async ({ page }) => {
  const styles = await page.locator('#divider-inset-start').evaluate((el) => {
    const s = getComputedStyle(el);
    return { start: s.marginInlineStart, end: s.marginInlineEnd };
  });

  expect(styles.start).toBe('24px');
  expect(styles.end).toBe('0px');
});

test('inset both indents symmetrically on both sides', async ({ page }) => {
  const styles = await page.locator('#divider-inset-both').evaluate((el) => {
    const s = getComputedStyle(el);
    return { start: s.marginInlineStart, end: s.marginInlineEnd };
  });

  expect(styles.start).toBe('24px');
  expect(styles.end).toBe('24px');
});

test('inset combines with the variant: dashed line keeps its style and indent', async ({
  page,
}) => {
  const styles = await page.locator('#divider-dashed-inset').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      style: s.borderTopStyle,
      color: s.borderTopColor,
      start: s.marginInlineStart,
      end: s.marginInlineEnd,
    };
  });

  expect(styles.style).toBe('dashed');
  expect(styles.color).toBe(await token(page, '--ui-color-border'));
  expect(styles.start).toBe('24px');
  expect(styles.end).toBe('0px');
});

test('sizes scale only the block margins, the line stays 1px', async ({ page }) => {
  const sm = await page.locator('#divider-sm').evaluate((el) => {
    const s = getComputedStyle(el);
    return { marginBlock: s.marginBlock, width: s.borderTopWidth };
  });
  expect(sm.marginBlock).toBe('12px');
  expect(sm.width).toBe('1px');

  const lg = await page.locator('#divider-lg').evaluate((el) => {
    const s = getComputedStyle(el);
    return { marginBlock: s.marginBlock, width: s.borderTopWidth };
  });
  expect(lg.marginBlock).toBe('24px');
  expect(lg.width).toBe('1px');
});
