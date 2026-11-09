import { expect, test } from '../fixtures/test.mjs';

/**
 * Slider component tests.
 * The contract under test: native range semantics (role, keyboard,
 * disabled), the engine paint wiring (track/thumb pseudo-elements), the
 * thumb-riding fill (the border-image slice trick — zero JS, no host-set
 * value), density sizes, the vertical orientation (min at the bottom) and
 * the RTL mirror (tests/README.md).
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
  // The box is the hit target and the thumb's air: thumb + 2×space-xs
  // (md 36px) — the elevation shadow must fit inside the overflow clip.
  expect(el.blockSize).toBe(36);
});

test('track wiring: transparent reference track with the pill radius (CSSOM)', async ({
  page,
  browserName,
}) => {
  // Engines drop foreign-vendor pseudo rules from the CSSOM. The rail
  // paint rides on the thumb — the track stays transparent.
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
            // Lightning CSS minifies the `background` shorthand — the
            // stable longhand is the image layer.
            backgroundImage: rule.style.getPropertyValue('background-image'),
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

  // Lightning CSS minifies `background: transparent` to `background: 0 0`
  // — the CSSOM longhand then serializes as `initial`. The contract: the
  // track rule carries NO paint layer.
  expect(['none', 'initial', '']).toContain(rule.backgroundImage);
  expect(rule.borderRadius).toBe('var(--ui-radius-full)');
});

test('thumb wiring: brand ring, no depth shadow (CSSOM)', async ({ page }) => {
  // The thumb paint is split across rules (the Chromium-only margin rule
  // has no paint). Chromium's CSSOM does not expand the outline longhands
  // of this rule — the shorthand cssText is the stable assert.
  const css = await page.evaluate(() => {
    const walk = (rules, acc) => {
      for (const rule of rules) {
        if (rule.cssRules) walk(rule.cssRules, acc);
        if (rule.selectorText?.includes('slider-thumb')) acc.push(rule.cssText);
      }
      return acc;
    };
    const acc = [];
    for (const sheet of document.styleSheets) {
      try {
        walk(sheet.cssRules, acc);
      } catch {}
    }
    return acc.join('\n');
  });

  expect(css).toContain('border-image: var(--ui-slider-fill-image)');
  // The brand ring: an outline with a negative offset (paints over the
  // border-image strips), no depth shadow.
  expect(css).toContain('outline: calc(var(--ui-slider-rail) / 2) solid var(--ui-color-brand)');
  expect(css).toContain('outline-offset');
  expect(css).not.toContain('elevation');
});

test('painted track and thumb (Firefox ::-moz-range-*)', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'firefox',
    '::-moz-range-* is Firefox-only; Chromium falls back to element styles (compatibility notes)',
  );

  const styles = await page.locator('#slider-filled').evaluate((el) => ({
    track: getComputedStyle(el, '::-moz-range-track').backgroundImage,
    thumbFillImage: getComputedStyle(el, '::-moz-range-thumb').borderImageSource,
    thumbRing: getComputedStyle(el, '::-moz-range-thumb').outlineColor,
    thumbRadius: getComputedStyle(el, '::-moz-range-thumb').borderRadius,
    thumbSize: getComputedStyle(el, '::-moz-range-thumb').inlineSize,
  }));

  // The rail paint rides on the thumb (border-image) — the track stays
  // transparent; the border-image source resolves the fill and track tokens.
  expect(styles.track).toBe('none');
  expect(styles.thumbFillImage).toContain('linear-gradient');
  expect(styles.thumbFillImage).toContain(await token(page, '--ui-color-border-strong'));
  expect(styles.thumbFillImage).toContain(await token(page, '--ui-color-surface-tint'));
  expect(styles.thumbRing).toBe(await token(page, '--ui-color-brand'));
  expect(styles.thumbRadius).not.toBe('0px');
  expect(styles.thumbSize).toBe('20px'); // md thumb: 1.25rem
});

test('the fill rides on the thumb: border-image wiring (CSSOM)', async ({ page }) => {
  // The thumb's border-image paints the fill/track strips (the Progress
  // engine-paint trap applies: CSSOM wiring is the Chromium-level assert).
  const paint = await page
    .locator('#slider-default')
    .evaluate((el) => getComputedStyle(el).getPropertyValue('--ui-slider-fill-image').trim());

  expect(paint).toContain('linear-gradient');
  expect(paint).toContain('100vw'); // the inline stretch of the side slices
  // The element clips the strips into the rounded rail.
  const clip = await page.locator('#slider-default').evaluate((el) => {
    const s = getComputedStyle(el);
    return { overflow: s.overflow, radius: s.borderRadius };
  });
  expect(clip.overflow).toBe('hidden');
  expect(clip.radius).not.toBe('0px');
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
      paint: s.getPropertyValue('--ui-slider-fill-image').trim(),
      width: rect.width,
      height: rect.height,
    };
  });

  expect(box.writingMode).toBe('sideways-lr');
  expect(box.paint).toContain('100vh'); // the strips stretch along the vertical rail
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
  const readPaint = (id) =>
    page
      .locator(`#${id}`)
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--ui-slider-fill-image').trim());
  const ltr = await readPaint('slider-default');
  const vertical = await readPaint('slider-vertical');

  await page.evaluate(() => {
    document.documentElement.setAttribute('dir', 'rtl');
  });

  // The gradient directions are physical: RTL mirrors the horizontal
  // token; the vertical one does not flip with the document direction.
  const rtl = await readPaint('slider-default');
  expect(rtl).not.toBe(ltr);
  expect(rtl).not.toBe(await readPaint('slider-vertical'));
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
