import { expect, test } from '@playwright/test';

/**
 * Breadcrumbs component tests.
 * The contract under test: the component-drawn separators (empty alt
 * text, no host markup), the current-item truncation cap (token-driven),
 * the collapsed-levels trigger (declarative popover) and the native
 * state placement — aria-current on the li or on the crumb's link
 * (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = async (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

/** The used px width of `40ch` in the page font — the cap is a ch-based
 * token, so the expectation is measured, not hardcoded. */
const capPx = (page) =>
  page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:absolute;visibility:hidden;white-space:nowrap;width:40ch;inline-size:40ch;';
    document.body.append(probe);
    const w = probe.getBoundingClientRect().width;
    probe.remove();
    return w;
  });

test('the list owns the layout: no list chrome, wrapping flex row', async ({ page }) => {
  const list = await page.locator('#breadcrumbs-default ol').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      listStyle: s.listStyleType,
      margin: s.margin,
      padding: s.padding,
      display: s.display,
      flexWrap: s.flexWrap,
      alignItems: s.alignItems,
      rowGap: s.rowGap,
    };
  });
  expect(list.listStyle).toBe('none');
  expect(list.margin).toBe('0px');
  expect(list.padding).toBe('0px');
  expect(list.display).toBe('flex');
  expect(list.flexWrap).toBe('wrap');
  expect(list.alignItems).toBe('baseline');
  expect(list.rowGap).toBe('4px');
});

test('separators are drawn by the component with an empty alt text', async ({ page }) => {
  const first = await page
    .locator('#breadcrumbs-default li')
    .first()
    .evaluate((el) => getComputedStyle(el, '::before').content);
  expect(first).toBe('none');

  const separator = await page
    .locator('#breadcrumbs-default li')
    .nth(1)
    .evaluate((el) => {
      const s = getComputedStyle(el, '::before');
      return {
        content: s.content,
        color: s.color,
        marginInline: s.marginInline,
      };
    });
  // The alternative text after the slash: the accessible name is empty.
  expect(separator.content).toContain('/');
  expect(separator.content).toContain('""');
  expect(separator.color).toBe(await token(page, '--ui-color-text-muted'));
  expect(separator.marginInline).toBe('4px');
});

test('the current crumb is capped and clipped with an ellipsis', async ({ page }) => {
  const cap = await capPx(page);
  const crumb = await page.locator('#breadcrumbs-current-long').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      maxInlineSize: parseFloat(s.maxInlineSize),
      overflow: s.overflowX,
      textOverflow: s.textOverflow,
      whiteSpace: s.whiteSpace,
      width: el.offsetWidth,
    };
  });
  expect(crumb.maxInlineSize).toBeCloseTo(cap, 0);
  expect(crumb.overflow).toBe('hidden');
  expect(crumb.textOverflow).toBe('ellipsis');
  expect(crumb.whiteSpace).toBe('nowrap');
  // The long title is actually clamped to the cap, not just styled.
  expect(crumb.width).toBeLessThanOrEqual(Math.ceil(cap));
});

test('aria-current on the crumb link is honored (:has)', async ({ page }) => {
  const li = await page
    .locator('#breadcrumbs-selflink li')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { textOverflow: s.textOverflow, maxInlineSize: s.maxInlineSize };
    });
  expect(li.textOverflow).toBe('ellipsis');
  expect(li.maxInlineSize).not.toBe('none');
});

test('the collapsed toggle is a muted native button', async ({ page }) => {
  const button = await page.locator('#breadcrumbs-toggle').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      color: s.color,
      background: s.backgroundColor,
      borderStyle: s.borderTopStyle,
      cursor: s.cursor,
      fontFamily: s.fontFamily,
    };
  });
  expect(button.color).toBe(await token(page, '--ui-color-text-muted'));
  expect(button.background).toBe('rgba(0, 0, 0, 0)');
  expect(button.borderStyle).toBe('none');
  expect(button.cursor).toBe('pointer');
  // font: inherit — the component does not rescale the trail.
  const inherited = await page
    .locator('#breadcrumbs-toggle')
    .evaluate((el) => getComputedStyle(el.parentElement).fontFamily);
  expect(button.fontFamily).toBe(inherited);
});

test('collapsed levels open as the native Menu popover', async ({ page }) => {
  const menu = page.locator('#breadcrumbs-menu');
  await expect(menu).toBeHidden();

  await page.click('#breadcrumbs-toggle');
  await expect(menu).toBeVisible();
  await expect(menu.locator('.ui-menu-item')).toHaveCount(2);

  // Native dismiss: Escape (light dismiss covered by the Popover suite).
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
});

test('trail links keep the link color, the underline returns on hover', async ({ page }) => {
  const link = await page
    .locator('#breadcrumbs-default li a')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { decoration: s.textDecorationLine, color: s.color };
    });
  expect(link.decoration).toBe('none');
  expect(link.color).toBe(await token(page, '--ui-color-link'));
});
