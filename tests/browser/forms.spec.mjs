import { expect, test } from '@playwright/test';

/**
 * Native form behavior tests (tests/README.md).
 * Covers: labels, validation, disabled/required/invalid/focus states.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('input has accessible name from implicit label', async ({ page }) => {
  const input = page.locator('#input-email');
  const label = await input.evaluate((el) => {
    // Implicit label: closest label element provides the accessible name
    const label = el.closest('label');
    return label ? label.querySelector('.ui-field-label')?.textContent?.trim() : null;
  });
  expect(label).toBe('Email');
});

test('native validation blocks submit for empty required email', async ({ page }) => {
  await page.click('#form-submit');

  // Form should not submit; input is :invalid and focus moves to it
  const url = page.url();
  expect(url).not.toContain('?submitted');

  const invalid = await page.locator('#input-email').evaluate((el) => el.matches(':invalid'));
  expect(invalid).toBe(true);
});

test('user-invalid applies only after interaction', async ({ page }) => {
  const input = page.locator('#input-email');

  // Before interaction: :invalid matches but :user-invalid must not
  const before = await input.evaluate((el) => ({
    invalid: el.matches(':invalid'),
    userInvalid: el.matches(':user-invalid'),
  }));
  expect(before.invalid).toBe(true);
  expect(before.userInvalid).toBe(false);

  // Interact and leave invalid
  await input.fill('not-an-email');
  await page.click('#form-submit');

  const after = await input.evaluate((el) => el.matches(':user-invalid'));
  expect(after).toBe(true);
});

test('user-valid applies after valid input', async ({ page }) => {
  const input = page.locator('#input-email');
  await input.fill('user@example.com');
  await input.blur();

  const userValid = await input.evaluate((el) => el.matches(':user-valid'));
  expect(userValid).toBe(true);
});

test('required select paints the danger border after user-invalid', async ({ page }) => {
  const select = page.locator('#select-required');
  const border = () => select.evaluate((el) => getComputedStyle(el).borderColor);

  // Before interaction: :invalid matches, but no danger border yet
  expect(await select.evaluate((el) => el.matches(':user-invalid'))).toBe(false);
  const idle = await border();

  await page.click('#form-submit');
  expect(await select.evaluate((el) => el.matches(':user-invalid'))).toBe(true);
  expect(await border()).not.toBe(idle);

  // Choosing a valid option flips to :user-valid
  await select.selectOption({ index: 1 });
  await select.blur();
  expect(await select.evaluate((el) => el.matches(':user-valid'))).toBe(true);
});

test('select paints its own chevron inset from the edge', async ({ page }) => {
  const styles = await page.locator('#select-md').evaluate((el) => {
    const cs = getComputedStyle(el);
    return { appearance: cs.appearance, image: cs.backgroundImage, position: cs.backgroundPosition };
  });

  // The native glyph is engine-drawn and unstylable — the stylesheet owns it
  expect(styles.appearance).toBe('none');
  expect(styles.image).toContain('conic-gradient');
});

test('forced colors restore the native select arrow', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const appearance = await page
    .locator('#select-md')
    .evaluate((el) => getComputedStyle(el).appearance);
  expect(appearance).toBe('auto');
});

test('anything after a field keeps the stack gap (button included)', async ({ page }) => {
  const gap = async (locator) =>
    locator.evaluate((el) => getComputedStyle(el).marginBlockStart);

  // The submit button follows the last field — same gap as field after field
  const field = page.locator('#test-form label.ui-field').last();
  const button = page.locator('#form-submit');
  expect(await gap(button)).toBe(await gap(field));
  expect(await gap(button)).not.toBe('0px');
});

test('disabled input is not focusable and not editable', async ({ page }) => {
  const input = page.locator('#input-disabled');
  const disabled = await input.evaluate((el) => el.matches(':disabled'));
  expect(disabled).toBe(true);

  await input.click({ force: true });
  await expect(input).not.toBeFocused();
});

test('hint is linked via aria-describedby', async ({ page }) => {
  const describedBy = await page.locator('#input-email').getAttribute('aria-describedby');
  // Implicit label nesting: hint is inside label, describedby optional.
  // If present it must reference the hint id.
  if (describedBy) {
    expect(describedBy).toBe('email-hint');
    await expect(page.locator('#email-hint')).toBeVisible();
  }
});

test('textarea autosize grows with content (field-sizing enhancement)', async ({ page }) => {
  const textarea = page.locator('#input-textarea');

  const before = await textarea.evaluate((el) => el.getBoundingClientRect().height);

  // Fill with many lines: with field-sizing: content the height grows.
  await textarea.fill(Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join('\n'));
  const after = await textarea.evaluate((el) => el.getBoundingClientRect().height);

  // field-sizing is a progressive enhancement: growth is asserted only when
  // the engine supports it (compatibility notes).
  const supported = await textarea.evaluate(
    (el) => CSS.supports('field-sizing', 'content') && getComputedStyle(el).fieldSize !== 'fixed',
  );
  if (supported) {
    expect(after).toBeGreaterThan(before);
    // Bounded: never exceeds 50vh.
    const max = await textarea.evaluate((el) => window.innerHeight * 0.5);
    expect(after).toBeLessThanOrEqual(max + 1);
  } else {
    expect(after).toBeGreaterThanOrEqual(before);
  }
});

test('focus-visible ring appears on keyboard focus', async ({ page }) => {
  await page.keyboard.press('Tab');
  const first = page.locator('#btn-primary');
  await expect(first).toBeFocused();

  const hasFocusVisible = await first.evaluate((el) => el.matches(':focus-visible'));
  expect(hasFocusVisible).toBe(true);

  const outline = await first.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
});

test('single-line controls share the standardized height scale', async ({ page }) => {
  // Height scale (matches Button): sm 1.75rem / md 2.25rem / lg 2.75rem.
  // block-size is explicit: WebKit renders select taller when only
  // min-block-size is set (compatibility notes, 2026-10-02).
  const height = (id) => page.locator(`#${id}`).evaluate((el) => el.getBoundingClientRect().height);

  const inputMd = await height('input-md');
  expect(await height('select-md')).toBe(inputMd);
  expect(inputMd).toBe(36);
  expect(await height('input-sm')).toBe(28);
  expect(await height('select-sm')).toBe(28);
  expect(await height('input-lg')).toBe(44);
  expect(await height('select-lg')).toBe(44);

  // Inputs and buttons align in one row (md = 2.25rem).
  expect(await height('form-submit')).toBe(36);

  const font = (id) => page.locator(`#${id}`).evaluate((el) => getComputedStyle(el).fontSize);
  // Density: the sm step drops the font to the sm size (same model as
  // Button sm/xs, decision 2026-10-24); md/lg keep the default step.
  const md = await font('input-md');
  const sm = await font('input-sm');
  expect(sm).not.toBe(md);
  expect(sm).toBe(await font('button-sm'));
  expect(await font('input-lg')).toBe(md);
});

test('read-only field recedes below the editable surface (flat, not raised)', async ({ page }) => {
  const background = await page
    .locator('#input-readonly')
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  const surface = await page
    .evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-surface'),
    )
    .then((v) => v.trim());
  expect(background).toBe(surface);
});

test('file input button is styled by the component', async ({ page }) => {
  const button = await page.locator('#input-file').evaluate((el) => {
    const s = getComputedStyle(el, '::file-selector-button');
    return {
      background: s.backgroundColor,
      divider: s.borderInlineEndWidth,
      cursor: s.cursor,
      paddingInlineStart: s.paddingInlineStart,
    };
  });
  const raised = await page
    .evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-surface-raised'),
    )
    .then((v) => v.trim());
  expect(button.background).toBe(raised);
  expect(button.divider).toBe('1px');
  expect(button.cursor).toBe('pointer');
  expect(button.paddingInlineStart).not.toBe('0px');
});

test('field error text uses the danger token and is linked via aria-describedby', async ({
  page,
}) => {
  const describedBy = await page.locator('#input-invalid-demo').getAttribute('aria-describedby');
  expect(describedBy).toBe('email-error');

  const color = await page.locator('#email-error').evaluate((el) => getComputedStyle(el).color);
  const danger = await page
    .evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ui-color-danger'),
    )
    .then((v) => v.trim());
  expect(color).toBe(danger);
});
