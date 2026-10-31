import { expect, test } from '../fixtures/test.mjs';

/**
 * Fieldset component tests.
 * Fieldset is a static container: the contract under test is the UA-trap
 * resets (min-inline-size, margins), token-driven chrome, the flow stack
 * model (spacing comes from the existing .ui-field + * rule) and the
 * native group disabled propagation (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

test('frame uses the border/radius tokens', async ({ page }) => {
  const styles = await page.locator('#fieldset-basic').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      borderTopColor: s.borderTopColor,
      borderTopWidth: s.borderTopWidth,
      borderTopLeftRadius: s.borderTopLeftRadius,
    };
  });
  const radiusToken = await page.evaluate(() => {
    const p = document.createElement('div');
    p.style.borderRadius = 'var(--ui-radius-md)';
    document.body.appendChild(p);
    const v = getComputedStyle(p).borderTopLeftRadius;
    p.remove();
    return v;
  });
  expect(styles.borderTopColor).toBe(await token(page, '--ui-color-border'));
  expect(styles.borderTopWidth).toBe('1px');
  expect(styles.borderTopLeftRadius).toBe(radiusToken);
});

test('UA traps are reset: min-inline-size and margins', async ({ page }) => {
  const styles = await page.locator('#fieldset-basic').evaluate((el) => {
    const s = getComputedStyle(el);
    return { minWidth: s.minWidth, marginInlineStart: s.marginInlineStart };
  });
  expect(styles.minWidth).toBe('0px');
  expect(styles.marginInlineStart).toBe('0px');
});

test('legend is the chrome-text level (field-label parity)', async ({ page }) => {
  const styles = await page.locator('#fieldset-basic .ui-fieldset-legend').evaluate((el) => {
    const s = getComputedStyle(el);
    return { fontSize: s.fontSize, fontWeight: s.fontWeight, color: s.color };
  });
  // The legend is the group's label — same chrome-text level as
  // ui-field-label (sm step, 500).
  const label = await page
    .locator('#fieldset-basic .ui-field-label')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { fontSize: s.fontSize, fontWeight: s.fontWeight };
    });
  expect(styles.fontSize).toBe(label.fontSize);
  expect(styles.fontWeight).toBe('500');
  expect(styles.fontWeight).toBe(label.fontWeight);
  expect(styles.color).toBe(await token(page, '--ui-color-text'));
});

test('gap between legend and first member is the fieldset block-start padding', async ({
  page,
}) => {
  const gap = await page.locator('#fieldset-basic').evaluate((el) => {
    const legend = el.querySelector('legend').getBoundingClientRect();
    const first = el.querySelector('.ui-field').getBoundingClientRect();
    const padTop = Number.parseFloat(getComputedStyle(el).paddingBlockStart);
    return first.top - (legend.bottom + padTop);
  });
  expect(Math.abs(gap)).toBeLessThanOrEqual(1);
});

test('members stack with the existing .ui-field + * rule (no double spacing)', async ({ page }) => {
  const gap = await page.locator('#fieldset-basic').evaluate((el) => {
    const fields = el.querySelectorAll('.ui-field');
    const first = fields[0].getBoundingClientRect();
    const second = fields[1].getBoundingClientRect();
    return second.top - first.bottom;
  });
  const expected = await page
    .locator('#fieldset-basic .ui-field + .ui-field')
    .evaluate((el) => Number.parseFloat(getComputedStyle(el).marginBlockStart));
  expect(expected).toBeGreaterThan(0);
  expect(Math.abs(gap - expected)).toBeLessThanOrEqual(1);
});

test('fieldset[disabled] propagates to descendant controls natively', async ({ page }) => {
  // input.disabled reflects the content attribute; the group propagation is
  // the "actually disabled" state — the native :disabled selector matches it.
  const enabled = await page
    .locator('#fieldset-input-email')
    .evaluate((el) => el.matches(':disabled'));
  const disabled = await page
    .locator('#fieldset-input-disabled')
    .evaluate((el) => el.matches(':disabled'));
  expect(enabled).toBe(false);
  expect(disabled).toBe(true);
});

test('disabled group mutes the legend (fluent pair), enabled keeps full contrast', async ({
  page,
}) => {
  const enabledColor = await page
    .locator('#fieldset-basic .ui-fieldset-legend')
    .evaluate((el) => getComputedStyle(el).color);
  const disabledColor = await page
    .locator('#fieldset-disabled .ui-fieldset-legend')
    .evaluate((el) => getComputedStyle(el).color);
  expect(enabledColor).toBe(await token(page, '--ui-color-text'));
  expect(disabledColor).toBe(await token(page, '--ui-color-text-muted'));
});

test('frame follows the theme switch (light-dark token)', async ({ page }) => {
  const readBorder = () =>
    page.locator('#fieldset-basic').evaluate((el) => getComputedStyle(el).borderTopColor);

  await page.emulateMedia({ colorScheme: 'light' });
  const light = await readBorder();

  await page.emulateMedia({ colorScheme: 'dark' });
  const dark = await readBorder();

  expect(light).not.toBe(dark);
});

test('the group is exposed as role group with the legend as its name', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Contact' });
  await expect(group).toBeVisible();
});
