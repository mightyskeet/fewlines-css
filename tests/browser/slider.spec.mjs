import { expect, test } from '../fixtures/test.mjs';

/**
 * Slider component tests.
 * The contract under test: native range semantics (role, keyboard,
 * disabled), the engine paint wiring (track/thumb pseudo-elements), the
 * anchored value fill (CSS Anchor Positioning — the thumb pseudo is the
 * anchor; zero JS, no host-set value), density sizes and the vertical
 * orientation (min at the bottom, no RTL mirror — tests/README.md).
 *
 * Known engine limit (the Progress precedent): Chromium's getComputedStyle
 * resolves the internal ::-webkit-slider-* pseudos to the ELEMENT's styles
 * — the painted track/thumb cannot be asserted there directly. Cross-engine
 * the author-rule wiring is asserted via CSSOM; the painted result is
 * asserted in Firefox (::-moz-range-* is reachable) and verified by probe
 * in Chromium/WebKit (compatibility notes). The anchor-on-thumb-pseudo
 * behavior is asserted in Chromium (probe 2026-11-09); other engines
 * degrade to the uniform track (graceful).
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
    const p = getComputedStyle(el.parentElement.parentElement);
    return (
      el.parentElement.parentElement.clientWidth -
      parseFloat(p.paddingLeft) -
      parseFloat(p.paddingRight)
    );
  });

  expect(el.appearance).toBe('none');
  expect(el.display).toBe('block');
  expect(el.background).toBe('rgba(0, 0, 0, 0)'); // the paint lives on the wrapper pseudos
  // Fills the container (no UA width divergence); Firefox layout reports
  // the form control a subpixel short of the section box.
  expect(el.width).toBeCloseTo(sectionWidth, 0);
  // The box is the hit target and the thumb's air: thumb + 2×space-xs
  // (md 36px).
  expect(el.blockSize).toBe(36);
});

test('track wiring: transparent reference track (CSSOM)', async ({ page, browserName }) => {
  // Engines drop foreign-vendor pseudo rules from the CSSOM. The rail
  // paint lives on the wrapper's ::before — the track stays unpainted and
  // carries no radius of its own.
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
});

test('thumb wiring: brand ring over surface, anchor carrier (CSSOM)', async ({ page }) => {
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

  // The state carrier: a brand ring over an opaque surface interior (the
  // border IS the ring — no border-image, no outline, no depth shadow).
  // anchor-name turns the pseudo into the fill's anchor.
  // (CSSOM expands `border: none`-style resets into longhands — the paint
  // shorthand is what is asserted.)
  expect(css).toContain('background: var(--ui-color-surface)');
  expect(css).toContain('solid var(--ui-color-brand)');
  expect(css).toContain('anchor-name: --ui-slider-thumb');
  expect(css).toContain('corner-shape: round');
  expect(css).toContain('box-sizing: border-box');
  expect(css).not.toContain('border-image: var');
  expect(css).not.toContain('border-image: linear-gradient');
  expect(css).not.toContain('outline:');
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
    thumbInterior: getComputedStyle(el, '::-moz-range-thumb').backgroundColor,
    thumbRing: getComputedStyle(el, '::-moz-range-thumb').borderTopColor,
    thumbRadius: getComputedStyle(el, '::-moz-range-thumb').borderRadius,
    thumbSize: getComputedStyle(el, '::-moz-range-thumb').inlineSize,
  }));

  // The rail paint lives on the wrapper's ::before — the track stays
  // transparent; the thumb is the brand ring over the opaque surface.
  expect(styles.track).toBe('none');
  expect(styles.thumbFillImage).toBe('none');
  expect(styles.thumbInterior).toBe(await token(page, '--ui-color-surface'));
  expect(styles.thumbRing).toBe(await token(page, '--ui-color-brand'));
  expect(styles.thumbRadius).not.toBe('0px');
  expect(styles.thumbSize).toBe('20px'); // md thumb: 1.25rem (border-box)
});

test('the fill anchors to the thumb (CSSOM)', async ({ page }) => {
  // The wrapper's ::after paints the fill, anchored to the thumb pseudo
  // (the Progress engine-paint trap applies: CSSOM wiring is the
  // Chromium-level assert). The rule is direction-agnostic — RTL needs no
  // mirror.
  const css = await page.evaluate(() => {
    const walk = (rules, acc) => {
      for (const rule of rules) {
        if (rule.cssRules) walk(rule.cssRules, acc);
        if (rule.selectorText?.includes('ui-slider::after')) acc.push(rule.cssText);
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

  expect(css).toContain('anchor(--ui-slider-thumb end)');
  // Lightning CSS may keep the merged shorthand — the inline-start leg of
  // it is the 0.
  expect(css).toMatch(/inset-inline:(\s*0 calc)|inset-inline-start:\s*0/);
  // The gray rail is the static ::before — anchor-independent; the fill
  // is the brand pair (the registered Progress nonText pair).
  const paint = await page.locator('#slider-default').evaluate((el) => {
    const w = el.parentElement;
    return {
      rail: getComputedStyle(w, '::before').backgroundColor,
      fill: getComputedStyle(w, '::after').backgroundColor,
    };
  });
  expect(paint.rail).toBe(await token(page, '--ui-color-surface-tint'));
  expect(paint.fill).toBe(await token(page, '--ui-color-brand'));
});

test('the fill follows the thumb (Chromium probe)', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'anchor on the thumb pseudo is probed in Chromium; other engines degrade (compatibility notes)',
  );

  const readFill = () =>
    page.locator('#slider-default').evaluate((el) => {
      const s = getComputedStyle(el.parentElement, '::after');
      return { right: parseFloat(s.right), left: parseFloat(s.left) };
    });

  await page.locator('#slider-default').evaluate((el) => {
    el.value = '0';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const atMin = await readFill();
  await page.locator('#slider-default').evaluate((el) => {
    el.value = '100';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const atMax = await readFill();

  // LTR: the fill hugs the inline-start (left) edge; its inline-end edge
  // tracks the thumb across the whole rail as the value moves.
  expect(atMin.left).toBe(0);
  expect(atMax.right).toBeLessThan(atMin.right);
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
      width: rect.width,
      height: rect.height,
    };
  });

  expect(box.writingMode).toBe('sideways-lr');
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

test('RTL needs no mirror: the logical fill serves both directions', async ({ page }) => {
  const readFill = () =>
    page.locator('#slider-default').evaluate((el) => {
      const s = getComputedStyle(el.parentElement, '::after');
      if (s.content === 'none') return null; // the anchor gate suppressed the fill
      return { left: parseFloat(s.left), right: parseFloat(s.right) };
    });

  const ltr = await readFill();
  test.skip(ltr === null, 'the anchor paint is not active in this engine');

  await page.evaluate(() => {
    document.documentElement.setAttribute('dir', 'rtl');
  });
  const rtl = await readFill();

  // The same declarations: the fill hugs the inline-start edge — left in
  // LTR, right in RTL.
  expect(ltr.left).toBe(0);
  expect(rtl.right).toBe(0);
  expect(rtl.left).toBeGreaterThan(0);
});

test('disabled: state-model opacity, native interaction refusal', async ({ page }) => {
  const el = page.locator('#slider-disabled');
  const styles = await el.evaluate((el) => ({
    // The opacity sits on the wrapper: the paint pseudos are siblings of
    // the input — the input's own opacity would not dim them.
    wrapperOpacity: getComputedStyle(el.parentElement).opacity,
    disabled: el.matches(':disabled'),
    cursor: getComputedStyle(el).cursor,
  }));

  expect(styles.disabled).toBe(true);
  expect(styles.wrapperOpacity).toBe('0.5');
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
