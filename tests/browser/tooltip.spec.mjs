import { expect, test } from '@playwright/test';

/**
 * Tooltip component tests (tests/README.md).
 * Canonical pair = interestfor only (native hover/focus activation); the click
 * stays the trigger's own action. The opt-in pair = popovertarget on an inert
 * trigger (documented host pattern, compatibility notes). Interest invokers
 * are Chromium/Edge-only (compatibility notes), so hover/focus tests are
 * gated on the IDL probe; the opt-in pair exercises the engine-independent
 * declarative click path.
 */

const hasInterestSupport = (page) =>
  page.evaluate(() => 'interestForElement' in HTMLButtonElement.prototype);

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

test('canonical pair opens on hover (interest invoker)', async ({ page }) => {
  test.skip(!(await hasInterestSupport(page)), 'interest invokers not supported');

  const tooltip = page.locator('#testTooltip');
  await expect(tooltip).not.toBeVisible();

  await page.hover('#tooltip-trigger');
  await expect(tooltip).toBeVisible();

  const isOpen = await tooltip.evaluate((el) => el.matches(':popover-open'));
  expect(isOpen).toBe(true);
});

test('canonical pair closes when interest is lost (pointer leaves)', async ({ page }) => {
  test.skip(!(await hasInterestSupport(page)), 'interest invokers not supported');

  await page.hover('#tooltip-trigger');
  await expect(page.locator('#testTooltip')).toBeVisible();

  await page.mouse.move(10, 300);
  await expect(page.locator('#testTooltip')).not.toBeVisible();
});

test('canonical pair opens on keyboard focus and closes on blur', async ({ page }) => {
  test.skip(!(await hasInterestSupport(page)), 'interest invokers not supported');

  const tooltip = page.locator('#testTooltip');
  await page.locator('#tooltip-trigger').focus();
  await expect(tooltip).toBeVisible();

  await page.mouse.click(10, 300);
  await expect(tooltip).not.toBeVisible();
});

test('hint popovers are exclusive: opening the second hint closes the first', async ({ page }) => {
  test.skip(!(await hasInterestSupport(page)), 'interest invokers not supported');

  await page.hover('#tooltip-trigger');
  await expect(page.locator('#testTooltip')).toBeVisible();

  // The opt-in pair is also a popover="hint": showing it (by click here)
  // must hide the previously shown hint popover.
  await page.click('#tooltip-fallback-trigger');
  await expect(page.locator('#testTooltip')).not.toBeVisible();
  await expect(page.locator('#testTooltipFallback')).toBeVisible();
});

test('click on the trigger does not dismiss the hover-opened tooltip', async ({ page }) => {
  test.skip(!(await hasInterestSupport(page)), 'interest invokers not supported');

  await page.hover('#tooltip-trigger');
  await expect(page.locator('#testTooltip')).toBeVisible();

  // No popovertarget on the canonical trigger: the click is free for the
  // trigger's action and does not dismiss the hint (probed 2026-10-02).
  await page.click('#tooltip-trigger');
  await expect(page.locator('#testTooltip')).toBeVisible();
});

test('tooltip is anchored below the trigger, visible and overlapping it', async ({ page }) => {
  await page.click('#tooltip-fallback-trigger');
  await expect(page.locator('#testTooltipFallback')).toBeVisible();

  // The entry transition starts 4px lower (@starting-style) — measure only
  // after it settles, otherwise the gap reads 8px on the first frame.
  await expect
    .poll(() =>
      page.evaluate(
        () => getComputedStyle(document.querySelector('#testTooltipFallback')).translate,
      ),
    )
    .toBe('none');

  const geometry = await page.evaluate(() => {
    const trigger = document.querySelector('#tooltip-fallback-trigger').getBoundingClientRect();
    const tooltip = document.querySelector('#testTooltipFallback').getBoundingClientRect();
    return {
      triggerBottom: trigger.bottom,
      tooltipTop: tooltip.top,
      overlap: Math.min(trigger.right, tooltip.right) - Math.max(trigger.left, tooltip.left),
      inViewport: tooltip.left >= 0 && tooltip.right <= window.innerWidth,
    };
  });

  // Below the trigger with the --ui-space-2xs (4px) gap (anchor placement).
  expect(geometry.tooltipTop).toBeGreaterThanOrEqual(geometry.triggerBottom);
  expect(geometry.tooltipTop - geometry.triggerBottom).toBeLessThan(8);
  // Inline axis: the engine centers on the anchor and shifts into the
  // viewport when the hint is wider than the trigger (narrow "?" trigger at
  // the page edge) — probed consistent in Chromium, Firefox, WebKit
  // (compatibility notes). Contract: overlaps the trigger, never clipped.
  expect(geometry.overlap).toBeGreaterThan(0);
  expect(geometry.inViewport).toBe(true);
});

test('opt-in pattern pair does not open on hover (no interestfor)', async ({ page }) => {
  test.skip(!(await hasInterestSupport(page)), 'interest invokers not supported');

  await page.hover('#tooltip-fallback-trigger');
  await expect(page.locator('#testTooltipFallback')).not.toBeVisible();
});

test('opt-in pattern pair opens via declarative popovertarget click', async ({ page }) => {
  const tooltip = page.locator('#testTooltipFallback');
  await expect(tooltip).not.toBeVisible();

  await page.click('#tooltip-fallback-trigger');
  await expect(tooltip).toBeVisible();

  const isOpen = await tooltip.evaluate((el) => el.matches(':popover-open'));
  expect(isOpen).toBe(true);
});

test('opt-in pattern pair closes on Escape natively', async ({ page }) => {
  await page.click('#tooltip-fallback-trigger');
  await expect(page.locator('#testTooltipFallback')).toBeVisible();

  await page.keyboard.press('Escape');
  // The popover API state is closed in every engine...
  const open = await page
    .locator('#testTooltipFallback')
    .evaluate((el) => el.matches(':popover-open'));
  expect(open).toBe(false);
  // ...in engines without interest the CSS fallback keeps the hint shown
  // while the pointer still rests on the trigger; moving the pointer away
  // dismisses it (compatibility notes, 2026-10-04).
  await page.mouse.move(10, 300);
  await expect(page.locator('#testTooltipFallback')).not.toBeVisible();
});

test('opt-in pattern pair closes on outside click (light dismiss)', async ({ page }) => {
  await page.click('#tooltip-fallback-trigger');
  await expect(page.locator('#testTooltipFallback')).toBeVisible();

  await page.mouse.click(10, 300);
  await expect(page.locator('#testTooltipFallback')).not.toBeVisible();
});

test('trigger is associated with the tooltip via aria-describedby', async ({ page }) => {
  await expect(page.locator('#tooltip-trigger')).toHaveAccessibleDescription('Saves your changes');
  await expect(page.locator('#tooltip-fallback-trigger')).toHaveAccessibleDescription(
    'Deletes the item permanently',
  );
});

test('tooltip is in top layer when open', async ({ page }) => {
  await page.click('#tooltip-fallback-trigger');

  const inTopLayer = await page.evaluate(() => {
    const tooltip = document.querySelector('#testTooltipFallback');
    return tooltip.matches(':popover-open') && getComputedStyle(tooltip).display !== 'none';
  });
  expect(inTopLayer).toBe(true);
});

test('tooltip follows the theme switch (light-dark tokens)', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.click('#tooltip-fallback-trigger');
  const light = await page
    .locator('#testTooltipFallback')
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.keyboard.press('Escape');

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.click('#tooltip-fallback-trigger');
  const dark = await page
    .locator('#testTooltipFallback')
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.keyboard.press('Escape');

  expect(light).not.toBe(dark);
});

const hasOverlaySupport = (page) => page.evaluate(() => CSS.supports('overlay', 'auto'));

test('tooltip animates in on open (entry transition)', async ({ page }) => {
  // The opt-in pair (declarative click) exercises the engine-independent
  // path. Arm before opening: transitionrun proves the entry is a real
  // transition from the @starting-style state.
  await page.evaluate(() => {
    window.__tipEntry = [];
    document
      .querySelector('#testTooltipFallback')
      .addEventListener('transitionrun', (e) => window.__tipEntry.push(e.propertyName));
  });

  await page.click('#tooltip-fallback-trigger');
  await expect(page.locator('#testTooltipFallback')).toBeVisible();

  await expect
    .poll(() => page.evaluate(() => window.__tipEntry))
    .toEqual(expect.arrayContaining(['translate', 'opacity']));
});

test('tooltip animates out on close (reverse transition)', async ({ page }) => {
  // Exit retention requires the overlay property: engines without it
  // (Firefox/WebKit) drop the tooltip from the top layer immediately and
  // create no exit transitions (probed 2026-10-03, compatibility notes).
  test.skip(!(await hasOverlaySupport(page)), 'overlay not supported: exit hides instantly');

  await page.click('#tooltip-fallback-trigger');
  await expect(page.locator('#testTooltipFallback')).toBeVisible();

  // Close only after the entry settles: closing within the first frames
  // leaves opacity/translate at their hidden values, so no reverse
  // transition runs for them (display/overlay still flip).
  await expect
    .poll(() =>
      page.evaluate(
        () => getComputedStyle(document.querySelector('#testTooltipFallback')).translate,
      ),
    )
    .toBe('none');

  await page.evaluate(() => {
    window.__tipExit = [];
    document
      .querySelector('#testTooltipFallback')
      .addEventListener('transitionrun', (e) => window.__tipExit.push(e.propertyName));
  });

  await page.keyboard.press('Escape');

  await expect
    .poll(() => page.evaluate(() => window.__tipExit))
    .toEqual(expect.arrayContaining(['translate', 'opacity']));

  await expect(page.locator('#testTooltipFallback')).not.toBeVisible();
});

/*
 * CSS-only activation fallback (compatibility notes, 2026-10-04): in
 * engines without interest invokers the hint opens on hover/focus as a
 * plain CSS-shown element (not :popover-open — Escape cannot close it;
 * the pointer leave/blur dismissal is the accepted trade-off). The gate
 * `@supports not selector(:interest-source)` mirrors interest invoker
 * support (probed: Chromium true, Firefox/WebKit false).
 */

const gateActive = (page) => page.evaluate(() => !CSS.supports('selector(:interest-source)'));

test('css fallback gate mirrors interest invoker support', async ({ page }) => {
  const [interest, gateOn] = await page.evaluate(() => [
    'interestForElement' in HTMLButtonElement.prototype,
    !CSS.supports('selector(:interest-source)'),
  ]);
  expect(gateOn).toBe(!interest);
});

test('fallback: hover opens the hint as a CSS-shown element', async ({ page }) => {
  test.skip(!(await gateActive(page)), 'interest supported: the native path covers hover');

  const tooltip = page.locator('#testTooltip');
  await page.hover('#tooltip-trigger');
  await expect(tooltip).toBeVisible();

  // Shown by CSS, not through the popover API: no :popover-open state,
  // therefore no Escape dismissal (accepted trade-off).
  const isOpenViaApi = await tooltip.evaluate((el) => el.matches(':popover-open'));
  expect(isOpenViaApi).toBe(false);

  await page.mouse.move(10, 300);
  await expect(tooltip).not.toBeVisible();
});

test('fallback: the bridge does not intercept clicks while the hint is closed', async ({
  page,
}) => {
  test.skip(!(await gateActive(page)), 'interest supported: the native path has no CSS bridge');

  // Bridge emitted only while a hint of the pair is open (audit 2026-10-15):
  // with the hint closed, the point below the trigger must not hit the
  // trigger; with the hint open (trigger hovered), the bridge holds it.
  const underTrigger = () =>
    page.evaluate(() => {
      const t = document.querySelector('#tooltip-trigger').getBoundingClientRect();
      const el = document.elementFromPoint(t.left + t.width / 2, t.bottom + 2);
      return el?.id ?? el?.tagName;
    });

  expect(await underTrigger()).not.toBe('tooltip-trigger');

  await page.hover('#tooltip-trigger');
  await expect(page.locator('#testTooltip')).toBeVisible();
  expect(await underTrigger()).toBe('tooltip-trigger');
});

test('fallback: the pointer can travel onto the hint (gap and body hold)', async ({ page }) => {
  test.skip(!(await gateActive(page)), 'interest supported: the native path covers hover');

  await page.hover('#tooltip-trigger');
  await expect(page.locator('#testTooltip')).toBeVisible();

  // Cross the placement gap onto the hint text: the bridge extends the
  // trigger's hover area and the transparent top border makes the gap
  // part of the hint's own hit box, so the hint must not close.
  const pts = await page.evaluate(() => {
    const t = document.querySelector('#tooltip-trigger').getBoundingClientRect();
    const h = document.querySelector('#testTooltip').getBoundingClientRect();
    return { x: t.left + t.width / 2, gapY: t.bottom + 2, hintY: h.top + h.height / 2 };
  });
  await page.mouse.move(pts.x, pts.gapY);
  await page.waitForTimeout(300);
  await expect(page.locator('#testTooltip')).toBeVisible();

  await page.mouse.move(pts.x, pts.hintY);
  await page.waitForTimeout(300);
  await expect(page.locator('#testTooltip')).toBeVisible();

  await page.mouse.move(10, 300);
  await expect(page.locator('#testTooltip')).not.toBeVisible();
});

test('fallback: keyboard focus opens the hint, blur closes it', async ({ page }) => {
  test.skip(!(await gateActive(page)), 'interest supported: the native path covers focus');

  const tooltip = page.locator('#testTooltip');
  await page.locator('#tooltip-trigger').focus();
  await expect(tooltip).toBeVisible();

  await page.evaluate(() => document.querySelector('#tooltip-trigger').blur());
  await expect(tooltip).not.toBeVisible();
});

test('fallback: Escape does not close the CSS-shown hint, pointer leave does', async ({ page }) => {
  test.skip(!(await gateActive(page)), 'interest supported: Escape closes the native popover');

  await page.hover('#tooltip-trigger');
  await expect(page.locator('#testTooltip')).toBeVisible();

  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  // Accepted trade-off: a CSS-shown hint is not :popover-open, Escape has
  // no effect; the pointer leave below is the dismissal path.
  await expect(page.locator('#testTooltip')).toBeVisible();

  await page.mouse.move(10, 300);
  await expect(page.locator('#testTooltip')).not.toBeVisible();
});

test('fallback: the shown hint is placed below the trigger (anchor works without top layer)', async ({
  page,
}) => {
  test.skip(!(await gateActive(page)), 'interest supported: the native path covers placement');

  await page.hover('#tooltip-trigger');
  await expect(page.locator('#testTooltip')).toBeVisible();

  // The entry transition starts from the hidden offset — measure the
  // settled geometry only.
  await expect
    .poll(() =>
      page.evaluate(() => getComputedStyle(document.querySelector('#testTooltip')).opacity),
    )
    .toBe('1');

  const geometry = await page.evaluate(() => {
    const trigger = document.querySelector('#tooltip-trigger').getBoundingClientRect();
    const tooltip = document.querySelector('#testTooltip').getBoundingClientRect();
    return {
      tooltipTop: tooltip.top,
      triggerBottom: trigger.bottom,
      overlap: Math.min(trigger.right, tooltip.right) - Math.max(trigger.left, tooltip.left),
      inViewport: tooltip.left >= 0 && tooltip.right <= window.innerWidth,
    };
  });

  // The fallback carries the gap as a transparent top border: the border
  // box touches the trigger, the visible background starts one --ui-space-2xs
  // lower — same geometry as the margin-based popover path.
  expect(geometry.tooltipTop).toBeGreaterThanOrEqual(geometry.triggerBottom - 1);
  expect(geometry.tooltipTop - geometry.triggerBottom).toBeLessThan(8);
  expect(geometry.overlap).toBeGreaterThan(0);
  expect(geometry.inViewport).toBe(true);
});
