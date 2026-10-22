import { expect, test } from '@playwright/test';

/**
 * Fluid typography and text-style classes.
 *
 * The fluid scale (tokens/typography.css) is deterministic at a fixed
 * viewport; these tests verify the behavior contract, not pixel values:
 * sizes respond to the viewport width and pin outside the interpolation
 * window, document text follows the md step, and the ui-* classes apply
 * their roles (packages/core/src/text/text.css).
 */

const readFont = (locator) => locator.evaluate((el) => getComputedStyle(el).fontSize);

test('type sizes grow with the viewport and pin outside the window', async ({ page }) => {
  await page.goto('/typography.html');

  await page.setViewportSize({ width: 300, height: 800 });
  const belowVmin = await readFont(page.locator('h1'));
  await page.setViewportSize({ width: 400, height: 800 });
  // Below --ui-fluid-vmin the factor clamps to 0: same size as 300px.
  expect(await readFont(page.locator('h1'))).toBe(belowVmin);

  await page.setViewportSize({ width: 700, height: 800 });
  const middle = await readFont(page.locator('h1'));
  expect(parseFloat(middle)).toBeGreaterThan(parseFloat(belowVmin));

  await page.setViewportSize({ width: 1200, height: 800 });
  const aboveVmax = await readFont(page.locator('h1'));
  await page.setViewportSize({ width: 2000, height: 800 });
  // Above --ui-fluid-vmax the factor clamps to 1: same size as 1200px.
  expect(await readFont(page.locator('h1'))).toBe(aboveVmax);
  expect(parseFloat(aboveVmax)).toBeGreaterThan(parseFloat(middle));
});

test('document text follows the md step', async ({ page }) => {
  await page.goto('/typography.html');
  const body = await readFont(page.locator('body'));
  const uiBody = await readFont(page.locator('.ui-body'));
  expect(body).toBe(uiBody);
});

test('text style classes apply their roles', async ({ page }) => {
  await page.goto('/typography.html');

  const styles = await page.locator('.example p[class^="ui-"]').evaluateAll((els) =>
    Object.fromEntries(
      els.map((el) => {
        const s = getComputedStyle(el);
        return [el.className, { size: parseFloat(s.fontSize), weight: s.fontWeight }];
      }),
    ),
  );

  // Size order across the scale.
  expect(styles['ui-caption'].size).toBeLessThan(styles['ui-support'].size);
  expect(styles['ui-support'].size).toBeLessThan(styles['ui-body'].size);
  expect(styles['ui-body'].size).toBeLessThan(styles['ui-lead'].size);
  expect(styles['ui-lead'].size).toBeLessThan(styles['ui-headline'].size);
  expect(styles['ui-headline'].size).toBeLessThan(styles['ui-display'].size);

  // lead shares the title step, keeps the body weight; weights follow roles.
  expect(styles['ui-lead'].size).toBe(styles['ui-title'].size);
  expect(styles['ui-lead'].weight).toBe('400');
  expect(styles['ui-title'].weight).toBe('600');
  expect(styles['ui-display'].weight).toBe('700');
  expect(styles['ui-caption'].weight).toBe('500');
});
