import { expect, test } from '@playwright/test';

/**
 * Button variant tests (tests/README.md).
 * Computed-style checks: the six-variant matrix (shadcn model), the
 * borderless filled model, and hover must not restyle disabled controls.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

const stylesOf = (page, id) =>
  page.locator(id).evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      background: s.backgroundColor,
      color: s.color,
      borderColor: s.borderTopColor,
    };
  });

test('default is the high-contrast inverted neutral fill', async ({ page }) => {
  const styles = await stylesOf(page, '#btn-neutral');
  expect(styles.background).toBe(await token(page, '--ui-color-neutral-surface'));
  expect(styles.color).toBe(await token(page, '--ui-color-on-neutral'));
  expect(styles.borderColor).toBe('rgba(0, 0, 0, 0)');
});

test('secondary is the muted soft fill with plain text', async ({ page }) => {
  const styles = await stylesOf(page, '#btn-secondary');
  expect(styles.background).toBe(await token(page, '--ui-color-secondary-surface'));
  expect(styles.color).toBe(await token(page, '--ui-color-text'));
  expect(styles.borderColor).toBe('rgba(0, 0, 0, 0)');
});

test('outline is a bordered transparent button', async ({ page }) => {
  const styles = await stylesOf(page, '#btn-outline');
  expect(styles.background).toBe('rgba(0, 0, 0, 0)');
  expect(styles.borderColor).toBe(await token(page, '--ui-color-border'));
  expect(styles.color).toBe(await token(page, '--ui-color-text'));
});

test('ghost is borderless and transparent', async ({ page }) => {
  const styles = await stylesOf(page, '#btn-ghost');
  expect(styles.background).toBe('rgba(0, 0, 0, 0)');
  expect(styles.borderColor).toBe('rgba(0, 0, 0, 0)');
  expect(styles.color).toBe(await token(page, '--ui-color-text'));
});

test('link is bare accent text', async ({ page }) => {
  const styles = await stylesOf(page, '#btn-link');
  expect(styles.background).toBe('rgba(0, 0, 0, 0)');
  expect(styles.color).toBe(await token(page, '--ui-color-accent'));
  expect(
    await page.locator('#btn-link').evaluate((el) => getComputedStyle(el).textDecorationLine),
  ).not.toBe('underline');
});

test('destructive is the solid danger fill', async ({ page }) => {
  const styles = await stylesOf(page, '#btn-destructive');
  expect(styles.background).toBe(await token(page, '--ui-color-danger-surface'));
  expect(styles.color).toBe(await token(page, '--ui-color-on-danger'));
  expect(styles.borderColor).toBe('rgba(0, 0, 0, 0)');
});

test('icon size renders a square button', async ({ page }) => {
  const box = await page
    .locator('#btn-icon')
    .evaluate((el) => ({ w: getComputedStyle(el).inlineSize, h: getComputedStyle(el).blockSize }));
  expect(box.w).toBe(box.h);
});

test('hover does not restyle a disabled button', async ({ page }) => {
  const background = (id) =>
    page.locator(id).evaluate((el) => getComputedStyle(el).backgroundColor);

  // Control: hovering the enabled default button lands on the next family
  // step (poll: the fast background transition needs a frame or two)
  const hoverFill = await token(page, '--ui-color-neutral-strong');
  await page.hover('#btn-neutral');
  await expect.poll(() => background('#btn-neutral'), { timeout: 500 }).toBe(hoverFill);

  // The disabled button keeps its base surface under the pointer
  const disabledIdle = await background('#btn-disabled');
  await page.hover('#btn-disabled', { force: true });
  expect(await background('#btn-disabled')).toBe(disabledIdle);
});
