import { expect, test } from '../fixtures/test.mjs';

/**
 * Chip component tests.
 * Chip is the interactive Badge: the Button state model (native hover,
 * press, disabled, focus) at the Badge color model. Checks: the variant
 * matrix, hover/press behavior, disabled handling and sizes
 * (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

const stylesOf = (page, id) =>
  page.locator(id).evaluate((el) => {
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, color: s.color };
  });

test('default variant is the brand pastel (brand-tint + brand)', async ({ page }) => {
  const styles = await stylesOf(page, '#chip-default');
  expect(styles.background).toBe(await token(page, '--ui-color-brand-tint'));
  expect(styles.color).toBe(await token(page, '--ui-color-brand'));
});

test('neutral pastel is the brand-independent gray pair', async ({ page }) => {
  const styles = await stylesOf(page, '#chip-neutral');
  expect(styles.background).toBe(await token(page, '--ui-color-surface-tint'));
  expect(styles.color).toBe(await token(page, '--ui-color-text'));
});

test('solid model uses the on-* text over the bare family tone', async ({ page }) => {
  const cases = [
    { id: 'chip-default-solid', surface: '--ui-color-brand', on: '--ui-color-on-brand' },
    { id: 'chip-neutral-solid', surface: '--ui-color-text', on: '--ui-color-surface' },
    { id: 'chip-attention-solid', surface: '--ui-color-attention', on: '--ui-color-on-attention' },
  ];
  for (const { id, surface, on } of cases) {
    const styles = await stylesOf(page, `#${id}`);
    expect(styles.background, id).toBe(await token(page, surface));
    expect(styles.color, id).toBe(await token(page, on));
  }
});

test('chips are native buttons that receive the pointer fill', async ({ page }) => {
  const chip = page.locator('#chip-default');
  await expect(chip).toHaveRole('button');
  // A click is possible natively; with the pointer still over the chip the
  // fill is the variant hover fill (press = hover fill, the Button model).
  await chip.click();
  await expect
    .poll(() => stylesOf(page, '#chip-default').then((s) => s.background), { timeout: 500 })
    .toBe(await token(page, '--ui-color-brand-tint-hover'));
});

test('hover lands on the variant hover fill and skips disabled', async ({ page }) => {
  const background = (id) => stylesOf(page, id).then((s) => s.background);

  const cases = [
    { id: '#chip-default', fill: '--ui-color-brand-tint-hover' },
    { id: '#chip-neutral', fill: '--ui-color-surface-tint-hover' },
    { id: '#chip-attention', fill: '--ui-color-attention-tint-hover' },
    { id: '#chip-default-solid', fill: '--ui-color-brand-hover' },
    { id: '#chip-neutral-solid', fill: '--ui-color-inverse-hover' },
    { id: '#chip-attention-solid', fill: '--ui-color-attention-hover' },
  ];
  for (const { id, fill } of cases) {
    await page.hover(id);
    await expect.poll(() => background(id), { timeout: 500 }).toBe(await token(page, fill));
  }

  // The disabled chip keeps its base surface under the pointer.
  const disabledIdle = await background('#chip-disabled');
  await page.hover('#chip-disabled', { force: true });
  expect(await background('#chip-disabled')).toBe(disabledIdle);
});

test('disabled renders at the shared opacity step', async ({ page }) => {
  const styles = await page.locator('#chip-disabled').evaluate((el) => {
    const s = getComputedStyle(el);
    return { opacity: s.opacity, cursor: s.cursor };
  });
  expect(styles.opacity).toBe('0.5');
  expect(styles.cursor).toBe('not-allowed');

  // aria-disabled covers the link twin (the Button rule).
  const link = await page.locator('#chip-link').evaluate((el) => getComputedStyle(el).opacity);
  expect(link).toBe('0.5');
});

test('sizes scale the pill monotonically (sm 24 < md 28 < lg 32)', async ({ page }) => {
  const heightOf = (id) =>
    page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().height);
  const sm = await heightOf('chip-sm');
  const md = await heightOf('chip-md');
  const lg = await heightOf('chip-lg');
  expect(sm).toBe(24);
  expect(md).toBe(28);
  expect(lg).toBe(32);
});
