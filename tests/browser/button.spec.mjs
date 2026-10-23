import { expect, test } from '@playwright/test';

/**
 * Button state tests (tests/README.md).
 * Computed-style checks: the variant × appearance matrix, the borderless
 * filled model, and hover must not restyle disabled controls.
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

test('filled buttons carry no visible border', async ({ page }) => {
  const styles = await stylesOf(page, '#btn-neutral');
  expect(styles.borderColor).toBe('rgba(0, 0, 0, 0)');
  expect(styles.background).toBe(await token(page, '--ui-color-neutral-surface'));
  expect(styles.color).toBe(await token(page, '--ui-color-on-neutral'));
});

test('filled primary keeps the solid accent fill and on-accent text', async ({ page }) => {
  const styles = await stylesOf(page, '#btn-primary');
  expect(styles.background).toBe(await token(page, '--ui-color-accent-surface'));
  expect(styles.color).toBe(await token(page, '--ui-color-on-accent'));
  expect(styles.borderColor).toBe('rgba(0, 0, 0, 0)');
});

test('filled destructive keeps the solid danger fill and on-danger text', async ({ page }) => {
  const styles = await stylesOf(page, '#btn-destructive');
  expect(styles.background).toBe(await token(page, '--ui-color-danger-surface'));
  expect(styles.color).toBe(await token(page, '--ui-color-on-danger'));
  expect(styles.borderColor).toBe('rgba(0, 0, 0, 0)');
});

test('outline secondary is a bordered transparent button', async ({ page }) => {
  const styles = await stylesOf(page, '#btn-outline');
  expect(styles.background).toBe('rgba(0, 0, 0, 0)');
  expect(styles.borderColor).toBe(await token(page, '--ui-color-border'));
  expect(styles.color).toBe(await token(page, '--ui-color-text'));
});

test('outline primary uses the accent identity', async ({ page }) => {
  const styles = await stylesOf(page, '#btn-outline-primary');
  expect(styles.background).toBe('rgba(0, 0, 0, 0)');
  expect(styles.borderColor).toBe(await token(page, '--ui-color-accent'));
  expect(styles.color).toBe(await token(page, '--ui-color-accent-strong'));
});

test('outline destructive uses the danger identity', async ({ page }) => {
  const styles = await stylesOf(page, '#btn-outline-destructive');
  expect(styles.background).toBe('rgba(0, 0, 0, 0)');
  expect(styles.borderColor).toBe(await token(page, '--ui-color-danger'));
  expect(styles.color).toBe(await token(page, '--ui-color-danger-strong'));
});

test('hover does not restyle a disabled button', async ({ page }) => {
  const background = (id) =>
    page.locator(id).evaluate((el) => getComputedStyle(el).backgroundColor);

  // Control: hovering the enabled neutral button lands on the next family
  // step (poll: the fast background transition needs a frame or two)
  const hoverFill = await token(page, '--ui-color-neutral-strong');
  await page.hover('#btn-neutral');
  await expect.poll(() => background('#btn-neutral'), { timeout: 500 }).toBe(hoverFill);

  // The disabled button keeps its base surface under the pointer
  const disabledIdle = await background('#btn-disabled');
  await page.hover('#btn-disabled', { force: true });
  expect(await background('#btn-disabled')).toBe(disabledIdle);
});
