import { expect, test } from '@playwright/test';

/**
 * Fluid typography and text-style classes.
 *
 * The fluid scale (tokens/typography.css) is deterministic at a fixed
 * viewport; these tests verify the behavior contract, not pixel values:
 * sizes respond to the viewport width and pin outside the interpolation
 * window, document text follows the default step, headings map onto the
 * canonical steps (theme notes), and the ui-* classes apply their
 * positions (packages/core/src/text/text.css).
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
  const uiBody = await readFont(page.locator('.ui-body'));
  expect(body).toBe(uiBody);
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

test('text style classes apply their canonical positions', async ({ page }) => {
  await page.goto('/typography.html');

  const styles = await page
    .locator('.ui-display, .ui-lead, .ui-body, .ui-overline, .ui-caption')
    .evaluateAll((els) =>
      Object.fromEntries(
        els.map((el) => {
          const s = getComputedStyle(el);
          return [el.className, { size: parseFloat(s.fontSize), weight: s.fontWeight }];
        }),
      ),
    );

  // Size order across the scale; overline and caption share the xs step.
  expect(styles['ui-caption'].size).toBe(styles['ui-overline'].size);
  expect(styles['ui-caption'].size).toBeLessThan(styles['ui-body'].size);
  expect(styles['ui-body'].size).toBeLessThan(styles['ui-lead'].size);
  expect(styles['ui-lead'].size).toBeLessThan(styles['ui-display'].size);

  // Weights follow the canonical mapping.
  expect(styles['ui-overline'].weight).toBe('500');
  expect(styles['ui-caption'].weight).toBe('400');
  expect(styles['ui-body'].weight).toBe('400');
  expect(styles['ui-lead'].weight).toBe('400');
  expect(styles['ui-display'].weight).toBe('700');
});
