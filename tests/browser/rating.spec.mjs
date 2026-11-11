import { expect, test } from '../fixtures/test.mjs';

/**
 * Rating component tests.
 * The contract under test: the native radio group (roles, names, keyboard,
 * fieldset[disabled]), the fill logic (checked star + every star before it
 * via forward-looking :has() — no direction trick, DOM order = visual
 * order), the two-layer SVG-mask paint, the pointer-gated hover preview and
 * the forced-colors model (references/rating.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = async (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

const fills = (page, group) =>
  page
    .locator(`#${group} .ui-rating-star`)
    .evaluateAll((stars) => stars.map((s) => getComputedStyle(s, '::after').opacity));

// The fill fades in (opacity transition) — the read must outlive it.
const settledFills = async (page, group, expected) => {
  await expect.poll(() => fills(page, group), { timeout: 2000 }).toEqual(expected);
};

test('native radio group: roles, names, keyboard', async ({ page }) => {
  const group = page.locator('#rating-default');
  await expect(group).toHaveRole('group');
  await expect(group).toHaveAccessibleName('Your rating');
  for (let i = 1; i <= 5; i++) {
    await expect(group.getByRole('radio', { name: `${i} star${i > 1 ? 's' : ''}` })).toHaveCount(1);
  }

  // Native keyboard: arrows step the selection, one star per step.
  await page.locator('#rating-default-1').focus();
  await page.keyboard.press('ArrowRight');
  expect(await page.locator('#rating-default-2').isChecked()).toBe(true);
  await page.keyboard.press('ArrowRight');
  expect(await page.locator('#rating-default-3').isChecked()).toBe(true);
});

test('fill: the checked star and every star before it', async ({ page }) => {
  // The user gesture is the click on the STAR (the label); the input under
  // it is invisible and Playwright defers to the hit-target label.
  await page.locator('#rating-default .ui-rating-star').nth(3).click();
  // The click toggles through the input covering the star — the fill must
  // land on labels 1..4, label 5 stays empty.
  await settledFills(page, 'rating-default', ['1', '1', '1', '1', '0']);
});

test('pre-selected fill without interaction', async ({ page }) => {
  expect(await fills(page, 'rating-checked')).toEqual(['1', '1', '1', '0', '0']);
});

test('hover preview: the hovered star and every star before it', async ({ page }) => {
  const stars = page.locator('#rating-default .ui-rating-star');
  await stars.nth(2).hover();
  await settledFills(page, 'rating-default', ['1', '1', '1', '0', '0']);

  // Moving the pointer away drops the preview — :hover state only.
  await page.locator('#rating-checked .ui-rating-legend').hover();
  await settledFills(page, 'rating-default', ['0', '0', '0', '0', '0']);
});

test('hover preview only adds fill below the selection', async ({ page }) => {
  // Pre-selected 3; hovering star 2 fills 1..2 (already filled) and must
  // NOT un-fill the checked stars 3..5 above the pointer.
  await page.locator('#rating-checked .ui-rating-star').nth(1).hover();
  await settledFills(page, 'rating-checked', ['1', '1', '1', '0', '0']);
});

test('no direction trick: the DOM order is the visual order (RTL)', async ({ page }) => {
  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  await page.locator('#rating-default .ui-rating-star').nth(1).click();

  // In RTL the first stars sit on the right; the fill still accumulates
  // from the first star — the same logical declarations serve both
  // directions.
  await settledFills(page, 'rating-default', ['1', '1', '0', '0', '0']);
});

test('paint: two SVG-mask layers, empty = surface-tint, filled = brand', async ({ page }) => {
  const paint = await page
    .locator('#rating-default .ui-rating-star')
    .first()
    .evaluate((el) => ({
      before: getComputedStyle(el, '::before').backgroundColor,
      after: getComputedStyle(el, '::after').backgroundColor,
      beforeMask: getComputedStyle(el, '::before').maskImage,
      afterMask: getComputedStyle(el, '::after').maskImage,
    }));

  expect(paint.before).toBe(await token(page, '--ui-color-surface-tint'));
  expect(paint.after).toBe(await token(page, '--ui-color-brand'));
  expect(paint.beforeMask).toContain('data:image/svg+xml');
  expect(paint.afterMask).toContain('data:image/svg+xml');
  // The two states differ in shape (WCAG 1.4.1): outline vs solid.
  expect(paint.beforeMask).toContain('stroke');
  expect(paint.afterMask).not.toContain('stroke');
});

test('stars touch: the hover path is continuous, rhythm is the neighbors model', async ({
  page,
}) => {
  // Adjacent star boxes share the edge — no gap between them (the
  // pretty-printed markup whitespace would render as a word space and
  // drop the hover preview mid-move). Geometry: computed, engine-honest.
  const touching = await page.locator('#rating-default .ui-rating-star').evaluateAll((stars) => {
    const rects = stars.map((s) => s.getBoundingClientRect());
    return rects[1].left - rects[0].right;
  });
  expect(touching).toBeCloseTo(0, 4);

  // The rhythm wiring (legend air = Field 3xs, stack = Fieldset/Field sm):
  // the space tokens are fluid — the rule stream is the stable assert (the
  // Slider precedent).
  const css = await page.evaluate(() => {
    const walk = (rules, acc) => {
      for (const rule of rules) {
        if (rule.cssRules) walk(rule.cssRules, acc);
        if (rule.selectorText?.includes('ui-rating')) acc.push(rule.cssText);
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
  expect(css).toContain('margin-block-end: var(--ui-space-3xs)');
  // The CSSOM serializes selectors engine-normalized — match the combinator
  // loosely.
  expect(css).toMatch(/ui-rating\s*\+\s*\.ui-rating/);
  expect(css).toContain('margin-block-start: var(--ui-space-sm)');
});

test('focus ring outlines the star natively (the base contract)', async ({ page }) => {
  // Land on the first radio by keyboard: the focus must be :focus-visible
  // and the shared ring paints on the input sitting over the star box.
  await page.locator('#choice-radio-2').focus();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement.id)).toBe('rating-default-1');

  const focus = await page.locator('#rating-default-1').evaluate((el) => {
    const s = getComputedStyle(el);
    return { visible: el.matches(':focus-visible'), color: s.outlineColor, width: s.outlineWidth };
  });
  expect(focus.visible).toBe(true);
  expect(focus.color).toBe(await token(page, '--ui-focus-ring'));
  expect(focus.width).toBe('2px');
});

test('disabled: native group disabling, state-model opacity', async ({ page }) => {
  const radio = page.locator('#rating-disabled input').first();
  const styles = await page
    .locator('#rating-disabled .ui-rating-star')
    .first()
    .evaluate((el) => ({
      opacity: getComputedStyle(el).opacity,
      cursor: getComputedStyle(el).cursor,
      disabled: el.querySelector('input').matches(':disabled'),
    }));

  expect(styles.disabled).toBe(true);
  expect(styles.opacity).toBe('0.5');
  expect(styles.cursor).toBe('not-allowed');

  // Native refusal: the value cannot change.
  await radio.click({ force: true });
  expect(await radio.isChecked()).toBe(false);
});

test('forced colors: the masked layers switch to system colors', async ({ page }) => {
  const readPaint = () =>
    page
      .locator('#rating-checked .ui-rating-star')
      .first()
      .evaluate((el) => ({
        before: getComputedStyle(el, '::before').backgroundColor,
        after: getComputedStyle(el, '::after').backgroundColor,
      }));

  const before = await readPaint();
  await page.emulateMedia({ forcedColors: 'active' });
  const forced = await readPaint();

  // Both layers take the system palette (not the semantic tokens, not
  // transparent): the outline stays visible on the forced Canvas, the fill
  // reads as Highlight. The resolved values are engine palette specific —
  // the contract is the replacement itself.
  expect(forced.before).not.toBe(before.before);
  expect(forced.before).not.toContain('rgba(0, 0, 0, 0)');
  expect(forced.after).not.toBe(before.after);
  expect(forced.after).not.toContain('rgba(0, 0, 0, 0)');
});

test('reduced motion disables the fill fade', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const duration = await page
    .locator('#rating-default .ui-rating-star')
    .first()
    .evaluate((el) => getComputedStyle(el, '::after').transitionDuration);
  expect(duration).toBe('0s');
});
