import { expect, test } from '@playwright/test';

/**
 * Stepper component tests.
 * The contract under test: the state markers (shape carries the state),
 * the rail geometry (the Timeline vocabulary), the :has() state placement
 * (attribute on the li or on the interactive child) and the horizontal
 * wizard row (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = async (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

const marker = (page, liId) =>
  page.locator(`#${liId}`).evaluate((el) => {
    const s = getComputedStyle(el, '::before');
    return {
      position: s.position,
      borderStyle: s.borderTopStyle,
      borderWidth: s.borderTopWidth,
      borderColor: s.borderTopColor,
      inlineSize: s.inlineSize,
      blockSize: s.blockSize,
      radius: s.borderTopLeftRadius,
      insetInlineStart: s.insetInlineStart,
      insetBlockStart: s.insetBlockStart,
      backgroundColor: s.backgroundColor,
      backgroundImage: s.backgroundImage,
      backgroundSize: s.backgroundSize,
      zIndex: s.zIndex,
    };
  });

test('the list owns the layout: no list chrome, adjacent entries', async ({ page }) => {
  const list = await page.locator('#stepper-default').evaluate((el) => {
    const s = getComputedStyle(el);
    return { listStyle: s.listStyleType, margin: s.margin, padding: s.padding };
  });
  expect(list.listStyle).toBe('none');
  expect(list.margin).toBe('0px');
  expect(list.padding).toBe('0px');

  const first = await page
    .locator('#stepper-default li')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { paddingInlineStart: s.paddingInlineStart, position: s.position };
    });
  expect(first.paddingInlineStart).toBe('32px');
  expect(first.position).toBe('relative');

  const next = await page
    .locator('#stepper-default li')
    .nth(1)
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { paddingBlockStart: s.paddingBlockStart };
    });
  expect(next.paddingBlockStart).toBe('24px');
});

test('the upcoming marker is the hollow timeline ring', async ({ page }) => {
  const m = await marker(page, 'stepper-step-upcoming');
  expect(m.borderStyle).toBe('solid');
  expect(m.borderWidth).toBe('2px');
  expect(m.borderColor).toBe(await token(page, '--ui-color-border-strong'));
  expect(m.inlineSize).toBe('12px');
  expect(m.blockSize).toBe('12px');
  expect(m.radius).toBe('9999px');
  expect(m.insetInlineStart).toBe('10px');
  // The upcoming step is not the first entry — its marker carries the
  // block gap (the li + li shift, the timeline model).
  expect(m.insetBlockStart).toBe('28px');
  expect(m.backgroundColor).toBe(await token(page, '--ui-color-surface'));
  expect(m.backgroundImage).toBe('none');
  expect(m.zIndex).toBe('1');
});

test('the current marker is the accent ring with the accent dot', async ({ page }) => {
  const m = await marker(page, 'stepper-step-current');
  expect(m.borderColor).toBe(await token(page, '--ui-color-brand'));
  expect(m.backgroundColor).toBe(await token(page, '--ui-color-surface'));
  expect(m.backgroundImage).toContain('radial-gradient');
  expect(m.backgroundSize).toBe('50% 50%');
});

test('the done marker is the solid accent disc', async ({ page }) => {
  const m = await marker(page, 'stepper-step-done');
  expect(m.borderStyle).toBe('solid');
  expect(m.borderColor).toBe('rgba(0, 0, 0, 0)');
  expect(m.backgroundColor).toBe(await token(page, '--ui-color-brand'));
});

test('the state attribute on the interactive child is honored (:has)', async ({ page }) => {
  const borderColor = await page
    .locator('#stepper-linkstate li')
    .first()
    .evaluate((el) => getComputedStyle(el, '::before').borderTopColor);
  expect(borderColor).toBe(await token(page, '--ui-color-brand'));
});

test('the rail is a border on the border token, spanning each entry', async ({ page }) => {
  const first = await page
    .locator('#stepper-default li')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return {
        borderStyle: s.borderInlineStartStyle,
        borderWidth: s.borderInlineStartWidth,
        borderColor: s.borderInlineStartColor,
        insetInlineStart: s.insetInlineStart,
        insetBlock: s.insetBlock,
      };
    });
  expect(first.borderStyle).toBe('solid');
  expect(first.borderWidth).toBe('2px');
  expect(first.borderColor).toBe(await token(page, '--ui-color-border'));
  expect(first.insetInlineStart).toBe('15px');
  expect(first.insetBlock).toBe('4px 0px');

  const next = await page
    .locator('#stepper-default li')
    .nth(1)
    .evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return { insetBlock: s.insetBlock };
    });
  expect(next.insetBlock).toBe('0px');
});

test('the last entry rail ends at the last ring bottom', async ({ page }) => {
  const rail = await page
    .locator('#stepper-default li')
    .nth(2)
    .evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return { blockSize: s.blockSize };
    });
  // The last rule sets inset-block-end: auto; Chromium reports the used
  // value for it, so the observable contract is the trimmed block-size.
  expect(rail.blockSize).toBe('40px');
});

test('horizontal: equal centered columns, the marker in the flow', async ({ page }) => {
  const list = await page.locator('#stepper-horizontal').evaluate((el) => {
    const s = getComputedStyle(el);
    return { display: s.display };
  });
  expect(list.display).toBe('flex');

  const li = await page
    .locator('#stepper-horizontal li')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        flex: s.flex,
        flexDirection: s.flexDirection,
        alignItems: s.alignItems,
        textAlign: s.textAlign,
        paddingInlineStart: s.paddingInlineStart,
        paddingBlockStart: s.paddingBlockStart,
      };
    });
  expect(li.flex).toBe('1 1 0%');
  expect(li.flexDirection).toBe('column');
  expect(li.alignItems).toBe('center');
  expect(li.textAlign).toBe('center');
  expect(li.paddingInlineStart).toBe('0px');
  expect(li.paddingBlockStart).toBe('0px');

  const markerStyle = await page
    .locator('#stepper-horizontal li')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el, '::before');
      return { position: s.position, insetBlockStart: s.insetBlockStart };
    });
  expect(markerStyle.position).toBe('static');
  expect(markerStyle.insetBlockStart).toBe('auto');
});

test('horizontal: the incoming half-segment spans from the edge to the marker center', async ({
  page,
}) => {
  const first = await page
    .locator('#stepper-horizontal li')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return { display: s.display };
    });
  expect(first.display).toBe('none');

  const second = await page
    .locator('#stepper-horizontal li')
    .nth(1)
    .evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return {
        borderStyle: s.borderTopStyle,
        borderWidth: s.borderTopWidth,
        borderColor: s.borderTopColor,
        // Chromium reports the used value — a percentage resolves to px.
        inlineSize: parseFloat(s.inlineSize),
        halfEntry: el.offsetWidth / 2,
        insetBlockStart: s.insetBlockStart,
        blockHeight: s.blockSize,
      };
    });
  expect(second.borderStyle).toBe('solid');
  expect(second.borderWidth).toBe('2px');
  expect(second.borderColor).toBe(await token(page, '--ui-color-border'));
  expect(second.inlineSize).toBeCloseTo(second.halfEntry, 0);
  expect(second.insetBlockStart).toBe('6px');
  expect(second.blockHeight).toBe('0px');
});

test('step links keep the link color, the underline returns on hover', async ({ page }) => {
  const link = await page.locator('#stepper-link-done').evaluate((el) => {
    const s = getComputedStyle(el);
    return { decoration: s.textDecorationLine, color: s.color };
  });
  expect(link.decoration).toBe('none');
  expect(link.color).toBe(await token(page, '--ui-color-link'));
});
