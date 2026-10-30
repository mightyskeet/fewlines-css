import { expect, test } from '@playwright/test';

/**
 * Menu behavior tests (tests/README.md).
 * Covers: declarative trigger, shell composition (Popover), Escape and
 * light dismiss, native close after action (Invoker Commands), focus with
 * autofocus, disabled/aria-disabled items.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('menu opens via declarative popovertarget and is a popover', async ({ page }) => {
  const menu = page.locator('#testMenu');
  await expect(menu).not.toBeVisible();

  await page.click('#menu-trigger');
  await expect(menu).toBeVisible();

  const isOpen = await menu.evaluate((el) => el.matches(':popover-open'));
  expect(isOpen).toBe(true);
});

test('autofocus moves focus to the first item on open', async ({ page }) => {
  await page.click('#menu-trigger');
  await expect(page.locator('#menu-item-rename')).toBeFocused();
});

test('menu item with command="hide-popover" closes the menu natively', async ({ page }) => {
  await page.click('#menu-trigger');
  await expect(page.locator('#testMenu')).toBeVisible();

  // Invoker Commands: the command runs and the click event still fires —
  // the host action hook keeps working without closing logic.
  const clicked = page.evaluate(
    () =>
      new Promise((resolve) => {
        document.querySelector('#menu-item-rename').addEventListener('click', () => resolve(true));
      }),
  );
  await page.click('#menu-item-rename');
  expect(await clicked).toBe(true);
  await expect(page.locator('#testMenu')).not.toBeVisible();
});

test('menu closes on Escape and light dismiss', async ({ page }) => {
  const menu = page.locator('#testMenu');
  await page.click('#menu-trigger');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).not.toBeVisible();

  await page.click('#menu-trigger');
  await expect(menu).toBeVisible();
  await page.mouse.click(10, 300);
  await expect(menu).not.toBeVisible();
});

test('disabled button is inert, aria-disabled link stays in the tab order', async ({ page }) => {
  await page.click('#menu-trigger');
  await expect(page.locator('#testMenu')).toBeVisible();
  await expect(page.locator('#menu-item-disabled')).toBeDisabled();

  // Focus starts on the first item (autofocus); Tab skips the disabled
  // button and reaches the attention item, then the aria-disabled link.
  await page.keyboard.press('Tab');
  await expect(page.locator('#menu-item-delete')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#menu-item-link')).toBeFocused();
});

test('menu shell composes with the popover: list reset, shell surface', async ({ page }) => {
  const styles = await page.locator('#testMenu').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      listStyleType: s.listStyleType,
      marginTop: s.marginTop,
      backgroundColor: s.backgroundColor,
    };
  });
  // UA list defaults reset; the shell keeps the popover surface.
  expect(styles.listStyleType).toBe('none');
  expect(styles.marginTop).toBe('0px');
  expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
});
