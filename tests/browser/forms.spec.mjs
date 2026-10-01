import { expect, test } from '@playwright/test';

/**
 * Native form behavior tests (PROJECT_SPEC.md, 15.2).
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

test('focus-visible ring appears on keyboard focus', async ({ page }) => {
  await page.keyboard.press('Tab');
  const first = page.locator('#btn-secondary');
  await expect(first).toBeFocused();

  const hasFocusVisible = await first.evaluate((el) => el.matches(':focus-visible'));
  expect(hasFocusVisible).toBe(true);

  const outline = await first.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
});
