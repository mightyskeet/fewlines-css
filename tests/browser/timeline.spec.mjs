import { expect, test } from '@playwright/test';

/**
 * Timeline component tests.
 * A timeline is a static list: the contract under test is the marker/rail
 * geometry (tokens, offsets), the entry rhythm and the native
 * list semantics (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = async (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

/** The entry's used line height in px (the fluid scale makes the body
 * font size viewport-dependent — no hardcoded px expectations). */
const entryLineHeight = (page) =>
  page
    .locator('#timeline-default li')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      const lh = parseFloat(s.lineHeight);
      return s.lineHeight.endsWith('px') ? lh : lh * parseFloat(s.fontSize);
    });

/** Resolved px value of a step token, via a throwaway probe element (the
 * typography.spec precedent — fluid tokens don't resolve on :root). */
const tokenFont = (page, name) =>
  page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.fontSize = `var(${name})`;
    document.body.append(probe);
    const size = getComputedStyle(probe).fontSize;
    probe.remove();
    return size;
  }, name);

test('the list owns the layout: no list chrome, adjacent entries', async ({ page }) => {
  const list = await page.locator('#timeline-default').evaluate((el) => {
    const s = getComputedStyle(el);
    return { listStyle: s.listStyleType, margin: s.margin, padding: s.padding };
  });
  expect(list.listStyle).toBe('none');
  expect(list.margin).toBe('0px');
  expect(list.padding).toBe('0px');

  const first = await page
    .locator('#timeline-default li')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { paddingInlineStart: s.paddingInlineStart, position: s.position };
    });
  expect(first.paddingInlineStart).toBe('32px');
  expect(first.position).toBe('relative');

  const next = await page
    .locator('#timeline-default li')
    .nth(1)
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { paddingBlockStart: s.paddingBlockStart };
    });
  expect(next.paddingBlockStart).toBe('24px');
});

test('the entry box owns the outermost margins of its content', async ({ page }) => {
  const first = await page.locator('#timeline-meta').evaluate((el) => {
    const s = getComputedStyle(el);
    return { marginBlockStart: s.marginBlockStart };
  });
  expect(first.marginBlockStart).toBe('0px');

  const last = await page.locator('#timeline-body').evaluate((el) => {
    const s = getComputedStyle(el);
    return { marginBlockEnd: s.marginBlockEnd };
  });
  expect(last.marginBlockEnd).toBe('0px');
});

test('the marker is a ring on the border-strong token, centered on the rail', async ({ page }) => {
  const lh = await entryLineHeight(page);
  const offset = (lh - 16) / 2;
  const marker = await page
    .locator('#timeline-default li')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el, '::before');
      return {
        borderStyle: s.borderTopStyle,
        borderWidth: s.borderTopWidth,
        borderColor: s.borderTopColor,
        inlineSize: s.inlineSize,
        blockSize: s.blockSize,
        radius: s.borderTopLeftRadius,
        insetInlineStart: s.insetInlineStart,
        insetBlockStart: s.insetBlockStart,
        background: s.backgroundColor,
        zIndex: s.zIndex,
      };
    });
  expect(marker.borderStyle).toBe('solid');
  expect(marker.borderWidth).toBe('2px');
  expect(marker.borderColor).toBe(await token(page, '--ui-color-border-strong'));
  expect(marker.inlineSize).toBe('16px');
  expect(marker.blockSize).toBe('16px');
  expect(marker.radius).toBe('9999px');
  expect(marker.insetInlineStart).toBe('8px');
  // The first-line offset is (1lh - size) / 2 — the marker is centered on
  // the content's first line.
  expect(marker.insetBlockStart).toBe(`${offset}px`);
  expect(marker.background).toBe(await token(page, '--ui-color-surface'));
  expect(marker.zIndex).toBe('1');
});

test('the following entry marker shifts by the block gap', async ({ page }) => {
  const lh = await entryLineHeight(page);
  const offset = (lh - 16) / 2;
  const marker = await page
    .locator('#timeline-default li')
    .nth(1)
    .evaluate((el) => {
      const s = getComputedStyle(el, '::before');
      return { insetBlockStart: s.insetBlockStart };
    });
  expect(marker.insetBlockStart).toBe(`${24 + offset}px`);
});

test('the rail is a border on the border token, spanning each entry', async ({ page }) => {
  const lh = await entryLineHeight(page);
  const offset = (lh - 16) / 2;
  const first = await page
    .locator('#timeline-default li')
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
  // The rail starts at the ring's top: the first-line offset (1lh - size)/2.
  expect(first.insetBlock).toBe(`${offset}px 0px`);

  const next = await page
    .locator('#timeline-default li')
    .nth(1)
    .evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return { insetBlock: s.insetBlock };
    });
  expect(next.insetBlock).toBe('0px');
});

test('the last entry rail ends at the last ring bottom', async ({ page }) => {
  const lh = await entryLineHeight(page);
  const offset = (lh - 16) / 2;
  const rail = await page
    .locator('#timeline-default li')
    .nth(2)
    .evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return { blockSize: s.blockSize };
    });
  // The last rule sets inset-block-end: auto; Chromium reports the used
  // value for it, so the observable contract is the trimmed block-size:
  // the block gap + the first-line offset + the ring itself.
  expect(rail.blockSize).toBe(`${24 + offset + 16}px`);
});

test('a single entry has no outgoing rail', async ({ page }) => {
  const rail = await page
    .locator('#timeline-single li')
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return { display: s.display };
    });
  expect(rail.display).toBe('none');
});

test('the meta line renders at the fluent role on the muted color', async ({ page }) => {
  const meta = await page.locator('#timeline-meta').evaluate((el) => {
    const s = getComputedStyle(el);
    return { fontSize: s.fontSize, color: s.color };
  });
  expect(meta.fontSize).toBe(await tokenFont(page, '--ui-font-size-sm'));
  expect(meta.color).toBe(await token(page, '--ui-color-text-muted'));
});
