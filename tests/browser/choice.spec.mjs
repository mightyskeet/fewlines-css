import { expect, test } from '@playwright/test';

/**
 * Choice component tests (checkbox + radio).
 * The controls are native inputs: the contract under test is the token-driven
 * checked/unchecked paint, the mark visibility model (stroke geometry, not
 * opacity), native states (:checked, :indeterminate, :user-invalid,
 * fieldset[disabled] propagation) and the stack rule (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

const probe = (page, style) =>
  page.evaluate((s) => {
    const p = document.createElement('div');
    p.style.cssText = s;
    document.body.appendChild(p);
    const v = getComputedStyle(p);
    const out = { background: v.backgroundColor };
    p.remove();
    return out;
  }, style);

test('frame and fill use tokens: raised surface unchecked, brand checked', async ({ page }) => {
  const unchecked = await page.locator('#choice-checkbox').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      background: s.backgroundColor,
      borderColor: s.borderTopColor,
      width: s.width,
      appearance: s.appearance,
    };
  });
  const checked = await page.locator('#choice-checkbox-checked').evaluate((el) => {
    const s = getComputedStyle(el);
    return { background: s.backgroundColor, borderColor: s.borderTopColor };
  });

  const raised = await probe(page, 'background: var(--ui-color-surface-raised)');
  const brand = await probe(page, 'background: var(--ui-color-brand)');

  expect(unchecked.appearance).toBe('none');
  expect(unchecked.background).toBe(raised.background);
  expect(unchecked.borderColor).toBe(await token(page, '--ui-color-border'));
  expect(unchecked.width).toBe('20px');
  expect(checked.background).toBe(brand.background);
  expect(checked.borderColor === 'transparent' || checked.borderColor === 'rgba(0, 0, 0, 0)').toBe(
    true,
  );
});

test('check mark is the mask-shaped SVG path: hidden unchecked, painted checked', async ({
  page,
}) => {
  const read = (id) =>
    page.locator(id).evaluate((el) => {
      const s = getComputedStyle(el, '::before');
      return {
        opacity: Number.parseFloat(s.opacity),
        mask: s.maskImage || s.webkitMaskImage || '',
      };
    });

  const unchecked = await read('#choice-checkbox');
  expect(unchecked.mask).toContain('data:image/svg+xml');
  expect(unchecked.opacity).toBe(0);

  const checked = await read('#choice-checkbox-checked');
  expect(checked.opacity).toBe(1);
});

test('indeterminate draws the dash, not the check', async ({ page }) => {
  // :indeterminate has no HTML attribute — the host sets the property.
  await page.locator('#choice-checkbox').evaluate((el) => {
    el.indeterminate = true;
  });

  // The fill and the dash both transition in (fast token) — let them settle.
  await page.waitForTimeout(250);

  const styles = await page.locator('#choice-checkbox').evaluate((el) => {
    const before = getComputedStyle(el, '::before');
    return {
      background: getComputedStyle(el).backgroundColor,
      dashOpacity: Number.parseFloat(before.opacity),
      mask: before.maskImage || before.webkitMaskImage || '',
    };
  });
  const brand = await probe(page, 'background: var(--ui-color-brand)');

  expect(styles.background).toBe(brand.background);
  expect(styles.dashOpacity).toBe(1);
  expect(styles.mask).toBe('none');
});

test('radio: one of the group paints brand, the siblings stay neutral', async ({ page }) => {
  // The dot is opacity-driven (the checkbox mark is geometry-driven).
  const first = await page.locator('#choice-radio-1').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      background: s.backgroundColor,
      dot: Number.parseFloat(getComputedStyle(el, '::before').opacity),
    };
  });
  const second = await page.locator('#choice-radio-2').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      background: s.backgroundColor,
      dot: Number.parseFloat(getComputedStyle(el, '::before').opacity),
    };
  });
  const brand = await probe(page, 'background: var(--ui-color-brand)');
  const raised = await probe(page, 'background: var(--ui-color-surface-raised)');

  expect(first.background).toBe(brand.background);
  expect(first.dot).toBe(1);
  expect(second.background).toBe(raised.background);
  expect(second.dot).toBe(0);
});

test('user-invalid paints the attention border only after interaction', async ({ page }) => {
  const input = page.locator('#choice-checkbox-required');
  const borderColor = () => input.evaluate((el) => getComputedStyle(el).borderTopColor);

  // Required and unchecked, but untouched: neutral border.
  expect(await borderColor()).toBe(await token(page, '--ui-color-border'));

  // Interact: check then uncheck -> user-invalid without being user-valid.
  // Tab moves focus (a real interaction signal for engines that apply the
  // state on blur); the border-color transition (120ms) must settle before
  // the color is read.
  await input.click();
  await input.click();
  await page.keyboard.press('Tab');
  const attention = await token(page, '--ui-color-attention');
  await expect
    .poll(() => input.evaluate((el) => getComputedStyle(el).borderTopColor), { timeout: 1000 })
    .toBe(attention);
  expect(await input.evaluate((el) => el.matches(':user-invalid'))).toBe(true);
});

test('fieldset[disabled] reaches the controls natively', async ({ page }) => {
  const disabled = await page
    .locator('#choice-checkbox-group')
    .evaluate((el) => el.matches(':disabled'));
  const standalone = await page
    .locator('#choice-checkbox')
    .evaluate((el) => el.matches(':disabled'));
  expect(disabled).toBe(true);
  expect(standalone).toBe(false);
});

test('members stack with the sibling rule (no manual margins)', async ({ page }) => {
  const gap = await page.locator('#choices').evaluate((section) => {
    const fields = section.querySelectorAll(':scope > .ui-choice-field');
    const first = fields[0].getBoundingClientRect();
    const second = fields[1].getBoundingClientRect();
    return second.top - first.bottom;
  });
  const expected = await page
    .locator('#choices .ui-choice-field + .ui-choice-field')
    .first()
    .evaluate((el) => Number.parseFloat(getComputedStyle(el).marginBlockStart));
  expect(expected).toBeGreaterThan(0);
  expect(Math.abs(gap - expected)).toBeLessThanOrEqual(1);
});

test('controls keep their native roles and names', async ({ page }) => {
  const section = page.locator('#choices');
  await expect(section.getByRole('checkbox', { name: 'Email notifications' })).toHaveCount(1);
  await expect(section.getByRole('radio', { name: 'Standard' })).toHaveCount(1);
});

test('paint follows the theme switch (light-dark tokens)', async ({ page }) => {
  const readBg = () =>
    page.locator('#choice-checkbox-checked').evaluate((el) => getComputedStyle(el).backgroundColor);

  await page.emulateMedia({ colorScheme: 'light' });
  const light = await readBg();

  await page.emulateMedia({ colorScheme: 'dark' });
  const dark = await readBg();

  expect(light).not.toBe(dark);
});
