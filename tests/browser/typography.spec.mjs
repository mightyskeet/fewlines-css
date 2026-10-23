import { expect, test } from '@playwright/test';

/**
 * Fluid typography.
 *
 * The fluid scale (tokens/typography.css) is deterministic at a fixed
 * viewport; these tests verify the behavior contract, not pixel values:
 * sizes respond to the viewport width and pin outside the interpolation
 * window, document text follows the default step, and headings map onto
 * the canonical steps (theme notes).
 */

const readFont = (locator) => locator.evaluate((el) => getComputedStyle(el).fontSize);

/** Resolved px value of a step token, via a throwaway probe element. */
const tokenFont = (page, token) =>
  page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.fontSize = `var(${name})`;
    document.body.append(probe);
    const size = getComputedStyle(probe).fontSize;
    probe.remove();
    return size;
  }, token);

test('type sizes grow with the viewport and pin outside the window', async ({ page }) => {
  await page.goto('/typography.html');

  await page.setViewportSize({ width: 300, height: 800 });
  const belowVmin = await readFont(page.locator('h1'));
  await page.setViewportSize({ width: 400, height: 800 });
  // Below --ui-fluid-vmin the factor clamps to 0: same size as 300px.
  expect(await readFont(page.locator('h1'))).toBe(belowVmin);

  await page.setViewportSize({ width: 800, height: 800 });
  const middle = await readFont(page.locator('h1'));
  expect(parseFloat(middle)).toBeGreaterThan(parseFloat(belowVmin));

  await page.setViewportSize({ width: 1400, height: 800 });
  const aboveVmax = await readFont(page.locator('h1'));
  await page.setViewportSize({ width: 2000, height: 800 });
  // Above --ui-fluid-vmax the factor clamps to 1: same size as 1400px.
  expect(await readFont(page.locator('h1'))).toBe(aboveVmax);
  expect(parseFloat(aboveVmax)).toBeGreaterThan(parseFloat(middle));
});

test('document text follows the default step', async ({ page }) => {
  await page.goto('/typography.html');
  const body = await readFont(page.locator('body'));
  expect(await tokenFont(page, '--ui-font-size-default')).toBe(body);
});

test('headings map onto the canonical scale steps', async ({ page }) => {
  await page.goto('/typography.html');

  const cases = [
    ['h1', '--ui-font-size-2xl', '700'],
    ['h2', '--ui-font-size-xl', '600'],
    ['.example h3', '--ui-font-size-lg', '600'],
    ['.example h4', '--ui-font-size-md', '600'],
    ['.example h5', '--ui-font-size-default', '600'],
    ['.example h6', '--ui-font-size-sm', '600'],
  ];

  for (const [selector, token, weight] of cases) {
    const el = page.locator(selector).first();
    expect(await readFont(el), `${selector} size`).toBe(await tokenFont(page, token));
    expect(
      await el.evaluate((node) => getComputedStyle(node).fontWeight),
      `${selector} weight`,
    ).toBe(weight);
  }
});
