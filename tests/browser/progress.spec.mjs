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

test('the fill rule for this engine carries the fill token (CSSOM wiring)', async ({
  page,
  browserName,
}) => {
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
        if (rule.selectorText?.includes(needle)) return rule.style.getPropertyValue('background');
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

test('painted fill: brand on the track (Firefox ::-moz-progress-bar)', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'firefox',
    '::-moz-progress-bar is Firefox-only; Chromium falls back to element styles (compatibility notes)',
  );

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

test('shimmer: gradient band + animation on the fill rule (CSSOM wiring)', async ({
  page,
  browserName,
}) => {
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

  expect(rule.selector).toContain(':not(:indeterminate)'); // no shimmer on the indeterminate sweep
  // The band paint moved to the shared shimmer module — the fill rule
  // carries only the shared gradient token; the color mix lives on the
  // element (--ui-shimmer-color) and resolves inside the pseudo.
  expect(rule.backgroundImage).toBe('var(--ui-shimmer-band-paint)');
  expect(rule.animation).toContain('ui-shimmer-sweep');
  expect(rule.animation).toContain('var(--ui-shimmer-duration)');

  const elementColor = await page.evaluate(() => {
    const walk = (rules) => {
      for (const rule of rules) {
        // The element-level color binding — no engine pseudo in the selector.
        if (
          rule.selectorText?.includes('data-shimmer') &&
          rule.selectorText.includes(':not(:indeterminate)') &&
          !rule.selectorText.includes('::-')
        )
          return rule.style.getPropertyValue('--ui-shimmer-color');
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
  expect(elementColor).toContain('color-mix');
});

test('shimmer keyframes sweep background-position without a dead pause', async ({ page }) => {
  const frames = await page.evaluate(() => {
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.name === 'ui-shimmer-sweep')
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

  // The proportional sweep: the 200% tile's transparent stop edges land
  // exactly on the box edges of the wide-flat fill target — no dead pause,
  // no loop pop (the shared shimmer module's contract).
  expect(frames.from).toContain('130%');
  expect(frames.to).toContain('-30%');
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

test('indeterminate: the component sweeps the fill (engine motion does not survive painting)', async ({
  page,
}) => {
  // Probe 2026-10-30 (compatibility notes): painted pseudos silence the
  // native indeterminate motion in all three engines — the bar renders
  // static 100% full. The component runs the sweep itself.
  const el = await page.locator('#progress-indeterminate').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      indeterminate: el.matches(':indeterminate'),
      animationName: s.animationName,
      animationDuration: s.animationDuration,
      backgroundColor: s.backgroundColor,
      backgroundImage: s.backgroundImage,
    };
  });

  expect(el.indeterminate).toBe(true);
  expect(el.animationName).toBe('ui-shimmer-sweep'); // Firefox carries the track on the element
  expect(el.animationDuration).toBe('1.5s');
  expect(el.backgroundColor).toBe(await token(page, '--ui-color-surface-tint'));
  expect(el.backgroundImage).toContain('linear-gradient');
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

test('reduced motion parks the indeterminate sweep as a static half bar', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const animationName = await page
    .locator('#progress-indeterminate')
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animationName).toBe('none');
});

test('circle: square ring element with conic paint and mask (element computed styles)', async ({
  page,
}) => {
  // Unlike the fill pseudos, the circle paints on the element itself —
  // computed styles are reachable in every engine.
  const el = await page.locator('#progress-circle').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      inlineSize: s.inlineSize,
      blockSize: s.blockSize,
      borderRadius: s.borderRadius,
      backgroundImage: s.backgroundImage,
      maskImage: s.maskImage,
      transitionProperty: s.transitionProperty,
    };
  });

  expect(el.inlineSize).toBe('40px'); // 2.5rem
  expect(el.blockSize).toBe('40px');
  expect(el.borderRadius).toBe('50%');
  expect(el.backgroundImage).toContain('conic-gradient');
  // The registered <number> resolves: the host-set inline value (70) drives
  // the arc — the dual-source contract (attribute + property) works.
  expect(el.backgroundImage).toContain('70%');
  // The painted end cap: a radial-gradient dot layer on top of the arc
  // (Chromium resolves the trig position to px; engines differ in
  // serialization — only the layer presence is pinned here).
  expect(el.backgroundImage.startsWith('radial-gradient(')).toBe(true);
  expect(el.backgroundImage).toContain('conic-gradient');
  expect(el.maskImage).toContain('radial-gradient');
  expect(el.transitionProperty).toContain('--ui-progress-value'); // @property-registered
});

test('circle: diameter steps sm 2rem / md 2.5rem / lg 3rem', async ({ page }) => {
  const sm = await page
    .locator('#progress-circle-sm')
    .evaluate((el) => getComputedStyle(el).inlineSize);
  const lg = await page
    .locator('#progress-circle-lg')
    .evaluate((el) => getComputedStyle(el).inlineSize);
  expect(sm).toBe('32px');
  expect(lg).toBe('48px');
});

test('circle: indeterminate spins the element', async ({ page }) => {
  const el = await page.locator('#progress-circle-indeterminate').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      indeterminate: el.matches(':indeterminate'),
      animationName: s.animationName,
      backgroundImage: s.backgroundImage,
    };
  });

  expect(el.indeterminate).toBe(true);
  expect(el.animationName).toBe('ui-progress-spin');
  expect(el.backgroundImage).toContain('conic-gradient'); // the arc redefinition
});

test('circle: --ui-progress-value registered as <number> (CSSOM @property)', async ({ page }) => {
  const prop = await page.evaluate(() => {
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.name === '--ui-progress-value')
          return { syntax: rule.syntax, inherits: rule.inherits };
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

  expect(prop.syntax).toBe('<number>');
  expect(prop.inherits).toBe(false);
});

test('circle: Chromium bar carries the conic (CSSOM wiring)', async ({ page, browserName }) => {
  test.skip(
    browserName !== 'chromium',
    '::-webkit-progress-bar is Chromium/WebKit paint; foreign-vendor rules are dropped elsewhere',
  );

  const background = await page.evaluate(() => {
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.cssRules) {
          const hit = walk(rule.cssRules);
          if (hit) return hit;
        }
        // The plain circle bar selector only — the indeterminate sweep rule
        // also mentions data-shape inside :not([data-shape='circle']). The
        // CSSOM keeps the author quotes: [data-shape="circle"].
        if (rule.selectorText?.includes('.ui-progress[data-shape="circle"]::-webkit-progress-bar'))
          return rule.style.getPropertyValue('background');
      }
      return null;
    };
    for (const sheet of document.styleSheets) {
      const hit = walk(sheet.cssRules);
      if (hit) return hit;
    }
    return null;
  });

  expect(background).toBe('var(--ui-progress-ring-paint)');
});

test('circle: reduced motion stops the spin and the value transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const el = await page.locator('#progress-circle-indeterminate').evaluate((el) => {
    const s = getComputedStyle(el);
    return { animationName: s.animationName, transitionDuration: s.transitionDuration };
  });

  expect(el.animationName).toBe('none');
  expect(el.transitionDuration).toBe('0s');
});

test('circle: forced colors drop the mask', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const maskImage = await page
    .locator('#progress-circle')
    .evaluate((el) => getComputedStyle(el).maskImage);
  expect(maskImage).toBe('none');
});
