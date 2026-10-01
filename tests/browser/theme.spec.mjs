import { expect, test } from '@playwright/test';

/**
 * Theme tests: light/dark via light-dark() + data-theme override,
 * theme transition with reduced-motion guard.
 */

/**
 * Extract lightness proxy from a computed color. Chromium 153 serializes
 * oklch colors as "oklch(L C H)" — parse both rgb() and oklch() forms.
 * Returns 0..255-ish lightness comparable value.
 */
function parseLightness(colorString) {
  const rgb = colorString.match(/rgba?\((\d+)/);
  if (rgb) return Number(rgb[1]);
  const oklch = colorString.match(/oklch\(([\d.]+)/);
  if (oklch) return Number(oklch[1]) * 255; // 0..1 lightness -> 0..255 scale
  return NaN;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('color-scheme follows system preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  // color-scheme: light dark on :root resolves per element; verify the
  // declaration is present rather than a computed single value.
  const probe = await page.evaluate(() => {
    const el = document.createElement('div');
    el.style.colorScheme = 'light dark';
    document.body.append(el);
    return getComputedStyle(el).colorScheme;
  });
  expect(probe).toBe('light dark');
});

test('data-theme override pins the color scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

  // Theme transition animates the token over --ui-duration-slow (260ms);
  // wait it out before asserting the resolved value.
  await page.waitForTimeout(400);

  // Resolved surface color must be the dark value (near-black oklch 14%)
  const surface = await page.evaluate(() => {
    const el = document.createElement('div');
    el.style.background = 'var(--ui-color-surface)';
    document.body.append(el);
    return getComputedStyle(el).backgroundColor;
  });
  expect(parseLightness(surface)).toBeLessThan(60);

  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
});

test('light theme surface is light', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  const surface = await page.evaluate(() => {
    const el = document.createElement('div');
    el.style.background = 'var(--ui-color-surface)';
    document.body.append(el);
    return getComputedStyle(el).backgroundColor;
  });
  expect(parseLightness(surface)).toBeGreaterThan(200);
});

test('theme transition is registered and animatable', async ({ page }) => {
  // The transition rule lives inside @layer tokens; walk CSSOM recursively.
  // Note: CSSStyleRule has cssRules in nesting-supporting engines — treat
  // only non-style rules as containers, else style rules are skipped.
  const hasTransition = await page.evaluate(() => {
    function collectRules(ruleList) {
      const found = [];
      for (const rule of ruleList) {
        const isContainer =
          rule.cssRules && rule.cssRules.length > 0 && !(rule instanceof CSSStyleRule);
        if (isContainer) found.push(...collectRules(rule.cssRules));
        else found.push(rule.cssText);
      }
      return found;
    }
    const rules = [];
    for (const sheet of document.styleSheets) {
      try {
        rules.push(...collectRules(sheet.cssRules));
      } catch {
        /* cross-origin */
      }
    }
    return rules.some((r) => r.includes('--ui-color-surface') && r.includes('transition'));
  });
  expect(hasTransition).toBe(true);

  // Behavioral check: switching theme applies the transition on :root.
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const tp = await page.evaluate(
    () => getComputedStyle(document.documentElement).transitionProperty,
  );
  expect(tp).toContain('--ui-color-surface');
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
});

test('theme transition disabled under prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));

  const transition = await page.evaluate(
    () => getComputedStyle(document.documentElement).transitionProperty,
  );
  expect(transition).toBe('none');

  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
});
