import { expect, test } from '../fixtures/test.mjs';

/**
 * Pagination component tests.
 * The contract under test: native links only (current page is a non-link
 * li), the aria-current="page" state painted as the filled pill, the
 * disabled edge as a native disabled button sharing the pill geometry,
 * the muted ellipsis, the chip pill geometry and the native
 * focus/hover/active model (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = async (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

/** Resolved (computed) value of a token against :root (fluid tokens). */
const probeToken = (page, name, prop) =>
  page.evaluate(
    ([n, p]) => {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;visibility:hidden;';
      probe.style.setProperty(p, `var(${n})`);
      document.body.append(probe);
      const v = getComputedStyle(probe).getPropertyValue(p).trim();
      probe.remove();
      return v;
    },
    [name, prop],
  );

test('the list owns the layout: no list chrome, wrapping flex row', async ({ page }) => {
  const list = await page.locator('#pagination-default ul').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      listStyle: s.listStyleType,
      margin: s.margin,
      padding: s.padding,
      display: s.display,
      flexWrap: s.flexWrap,
      alignItems: s.alignItems,
      gap: s.gap,
    };
  });
  expect(list.listStyle).toBe('none');
  expect(list.margin).toBe('0px');
  expect(list.padding).toBe('0px');
  expect(list.display).toBe('flex');
  expect(list.flexWrap).toBe('wrap');
  expect(list.alignItems).toBe('center');
  expect(list.gap).toBe('4px');
});

test('page links are chip pills: stadium box, sm type, no underline', async ({ page }) => {
  const link = await page.locator('#pagination-page1').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      minBlockSize: s.minBlockSize,
      minInlineSize: s.minInlineSize,
      borderRadius: s.borderRadius,
      fontSize: s.fontSize,
      textDecoration: s.textDecorationLine,
      color: s.color,
      background: s.backgroundColor,
    };
  });
  expect(link.minBlockSize).toBe('28px');
  expect(link.minInlineSize).toBe('28px');
  expect(link.borderRadius).toBe('9999px');
  expect(link.fontSize).toBe(await probeToken(page, '--ui-font-size-sm', 'font-size'));
  expect(link.textDecoration).toBe('none');
  expect(link.color).toBe(await token(page, '--ui-color-text'));
  expect(link.background).toBe('rgba(0, 0, 0, 0)');
});

test('the current page is the filled pill and is not a link', async ({ page }) => {
  const current = await page.locator('#pagination-current').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      color: s.color,
      background: s.backgroundColor,
      minBlockSize: s.minBlockSize,
    };
  });
  expect(current.color).toBe(await token(page, '--ui-color-on-brand'));
  expect(current.background).toBe(await token(page, '--ui-color-brand'));
  expect(current.minBlockSize).toBe('28px');

  // Not in the tab order: the current page is a non-link.
  await page.locator('#pagination-prev').focus();
  await page.keyboard.press('Tab'); // page 1
  await page.keyboard.press('Tab'); // page 3 — the current li is skipped
  await expect(page.locator('#pagination-current')).not.toBeFocused();
  await expect(page.locator('#pagination-page3')).toBeFocused();
});

test('the ellipsis is muted bare text; the disabled edge is a muted pill', async ({ page }) => {
  const muted = await token(page, '--ui-color-text-muted');

  const ellipsis = await page.locator('#pagination-ellipsis').evaluate((el) => {
    const s = getComputedStyle(el);
    return { color: s.color, minBlockSize: s.minBlockSize };
  });
  expect(ellipsis.color).toBe(muted);
  // Bare text entries get no pill box.
  expect(ellipsis.minBlockSize).not.toBe('28px');

  // The disabled edge keeps the pill geometry (the row stays steady) and
  // is muted with the mechanical cursor (the Chip disabled model).
  const disabledEdge = await page.locator('#pagination-disabled-prev').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      color: s.color,
      minBlockSize: s.minBlockSize,
      cursor: s.cursor,
      borderWidth: s.borderWidth,
      borderStyle: s.borderStyle,
    };
  });
  expect(disabledEdge.color).toBe(muted);
  expect(disabledEdge.minBlockSize).toBe('28px');
  expect(disabledEdge.cursor).toBe('not-allowed');
  // The UA button border is reset (color rides currentColor, width 0).
  expect(disabledEdge.borderWidth).toBe('0px');
  expect(disabledEdge.borderStyle).toBe('none');

  // Native disabled: not focusable, not in the tab order.
  await page.locator('#pagination-disabled-prev').focus();
  await expect(page.locator('#pagination-disabled-prev')).not.toBeFocused();

  // The ellipsis is hidden from assistive tech (visibility stays).
  await expect(page.locator('#pagination-ellipsis')).toHaveAttribute('aria-hidden', 'true');
});

test('hover fills the pill with the neutral hover token', async ({ page }) => {
  const background = () =>
    page.locator('#pagination-page1').evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.hover('#pagination-page1');
  // The 120ms fill transition — poll until it settles (the Chip precedent).
  await expect.poll(background, { timeout: 500 }).toBe(await token(page, '--ui-color-hover'));
});

test('press rule exists: fill + 1px shift (the Button state model)', async ({ page }) => {
  // :active is pointer-bound and cannot be scripted; the press response is
  // asserted via the rule presence in the CSSOM (the Progress fill
  // precedent: CSSOM checks for engine-bound states). Rules nest inside
  // @layer blocks — the walk recurses.
  const declarations = await page.evaluate(() => {
    const walk = (rules) => {
      for (const rule of rules) {
        if (rule.selectorText === '.ui-pagination a:active') {
          return { background: rule.style.background, translate: rule.style.translate };
        }
        if (rule.cssRules) {
          const found = walk(rule.cssRules);
          if (found) return found;
        }
      }
      return null;
    };
    for (const sheet of document.styleSheets) {
      try {
        const found = walk(sheet.cssRules);
        if (found) return found;
      } catch {
        // cross-origin sheet — skip
      }
    }
    return null;
  });
  expect(declarations?.background).toContain('var(--ui-pagination-hover)');
  // CSSOM normalizes `0` to `0px` in the serialized value.
  expect(declarations?.translate).toBe('0px 1px');
});

test('edge links carry rel and an accessible name; the landmark is named', async ({ page }) => {
  const prev = page.locator('#pagination-prev');
  const next = page.locator('#pagination-next');
  await expect(prev).toHaveAttribute('rel', 'prev');
  await expect(prev).toHaveAttribute('aria-label', 'Previous page');
  await expect(next).toHaveAttribute('rel', 'next');
  await expect(next).toHaveAttribute('aria-label', 'Next page');
  await expect(page.locator('#pagination-default')).toHaveAttribute('aria-label', 'Pagination');
});

test('edge glyphs are lifted optically, the pill does not grow', async ({ page }) => {
  // The sm size is a fluid token — the expectation is measured, not
  // hardcoded (the Breadcrumbs cap precedent).
  const smPx = () =>
    page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;visibility:hidden;font-size:var(--ui-font-size-sm);';
      document.body.append(probe);
      const px = parseFloat(getComputedStyle(probe).fontSize);
      probe.remove();
      return px;
    });

  const fontSizeOf = (id) =>
    page.locator(id).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

  const sm = await smPx();
  // The edge glyph rides 1.25 × the sm size (the lift token).
  expect(await fontSizeOf('#pagination-prev')).toBeCloseTo(sm * 1.25, 1);
  // A middle page link stays at the sm size.
  expect(await fontSizeOf('#pagination-page1')).toBeCloseTo(sm, 1);
  // The disabled edge lifts the same way.
  expect(await fontSizeOf('#pagination-disabled-prev')).toBeCloseTo(sm * 1.25, 1);
});

test('keyboard: links take the base focus ring', async ({ page }) => {
  await page.locator('#pagination-prev').focus();
  await page.keyboard.press('Tab'); // page 1
  const focused = await page.evaluate(() => document.activeElement.id);
  expect(focused).toBe('pagination-page1');
  const outline = await page
    .locator('#pagination-page1')
    .evaluate((el) => getComputedStyle(el).outlineColor);
  expect(outline).not.toBe('transparent');
  expect(outline).not.toBe('rgba(0, 0, 0, 0)');
});
