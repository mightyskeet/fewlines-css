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

test('default paint: tint surface + shimmer sweep running', async ({ page }) => {
  const el = await page.locator('#skeleton-default').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      display: s.display,
      backgroundColor: s.backgroundColor,
      backgroundImage: s.backgroundImage,
      highlight: s.getPropertyValue('--ui-skeleton-highlight').trim(),
      animationName: s.animationName,
      animationDuration: s.animationDuration,
      animationPlayState: s.animationPlayState,
    };
  });

  expect(el.display).toBe('block');
  expect(el.backgroundColor).toBe(await token(page, '--ui-color-surface-tint'));
  expect(el.backgroundImage).toContain('linear-gradient');
  expect(el.highlight).toContain('color-mix');
  expect(el.animationName).toBe('ui-skeleton-sweep');
  expect(el.animationDuration).toBe('1.5s');
  expect(el.animationPlayState).toBe('running');
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
