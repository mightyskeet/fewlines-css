import { expect, test } from '@playwright/test';

/**
 * Drawer component tests (PROJECT_SPEC.md, 15.2).
 * Native basis: popover="auto" + popovertarget — declarative open/close,
 * native Escape, light dismiss, top-layer, native autofocus. Non-modal by
 * contract: the page stays interactive while the drawer is open; the light
 * dismiss click also reaches the element underneath.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('drawer opens via declarative popovertarget click', async ({ page }) => {
  const drawer = page.locator('#testDrawer');
  await expect(drawer).not.toBeVisible();

  await page.click('#drawer-trigger');
  await expect(drawer).toBeVisible();

  const isOpen = await drawer.evaluate((el) => el.matches(':popover-open'));
  expect(isOpen).toBe(true);
});

test('drawer closes on Escape natively', async ({ page }) => {
  await page.click('#drawer-trigger');
  await expect(page.locator('#testDrawer')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('#testDrawer')).not.toBeVisible();
});

test('drawer closes on outside click (light dismiss)', async ({ page }) => {
  await page.click('#drawer-trigger');
  await expect(page.locator('#testDrawer')).toBeVisible();

  await page.mouse.click(40, 40);
  await expect(page.locator('#testDrawer')).not.toBeVisible();
});

test('drawer is non-modal: the click passes through to the page', async ({ page }) => {
  await page.click('#drawer-trigger');
  await expect(page.locator('#testDrawer')).toBeVisible();

  await page.click('#drawer-behind');
  await expect(page.locator('#testDrawer')).not.toBeVisible();

  const clicked = await page.locator('#drawer-behind').evaluate((el) => el.dataset.clicked);
  expect(clicked).toBe('true');
});

test('focus moves into the drawer on open (native autofocus)', async ({ page }) => {
  await page.click('#drawer-trigger');
  await expect(page.locator('#testDrawer')).toBeVisible();

  const activeId = await page.evaluate(() => document.activeElement?.id);
  expect(activeId).toBe('drawer-close');
});

test('drawer hides its close target via popovertargetaction="hide" without JS', async ({
  page,
}) => {
  await page.click('#drawer-trigger');
  await expect(page.locator('#testDrawer')).toBeVisible();

  await page.click('#drawer-close');
  await expect(page.locator('#testDrawer')).not.toBeVisible();
});

test('drawer is pinned to the inline-end edge at full height', async ({ page }) => {
  await page.click('#drawer-trigger');
  await expect(page.locator('#testDrawer')).toBeVisible();

  // The entry transition starts from translate(-100%) — measure only after
  // it settles, otherwise the geometry reads mid-animation.
  await expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.querySelector('#testDrawer')).translate),
    )
    .toBe('none');

  const geometry = await page.evaluate(() => {
    const rect = document.querySelector('#testDrawer').getBoundingClientRect();
    return {
      right: rect.right,
      top: rect.top,
      height: rect.height,
      inlineSize: rect.width,
      clientWidth: document.documentElement.clientWidth,
      clientHeight: document.documentElement.clientHeight,
    };
  });

  // Pinned to the inline-end edge, spanning the full viewport height.
  expect(geometry.right).toBe(geometry.clientWidth);
  expect(geometry.top).toBe(0);
  expect(geometry.height).toBeCloseTo(geometry.clientHeight, 0);
  // min(24rem, 100%): capped column on the wide test viewport.
  expect(geometry.inlineSize).toBe(24 * 16);
});

test('drawer has a dialog-like scrim backdrop by default', async ({ page }) => {
  await page.click('#drawer-trigger');
  await expect(page.locator('#testDrawer')).toBeVisible();

  // Read after the entry transition settles so the scrim opacity is final.
  await expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.querySelector('#testDrawer')).translate),
    )
    .toBe('none');

  const backdrop = await page
    .locator('#testDrawer')
    .evaluate((el) => getComputedStyle(el, '::backdrop'));

  // Scrim like dialog.css: color-mix over black — never transparent/absent,
  // fully opaque while open. Chromium serializes as oklch/rgba, WebKit as rgba.
  expect(backdrop.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(backdrop.backgroundColor).not.toBe('transparent');
  expect(Number(backdrop.opacity)).toBe(1);
});

test('drawer animates out on close (reverse transition)', async ({ page }) => {
  await page.click('#drawer-trigger');
  await expect(page.locator('#testDrawer')).toBeVisible();

  // Arm before closing: transitionrun proves the exit is a real transition
  // toward the hidden state (translate/opacity), not an instant display flip.
  // The events fire at the next rendering frame after hidePopover, so poll
  // for them instead of reading immediately after the click.
  await page.evaluate(() => {
    window.__drawerExit = [];
    document
      .querySelector('#testDrawer')
      .addEventListener('transitionrun', (e) => window.__drawerExit.push(e.propertyName));
  });

  await page.click('#drawer-close');

  await expect
    .poll(() => page.evaluate(() => window.__drawerExit))
    .toEqual(expect.arrayContaining(['translate', 'opacity']));

  await expect(page.locator('#testDrawer')).not.toBeVisible();
});

test('drawer-start variant (default) is pinned to the inline-start edge', async ({ page }) => {
  await page.click('#drawer-start-trigger');
  await expect(page.locator('#testDrawerStart')).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.querySelector('#testDrawerStart')).translate),
    )
    .toBe('none');

  const geometry = await page.evaluate(() => {
    const rect = document.querySelector('#testDrawerStart').getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top };
  });

  expect(geometry.left).toBe(0);
  expect(geometry.top).toBe(0);
});

test('drawer is in top layer when open', async ({ page }) => {
  await page.click('#drawer-trigger');
  await expect(page.locator('#testDrawer')).toBeVisible();

  const inTopLayer = await page.evaluate(() => {
    const drawer = document.querySelector('#testDrawer');
    return drawer.matches(':popover-open') && getComputedStyle(drawer).display !== 'none';
  });
  expect(inTopLayer).toBe(true);
});

test('drawer follows the theme switch (light-dark tokens)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.click('#drawer-trigger');
  const light = await page
    .locator('#testDrawer')
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.keyboard.press('Escape');

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.click('#drawer-trigger');
  const dark = await page
    .locator('#testDrawer')
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.keyboard.press('Escape');

  expect(light).not.toBe(dark);
});
