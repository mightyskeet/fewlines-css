import { expect, test } from '@playwright/test';

/**
 * Visual regression fixtures (PROJECT_SPEC.md, 15.3).
 * Representative states: default, hover, focus-visible, active, disabled,
 * open/closed overlays, light/dark, reduced motion.
 */

const themes = ['light', 'dark'];

for (const theme of themes) {
  test.describe(`theme: ${theme}`, () => {
    test.use({ colorScheme: theme });

    test.beforeEach(async ({ page }) => {
      await page.goto('/fixture.html');
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-theme', t);
      }, theme);
    });

    test(`buttons all states (${theme})`, async ({ page }) => {
      const section = page.locator('#buttons');
      await expect(section).toHaveScreenshot(`buttons-${theme}.png`);
    });

    test(`button hover state (${theme})`, async ({ page }) => {
      const btn = page.locator('#btn-primary');
      await btn.hover();
      await expect(page.locator('#buttons')).toHaveScreenshot(`buttons-hover-${theme}.png`);
    });

    test(`button focus-visible state (${theme})`, async ({ page }) => {
      await page.locator('#btn-secondary').focus();
      // :focus-visible applies on keyboard-like focus; force via keyboard nav
      await page.keyboard.press('Tab');
      await expect(page.locator('#buttons')).toHaveScreenshot(`buttons-focus-${theme}.png`);
    });

    test(`fields (${theme})`, async ({ page }) => {
      await expect(page.locator('#fields')).toHaveScreenshot(`fields-${theme}.png`);
    });

    test(`field invalid state (${theme})`, async ({ page }) => {
      const input = page.locator('#input-email');
      await input.fill('not-an-email');
      await page.click('#form-submit');
      await expect(page.locator('#fields')).toHaveScreenshot(`fields-invalid-${theme}.png`);
    });

    test(`accordions closed and open (${theme})`, async ({ page }) => {
      await page.click('#accordion-summary-first');
      await expect(page.locator('#accordions')).toHaveScreenshot(`accordions-${theme}.png`);
    });

    test(`alerts all variants (${theme})`, async ({ page }) => {
      await expect(page.locator('#alerts')).toHaveScreenshot(`alerts-${theme}.png`);
    });

    test(`badges all variants (${theme})`, async ({ page }) => {
      await expect(page.locator('#badges')).toHaveScreenshot(`badges-${theme}.png`);
    });

    test(`switches all states (${theme})`, async ({ page }) => {
      await expect(page.locator('#switches')).toHaveScreenshot(`switches-${theme}.png`);
    });

    test(`tables default, zebra and sticky (${theme})`, async ({ page }) => {
      await expect(page.locator('#tables')).toHaveScreenshot(`tables-${theme}.png`);
    });

    test(`base typography elements (${theme})`, async ({ page }) => {
      await expect(page.locator('#typography')).toHaveScreenshot(`typography-${theme}.png`);
    });
  });
}

test.describe('overlays', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/fixture.html');
  });

  test('dialog open (light)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.click('#dialog-open');
    await expect(page.locator('#testDialog')).toBeVisible();
    await expect(page).toHaveScreenshot('dialog-open-light.png');
  });

  test('dialog open (dark)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.click('#dialog-open');
    await expect(page.locator('#testDialog')).toBeVisible();
    await expect(page).toHaveScreenshot('dialog-open-dark.png');
  });

  test('popover open (light)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.click('#popover-trigger');
    await expect(page.locator('#testPopover')).toBeVisible();
    await expect(page).toHaveScreenshot('popover-open-light.png');
  });

  test('popover open (dark)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.click('#popover-trigger');
    await expect(page.locator('#testPopover')).toBeVisible();
    await expect(page).toHaveScreenshot('popover-open-dark.png');
  });

  test('tooltip open (light)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.hover('#tooltip-trigger');
    await expect(page.locator('#testTooltip')).toBeVisible();
    await expect(page).toHaveScreenshot('tooltip-open-light.png');
  });

  test('tooltip open (dark)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.hover('#tooltip-trigger');
    await expect(page.locator('#testTooltip')).toBeVisible();
    await expect(page).toHaveScreenshot('tooltip-open-dark.png');
  });

  test('drawer open (light)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.click('#drawer-trigger');
    await expect(page.locator('#testDrawer')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => getComputedStyle(document.querySelector('#testDrawer')).translate),
      )
      .toBe('none');
    await expect(page).toHaveScreenshot('drawer-open-light.png');
  });

  test('drawer open (dark)', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.click('#drawer-trigger');
    await expect(page.locator('#testDrawer')).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(() => getComputedStyle(document.querySelector('#testDrawer')).translate),
      )
      .toBe('none');
    await expect(page).toHaveScreenshot('drawer-open-dark.png');
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('dialog opens without transition artifacts', async ({ page }) => {
    await page.goto('/fixture.html');
    await page.click('#dialog-open');
    await expect(page.locator('#testDialog')).toBeVisible();

    const transition = await page.evaluate(
      () => getComputedStyle(document.querySelector('#testDialog')).transitionProperty,
    );
    expect(transition).toBe('none');
  });

  test('drawer opens without transition artifacts', async ({ page }) => {
    await page.goto('/fixture.html');
    await page.click('#drawer-trigger');
    await expect(page.locator('#testDrawer')).toBeVisible();

    const transition = await page.evaluate(
      () => getComputedStyle(document.querySelector('#testDrawer')).transitionProperty,
    );
    expect(transition).toBe('none');
  });
});
