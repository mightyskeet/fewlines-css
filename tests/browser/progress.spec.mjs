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

test('default determinate bar: borderless tint track, brand fill', async ({ page }) => {
  const el = await page.locator('#progress-default').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      appearance: s.appearance,
      display: s.display,
      inlineSize: s.inlineSize,
      blockSize: s.blockSize,
      background: s.backgroundColor,
      borderStyle: s.borderTopStyle,
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
  expect(el.borderStyle).toBe('none'); // borderless soft track (Badge-neutral model)
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

test('shimmer: gradient band + animation on the fill rule (CSSOM wiring)', async ({ page, browserName }) => {
  // The same engine-paint trap as the fill: Chromium cannot reach the
  // pseudo's computed styles — the wiring is asserted via CSSOM.
  const needle = browserName === 'firefox' ? '-moz-progress-bar' : '-webkit-progress-value';
  const rule = await page.evaluate((needle) => {
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.cssRules) {
          const hit = walk(rule.cssRules);
          if (hit) return hit;
        }
        if (rule.selectorText?.includes('data-shimmer') && rule.selectorText?.includes(needle))
          return {
            selector: rule.selectorText,
            backgroundImage: rule.style.getPropertyValue('background-image'),
            animation: rule.style.getPropertyValue('animation'),
          };
      }
      return null;
    };
    for (const sheet of document.styleSheets) {
      const hit = walk(sheet.cssRules);
      if (hit) return hit;
    }
    return null;
  }, needle);

  expect(rule.selector).toContain(':not(:indeterminate)'); // no shimmer on engine motion
  expect(rule.backgroundImage).toContain('linear-gradient');
  expect(rule.backgroundImage).toContain('color-mix');
  expect(rule.animation).toContain('ui-progress-shimmer');
  expect(rule.animation).toContain('var(--ui-progress-shimmer-duration)');
});

test('shimmer keyframes sweep background-position without a dead pause', async ({ page }) => {
  const frames = await page.evaluate(() => {
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.name === 'ui-progress-shimmer')
          return {
            from: rule.findRule('from').style.backgroundPosition,
            to: rule.findRule('to').style.backgroundPosition,
          };
        if (rule.cssRules) {
          const hit = walk(rule.cssRules);
          if (hit) return hit;
        }
      }
      return null;
    };
    for (const sheet of document.styleSheets) {
      const hit = walk(sheet.cssRules);
      if (hit) return hit;
    }
    return null;
  });

  // Chromium serializes the 0 y-offset as 0px, Firefox as 0% — the sweep is
  // the x percentage, that is what the contract pins.
  expect(frames.from.startsWith('-100%')).toBe(true);
  expect(frames.to.startsWith('200%')).toBe(true);
});

test('shimmer opt-in gates: attribute + determinate', async ({ page }) => {
  const gates = await page.evaluate(() => ({
    on: document
      .getElementById('progress-shimmer')
      .matches('.ui-progress[data-shimmer]:not(:indeterminate)'),
    indeterminate: document
      .getElementById('progress-shimmer-indeterminate')
      .matches('.ui-progress[data-shimmer]:not(:indeterminate)'),
    plain: document
      .getElementById('progress-default')
      .matches('.ui-progress[data-shimmer]:not(:indeterminate)'),
  }));

  expect(gates.on).toBe(true);
  expect(gates.indeterminate).toBe(false);
  expect(gates.plain).toBe(false);
});

test('reduced motion silences the shimmer on the fill rule', async ({ page, browserName }) => {
  const needle = browserName === 'firefox' ? '-moz-progress-bar' : '-webkit-progress-value';
  const silenced = await page.evaluate((needle) => {
    // Only descend into the reduced-motion media block — the plain shimmer
    // rule has the same selector and must not satisfy this assertion.
    const findIn = (rules) => {
      for (const rule of rules) {
        if (rule.selectorText?.includes('data-shimmer') && rule.selectorText.includes(needle))
          return {
            animationName: rule.style.getPropertyValue('animation-name'),
            backgroundImage: rule.style.getPropertyValue('background-image'),
          };
        if (rule.cssRules) {
          const hit = findIn(rule.cssRules);
          if (hit) return hit;
        }
      }
      return null;
    };
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.conditionText?.includes('prefers-reduced-motion: reduce')) {
          const hit = findIn(rule.cssRules);
          if (hit) return hit;
        } else if (rule.cssRules) {
          const inner = walk(rule.cssRules);
          if (inner) return inner;
        }
      }
      return null;
    };
    for (const sheet of document.styleSheets) {
      const hit = walk(sheet.cssRules);
      if (hit) return hit;
    }
    return null;
  }, needle);

  // Firefox serializes the `animation: none` shorthand expanded — the
  // longhand animation-name is stable across engines.
  expect(silenced.animationName).toBe('none');
  expect(silenced.backgroundImage).toBe('none');
});
