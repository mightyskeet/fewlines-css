import { expect, test } from '../fixtures/test.mjs';

/**
 * Slider component tests.
 * The contract under test: native range semantics (role, keyboard,
 * disabled), the engine paint wiring (track/thumb pseudo-elements), the
 * opt-in value-fill contract (--ui-slider-value, the Progress circle dual
 * source of truth), density sizes, the vertical orientation (min at the
 * bottom) and the RTL mirror (tests/README.md).
 *
 * Known engine limit (the Progress precedent): Chromium's getComputedStyle
 * resolves the internal ::-webkit-slider-* pseudos to the ELEMENT's styles
 * — the painted track/thumb cannot be asserted there directly. Cross-engine
 * the author-rule wiring is asserted via CSSOM; the painted result is
 * asserted in Firefox (::-moz-range-* is reachable) and verified by probe
 * in Chromium/WebKit (compatibility notes).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = async (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test('native slider semantics: role, name, keyboard, form state', async ({ page }) => {
  const el = page.locator('#slider-default');
  await expect(el).toHaveRole('slider');
  await expect(el).toHaveAccessibleName('Volume');

  await el.focus();
  await page.keyboard.press('ArrowRight');
  expect(await el.inputValue()).toBe('51'); // native step model
  await page.keyboard.press('Home');
  expect(await el.inputValue()).toBe('0');
  await page.keyboard.press('End');
  expect(await el.inputValue()).toBe('100');
});

test('box: appearance none, container-filling width, 24px hit target', async ({ page }) => {
  const el = await page.locator('#slider-default').evaluate((el) => {
    const s = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      appearance: s.appearance,
      display: s.display,
      background: s.backgroundColor,
      blockSize: rect.height,
      width: rect.width,
    };
  });
  const sectionWidth = await page.locator('#slider-default').evaluate((el) => {
    const p = getComputedStyle(el.parentElement);
    return el.parentElement.clientWidth - parseFloat(p.paddingLeft) - parseFloat(p.paddingRight);
  });

  expect(el.appearance).toBe('none');
  expect(el.display).toBe('block');
  expect(el.background).toBe('rgba(0, 0, 0, 0)'); // the paint lives on the track pseudo
  // Fills the container (no UA width divergence); Firefox layout reports
  // the form control a subpixel short of the section box.
  expect(el.width).toBeCloseTo(sectionWidth, 0);
  expect(el.blockSize).toBe(24); // the box is the hit target (WCAG 2.5.8)
});

test('paint wiring: both track pseudo rules carry the one gradient token (CSSOM)', async ({
  page,
  browserName,
}) => {
  // Engines drop foreign-vendor pseudo rules from the CSSOM.
  const needle = browserName === 'firefox' ? '-moz-range-track' : '-webkit-slider-runnable-track';
  const rule = await page.evaluate((needle) => {
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.cssRules) {
          const hit = walk(rule.cssRules);
          if (hit) return hit;
        }
        if (rule.selectorText?.includes(needle))
          return {
            background: rule.style.getPropertyValue('background'),
            borderRadius: rule.style.getPropertyValue('border-radius'),
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

  expect(rule.background).toBe('var(--ui-slider-paint)');
  expect(rule.borderRadius).toBe('var(--ui-radius-full)');
});

test('thumb wiring: surface circle with the shared elevation (CSSOM)', async ({ page }) => {
  // The thumb paint is split across rules (the Chromium-only margin rule
  // has no paint) — merge every slider-thumb rule before asserting.
  const merged = await page.evaluate(() => {
    const walk = (rules, acc) => {
      for (const rule of rules) {
        if (rule.cssRules) walk(rule.cssRules, acc);
        if (rule.selectorText?.includes('slider-thumb')) acc.push(rule.style);
      }
      return acc;
    };
    const styles = [];
    for (const sheet of document.styleSheets) walk(sheet.cssRules, styles);
    const read = (prop) =>
      styles.map((s) => s.getPropertyValue(prop)).find((v) => v && v !== '') ?? '';
    return {
      background: read('background'),
      // The CSSOM expands the `border: none` shorthand into longhands.
      borderStyle: read('border-style'),
      shadow: read('box-shadow'),
    };
  });

  expect(merged.background).toBe('var(--ui-color-surface)');
  expect(merged.borderStyle).toBe('none');
  expect(merged.shadow).toBe('var(--ui-elevation-1)');
});

test('painted track and thumb (Firefox ::-moz-range-*)', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'firefox',
    '::-moz-range-* is Firefox-only; Chromium falls back to element styles (compatibility notes)',
  );

  const styles = await page.locator('#slider-filled').evaluate((el) => ({
    track: getComputedStyle(el, '::-moz-range-track').backgroundImage,
    thumb: getComputedStyle(el, '::-moz-range-thumb').backgroundColor,
    thumbRadius: getComputedStyle(el, '::-moz-range-thumb').borderRadius,
    thumbSize: getComputedStyle(el, '::-moz-range-thumb').inlineSize,
  }));

  // The one gradient paint token resolves the brand fill and the tint track.
  expect(styles.track).toContain('linear-gradient');
  expect(styles.track).toContain(await token(page, '--ui-color-brand'));
  expect(styles.track).toContain(await token(page, '--ui-color-surface-tint'));
  expect(styles.thumb).toBe(await token(page, '--ui-color-surface'));
  expect(styles.thumbRadius).not.toBe('0px');
  expect(styles.thumbSize).toBe('20px'); // md thumb: 1.25rem
});

test('value fill is opt-in paint: host-set number, dual source of truth', async ({ page }) => {
  const filled = await page
    .locator('#slider-filled')
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--ui-slider-value').trim());
  const bare = await page
    .locator('#slider-default')
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--ui-slider-value').trim());

  expect(filled).toBe('50');
  expect(bare).toBe(''); // no host property — uniform track, thumb carries the state
});

test('density: thumb over fixed steps, rail over the space scale', async ({ page }) => {
  const read = (id) =>
    page.locator(`#${id}`).evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        thumb: s.getPropertyValue('--ui-slider-thumb').trim(),
        rail: s.getPropertyValue('--ui-slider-rail').trim(),
      };
    });

  expect((await read('slider-sm')).thumb).toBe('1rem');
  expect((await read('slider-default')).thumb).toBe('1.25rem');
  expect((await read('slider-lg')).thumb).toBe('1.5rem');

  // Computed custom properties keep the token stream (var() chains do not
  // resolve to px): the rail is asserted against the space token itself,
  // and in px through the Firefox pseudo (below).
  const spaces = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      sm: cs.getPropertyValue('--ui-space-2xs').trim(),
      md: cs.getPropertyValue('--ui-space-xs').trim(),
      lg: cs.getPropertyValue('--ui-space-sm').trim(),
    };
  });
  expect((await read('slider-sm')).rail).toBe(spaces.sm);
  expect((await read('slider-default')).rail).toBe(spaces.md);
  expect((await read('slider-lg')).rail).toBe(spaces.lg);
});

test('rail thickness in px (Firefox ::-moz-range-track)', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'firefox',
    '::-moz-range-track is Firefox-only; Chromium falls back to element styles (compatibility notes)',
  );

  const read = (id) =>
    page
      .locator(`#${id}`)
      .evaluate((el) => parseFloat(getComputedStyle(el, '::-moz-range-track').blockSize));
  const sm = await read('slider-sm');
  const md = await read('slider-default');
  const lg = await read('slider-lg');
  expect(sm).toBe(4);
  expect(md).toBe(8);
  expect(lg).toBe(12);
});

test('vertical: writing-mode rotates the control, min at the bottom', async ({ page }) => {
  const el = page.locator('#slider-vertical');
  const box = await el.evaluate((el) => {
    const s = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      writingMode: s.writingMode,
      paint: s.getPropertyValue('--ui-slider-paint'),
      width: rect.width,
      height: rect.height,
    };
  });

  expect(box.writingMode).toBe('sideways-lr');
  expect(box.paint).toContain('to top');
  expect(box.height).toBeGreaterThan(box.width);

  // The min end is at the bottom (the mixer convention; browser probe
  // 2026-11-09: vertical-lr is inverted in Chromium — vertical-rl is not):
  // a click near the bottom edge lands the value at the low end.
  await el.click({ position: { x: 12, y: 126 } });
  const value = parseFloat(await el.inputValue());
  expect(value).toBeLessThanOrEqual(10);
});

test('vertical: the rail length is a definite token, not a percentage', async ({ page }) => {
  const length = await page
    .locator('#slider-vertical')
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--ui-slider-length').trim());
  expect(length).toBe('8rem');
});

test('RTL mirrors the horizontal paint, vertical stays put', async ({ page }) => {
  await page.evaluate(() => {
    document.documentElement.setAttribute('dir', 'rtl');
  });

  const paints = await page.evaluate(() => ({
    horizontal: getComputedStyle(document.getElementById('slider-default')).getPropertyValue(
      '--ui-slider-paint',
    ),
    vertical: getComputedStyle(document.getElementById('slider-vertical')).getPropertyValue(
      '--ui-slider-paint',
    ),
  }));

  expect(paints.horizontal).toContain('to left');
  expect(paints.vertical).toContain('to top');
});

test('disabled: state-model opacity, native interaction refusal', async ({ page }) => {
  const el = page.locator('#slider-disabled');
  const styles = await el.evaluate((el) => ({
    opacity: getComputedStyle(el).opacity,
    disabled: el.matches(':disabled'),
    cursor: getComputedStyle(el).cursor,
  }));

  expect(styles.disabled).toBe(true);
  expect(styles.opacity).toBe('0.5');
  expect(styles.cursor).toBe('not-allowed');

  // Disabled controls are unfocusable: value stays put.
  await el.focus();
  await page.keyboard.press('ArrowRight');
  expect(await el.inputValue()).toBe('30');
});

test('forced colors restore the native slider', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const appearance = await page
    .locator('#slider-default')
    .evaluate((el) => getComputedStyle(el).appearance);
  expect(appearance).toBe('auto');
});
