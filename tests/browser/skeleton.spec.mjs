import { expect, test } from '@playwright/test';

/**
 * Skeleton component tests.
 * The skeleton is a decorative placeholder: there is no native behavior to
 * exercise, so the contract under test is the paint (tint surface + shimmer
 * sweep), the host-driven geometry and the absence of interactive semantics
 * (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = async (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test('default paint: tint surface + shared shimmer sweep running', async ({ page }) => {
  const el = await page.locator('#skeleton-default').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      display: s.display,
      backgroundColor: s.backgroundColor,
      backgroundImage: s.backgroundImage,
      backgroundSize: s.backgroundSize,
      highlight: s.getPropertyValue('--ui-skeleton-highlight').trim(),
      animationName: s.animationName,
      animationDuration: s.animationDuration,
      animationPlayState: s.animationPlayState,
    };
  });

  expect(el.display).toBe('block');
  expect(el.backgroundColor).toBe(await token(page, '--ui-color-surface-tint'));
  // The shared band paint resolves on the element: 120deg lean (30deg from
  // vertical) with the local color mix inside.
  expect(el.backgroundImage).toContain('linear-gradient');
  expect(el.backgroundImage).toContain('120deg');
  expect(el.highlight).toContain('color-mix');
  // The band width is the unified fixed length, not a fraction of the area.
  expect(el.backgroundSize).toBe('96px 100%'); // --ui-shimmer-band: 6rem
  expect(el.animationName).toBe('ui-shimmer-sweep');
  expect(el.animationDuration).toBe('1.5s');
  expect(el.animationPlayState).toBe('running');
});

test('the sweep keyframes land the fixed band exactly off both edges (CSSOM)', async ({ page }) => {
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

  expect(frames.from).toContain('calc(-1 * var(--ui-shimmer-band))');
  expect(frames.to).toContain('calc(100% + var(--ui-shimmer-band))');
});

test('the sweep actually interpolates calc endpoints (probe, not a discrete flip)', async ({
  page,
}) => {
  // calc() mixing % and length must interpolate smoothly (CSS Values 4) —
  // if an engine cannot interpolate, background-position flips at 50%.
  const sample = () =>
    page.locator('#skeleton-default').evaluate((el) => getComputedStyle(el).backgroundPositionX);
  const first = await sample();
  await page.waitForTimeout(300);
  const second = await sample();

  expect(first).not.toBe(second);
});

test('reduced motion parks the sweep on the calm surface', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const el = await page.locator('#skeleton-default').evaluate((el) => {
    const s = getComputedStyle(el);
    return { animationName: s.animationName, backgroundImage: s.backgroundImage };
  });

  expect(el.animationName).toBe('none');
  expect(el.backgroundImage).toBe('none');
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
    return { inlineSize: s.inlineSize, blockSize: s.blockSize, radius: s.borderRadius, box };
  });

  expect(el.inlineSize).toBe('40px'); // 2.5rem resolved
  expect(el.blockSize).toBe('40px');
  // The host radius token survives (--ui-radius-full with the squircle
  // corner-shape override) and yields a square bounding circle.
  expect(el.radius).toBe('9999px');
  expect(el.box.width).toBe(el.box.height);
});

test('skeleton exposes no interactive semantics', async ({ page }) => {
  const skeleton = page.locator('#skeleton-default');
  await expect(skeleton).not.toHaveRole('button');
  await expect(skeleton).not.toHaveRole('link');
  expect(await skeleton.evaluate((el) => el.textContent.trim())).toBe('');
  const tabindex = await skeleton.evaluate((el) => el.getAttribute('tabindex'));
  expect(tabindex).toBeNull();
});
