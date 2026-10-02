import { expect, test } from '@playwright/test';

/**
 * Tooltip component tests (PROJECT_SPEC.md, 15.2).
 * Canonical pair = interestfor (native hover/focus activation) + popovertarget
 * (declarative click fallback). Interest invokers are Chromium/Edge-only
 * (compatibility notes), so hover/focus tests are gated on the IDL probe;
 * the click-fallback pair exercises the engine-independent declarative path.
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

  // The fallback pair is also a popover="hint": showing it (by click here)
  // must hide the previously shown hint popover.
  await page.click('#tooltip-fallback-trigger');
  await expect(page.locator('#testTooltip')).not.toBeVisible();
  await expect(page.locator('#testTooltipFallback')).toBeVisible();
});

test('click on the trigger does not close an open tooltip (popovertargetaction=show)', async ({
  page,
}) => {
  test.skip(!(await hasInterestSupport(page)), 'interest invokers not supported');

  await page.hover('#tooltip-trigger');
  await expect(page.locator('#testTooltip')).toBeVisible();

  await page.click('#tooltip-trigger');
  await expect(page.locator('#testTooltip')).toBeVisible();
});

test('tooltip is anchored below the trigger with a small gap', async ({ page }) => {
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

  const { triggerBottom, tooltipTop, centersDelta } = await page.evaluate(() => {
    const trigger = document.querySelector('#tooltip-fallback-trigger').getBoundingClientRect();
    const tooltip = document.querySelector('#testTooltipFallback').getBoundingClientRect();
    return {
      triggerBottom: trigger.bottom,
      tooltipTop: tooltip.top,
      centersDelta: Math.abs(trigger.left + trigger.width / 2 - (tooltip.left + tooltip.width / 2)),
    };
  });

  // Below the trigger with the --ui-space-2xs (4px) gap (anchor placement).
  expect(tooltipTop).toBeGreaterThanOrEqual(triggerBottom);
  expect(tooltipTop - triggerBottom).toBeLessThan(8);
  // Centered on the trigger in the inline axis (center position-area).
  expect(centersDelta).toBeLessThan(2);
});

test('fallback pair does not open on hover (no interestfor)', async ({ page }) => {
  test.skip(!(await hasInterestSupport(page)), 'interest invokers not supported');

  await page.hover('#tooltip-fallback-trigger');
  await expect(page.locator('#testTooltipFallback')).not.toBeVisible();
});

test('fallback pair opens via declarative popovertarget click', async ({ page }) => {
  const tooltip = page.locator('#testTooltipFallback');
  await expect(tooltip).not.toBeVisible();

  await page.click('#tooltip-fallback-trigger');
  await expect(tooltip).toBeVisible();

  const isOpen = await tooltip.evaluate((el) => el.matches(':popover-open'));
  expect(isOpen).toBe(true);
});

test('fallback pair closes on Escape natively', async ({ page }) => {
  await page.click('#tooltip-fallback-trigger');
  await expect(page.locator('#testTooltipFallback')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.locator('#testTooltipFallback')).not.toBeVisible();
});

test('fallback pair closes on outside click (light dismiss)', async ({ page }) => {
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
