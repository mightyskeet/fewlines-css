import { expect, test } from '@playwright/test';

/**
 * Skeleton component tests.
 * The skeleton is a decorative placeholder: there is no native behavior to
 * exercise, so the contract under test is the paint (tint surface + skewed
 * shimmer band overlay), the host-driven geometry and the absence of
 * interactive semantics (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = async (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test('default paint: tint surface + skewed shimmer band overlay', async ({ page }) => {
  const el = await page.locator('#skeleton-default').evaluate((el) => {
    const s = getComputedStyle(el);
    const band = getComputedStyle(el, '::after');
    return {
      display: s.display,
      backgroundColor: s.backgroundColor,
      overflow: s.overflow,
      bandDisplay: band.display,
      bandBackground: band.backgroundImage,
      bandColor: s.getPropertyValue('--ui-shimmer-color').trim(),
      bandWidth: band.width,
      bandAnimation: band.animationName,
      bandDuration: band.animationDuration,
      bandPlayState: band.animationPlayState,
      elementBox: el.getBoundingClientRect(),
    };
  });
  const bandBox = await page
    .locator('#skeleton-default')
    .evaluate((el) => getComputedStyle(el, '::after').width);

  expect(el.display).toBe('block');
  expect(el.backgroundColor).toBe(await token(page, '--ui-color-surface-tint'));
  expect(el.overflow).toBe('hidden'); // the band clips at the box and its radius
  expect(el.bandDisplay).toBe('block');
  // The band's own soft gradient: horizontal axis, the lean comes from the
  // skew transform (geometry, not a tile-sliced diagonal gradient).
  expect(el.bandBackground).toContain('linear-gradient(90deg');
  expect(el.bandColor).toContain('color-mix'); // the shared color slot resolved
  // The band scales with the box: 40% of the element width.
  expect(parseFloat(bandBox)).toBeCloseTo(el.elementBox.width * 0.4, 1);
  expect(el.bandAnimation).toBe('ui-shimmer-slide');
  expect(el.bandDuration).toBe('1.5s');
  expect(el.bandPlayState).toBe('running');
});

test('the band carries the 30deg lean as a transform (CSSOM keyframes)', async ({ page }) => {
  const frames = await page.evaluate(() => {
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.name === 'ui-shimmer-slide')
          return {
            from: rule.findRule('from').style.transform,
            to: rule.findRule('to').style.transform,
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

  // The lean is part of the animated transform (one property carries both);
  // the endpoints assume the 40%-of-box band width.
  expect(frames.from).toContain('skewX(calc(var(--ui-shimmer-lean) * -1))');
  expect(frames.from).toContain('translateX(-110%)');
  expect(frames.to).toContain('translateX(260%)');
});

test('the slide actually interpolates (probe, not a discrete flip)', async ({ page }) => {
  const sample = () =>
    page.locator('#skeleton-default').evaluate((el) => getComputedStyle(el, '::after').transform);
  const first = await sample();
  await page.waitForTimeout(300);
  const second = await sample();

  expect(first).not.toBe(second);
});

test('the band color splits by theme: calmer in light, lifted in dark', async ({ page }) => {
  const bandColor = () =>
    page
      .locator('#skeleton-default')
      .evaluate((el) => getComputedStyle(el, '::after').backgroundImage);

  await page.emulateMedia({ colorScheme: 'light' });
  const light = await bandColor();
  await page.emulateMedia({ colorScheme: 'dark' });
  const dark = await bandColor();

  // Both resolve through the same mix formula with a different strength
  // (8% in light, 12% in dark) — the resolved colors must differ.
  expect(light).not.toBe(dark);
});

test('reduced motion removes the band', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const bandDisplay = await page
    .locator('#skeleton-default')
    .evaluate((el) => getComputedStyle(el, '::after').display);
  expect(bandDisplay).toBe('none');
});

test('forced colors drop the band, the box keeps the layout space', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const el = await page.locator('#skeleton-default').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      bandDisplay: getComputedStyle(el, '::after').display,
      box: el.getBoundingClientRect(),
    };
  });
  expect(el.bandDisplay).toBe('none');
  expect(el.box.height).toBeGreaterThan(0);
});

test('defaults fit a text line: full width, one em tall', async ({ page }) => {
  const el = await page.locator('#skeleton-default').evaluate((el) => {
    const s = getComputedStyle(el);
    const parent = getComputedStyle(el.parentElement);
    return {
      inlineSize: s.inlineSize,
      blockSize: s.blockSize,
      fontSize: s.fontSize,
      parentContentWidth:
        el.parentElement.clientWidth -
        parseFloat(parent.paddingLeft) -
        parseFloat(parent.paddingRight),
    };
  });

  expect(el.inlineSize).toBe(`${el.parentContentWidth}px`); // fills the measure
  expect(el.blockSize).toBe(el.fontSize); // block-size: 1em
});

test('geometry and shape are host-driven (avatar circle)', async ({ page }) => {
  const el = await page.locator('#skeleton-avatar').evaluate((el) => {
    const s = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return {
      inlineSize: s.inlineSize,
      blockSize: s.blockSize,
      radius: s.borderRadius,
      box,
      // The band floor (2.5rem) widens the stripe on small shapes; the 75%
      // cap keeps it a traveling stripe, not a full-surface pulse.
      bandWidth: getComputedStyle(el, '::after').width,
    };
  });

  expect(el.inlineSize).toBe('40px'); // 2.5rem resolved
  expect(el.blockSize).toBe('40px');
  // The host radius token survives (--ui-radius-full with the squircle
  // corner-shape override) and yields a square bounding circle.
  expect(el.radius).toBe('9999px');
  expect(el.box.width).toBe(el.box.height);
  expect(parseFloat(el.bandWidth)).toBeCloseTo(30, 1); // 75% of the 40px box
});

test('skeleton exposes no interactive semantics', async ({ page }) => {
  const skeleton = page.locator('#skeleton-default');
  await expect(skeleton).not.toHaveRole('button');
  await expect(skeleton).not.toHaveRole('link');
  expect(await skeleton.evaluate((el) => el.textContent.trim())).toBe('');
  const tabindex = await skeleton.evaluate((el) => el.getAttribute('tabindex'));
  expect(tabindex).toBeNull();
});
