import { expect, test } from '@playwright/test';

/**
 * Progress component tests.
 * <progress> is a non-interactive indicator: the contract under test is the
 * themed paint (track + fill through the engine pseudo-elements), the value
 * model (:indeterminate is native), the density scale and the forced-colors
 * restore (tests/README.md).
 *
 * Known engine limit (probe 2026-10-29, compatibility notes): Chromium's
 * getComputedStyle resolves the internal ::-webkit-progress-* pseudos to the
 * ELEMENT's styles — the painted fill cannot be asserted there directly.
 * Cross-engine the author-rule wiring is asserted via CSSOM; the painted
 * fill itself is asserted in Firefox (:::-moz-progress-bar is reachable)
 * and verified by probe in Chromium/WebKit (compatibility notes).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = async (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test('default determinate bar: tint track with strong border, brand fill', async ({ page }) => {
  const el = await page.locator('#progress-default').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      appearance: s.appearance,
      display: s.display,
      inlineSize: s.inlineSize,
      blockSize: s.blockSize,
      background: s.backgroundColor,
      borderColor: s.borderTopColor,
      fillVar: s.getPropertyValue('--ui-progress-fill').trim(),
    };
  });
  const sectionWidth = await page.locator('#progress-default').evaluate((el) => {
    const p = getComputedStyle(el.parentElement);
    return el.parentElement.clientWidth - parseFloat(p.paddingLeft) - parseFloat(p.paddingRight);
  });

  expect(el.appearance).toBe('none');
  expect(el.display).toBe('block');
  expect(el.inlineSize).toBe(`${sectionWidth}px`); // fills the container, no UA width divergence
  expect(el.blockSize).toBe('8px');
  expect(el.background).toBe(await token(page, '--ui-color-surface-tint'));
  expect(el.borderColor).toBe(await token(page, '--ui-color-border-strong'));
  expect(el.fillVar).toBe(await token(page, '--ui-color-brand'));
});

test('the fill rule for this engine carries the fill token (CSSOM wiring)', async ({ page, browserName }) => {
  // Engines drop foreign-vendor pseudo rules from the CSSOM: Chromium keeps
  // only ::-webkit-progress-value, Firefox only ::-moz-progress-bar.
  const needle = browserName === 'firefox' ? '-moz-progress-bar' : '-webkit-progress-value';
  const background = await page.evaluate((needle) => {
    // The bundle nests component rules inside @layer blocks — recurse.
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.cssRules) {
          const hit = walk(rule.cssRules);
          if (hit) return hit;
        }
        if (rule.selectorText?.includes(needle))
          return rule.style.getPropertyValue('background');
      }
      return null;
    };
    for (const sheet of document.styleSheets) {
      const hit = walk(sheet.cssRules);
      if (hit) return hit;
    }
    return null;
  }, needle);

  expect(background).toBe('var(--ui-progress-fill)');
});

test('painted fill: brand on the track (Firefox ::-moz-progress-bar)', async ({ page, browserName }) => {
  test.skip(browserName !== 'firefox', '::-moz-progress-bar is Firefox-only; Chromium falls back to element styles (compatibility notes)');

  const fill = await page
    .locator('#progress-default')
    .evaluate((el) => getComputedStyle(el, '::-moz-progress-bar').backgroundColor);
  expect(fill).toBe(await token(page, '--ui-color-brand'));
});

test('indeterminate: no value attribute matches :indeterminate, same paint contract', async ({
  page,
}) => {
  const el = await page.locator('#progress-indeterminate').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      indeterminate: el.matches(':indeterminate'),
      background: s.backgroundColor,
      blockSize: s.blockSize,
    };
  });

  expect(el.indeterminate).toBe(true);
  expect(el.background).toBe(await token(page, '--ui-color-surface-tint'));
  expect(el.blockSize).toBe('8px');
});

test('sizes scale only the bar thickness', async ({ page }) => {
  const sm = await page.locator('#progress-sm').evaluate((el) => getComputedStyle(el).blockSize);
  const lg = await page.locator('#progress-lg').evaluate((el) => getComputedStyle(el).blockSize);
  expect(sm).toBe('4px');
  expect(lg).toBe('12px');
});

test('forced colors restore the native progress bar', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const appearance = await page
    .locator('#progress-default')
    .evaluate((el) => getComputedStyle(el).appearance);
  expect(appearance).toBe('auto');
});
