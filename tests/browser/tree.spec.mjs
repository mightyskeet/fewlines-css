import { expect, test } from '../fixtures/test.mjs';

/**
 * Tree component tests.
 * The contract under test is the rail geometry (drop, elbow, continuation),
 * the native disclosure behavior of the branch nodes and the native
 * list semantics (tests/README.md).
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
});

const token = async (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

/** The node's used line height in px (the fluid scale makes the body
 * font size viewport-dependent — no hardcoded px expectations). */
const nodeLineHeight = (page, id) =>
  page.locator(id).evaluate((el) => {
    const s = getComputedStyle(el);
    const lh = parseFloat(s.lineHeight);
    return s.lineHeight.endsWith('px') ? lh : lh * parseFloat(s.fontSize);
  });

/** Resolved px value of a length token via a throwaway probe element
 * (the typography.spec precedent — rem tokens don't resolve on :root,
 * and the squircle @supports block swaps the radius values per engine). */
const tokenLength = (page, name) =>
  page.evaluate((n) => {
    const probe = document.createElement('span');
    probe.style.borderTopLeftRadius = `var(${n})`;
    document.body.append(probe);
    const radius = getComputedStyle(probe).borderTopLeftRadius;
    probe.remove();
    return radius;
  }, name);

/** The node's used font size in px (the rail hangs from the disclosure
 * marker's center — an em-based offset, viewport-dependent). */
const nodeFontSize = (page, id) =>
  page.locator(id).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));

test('the list owns the layout: no list chrome, indented adjacent nodes', async ({ page }) => {
  const list = await page.locator('#tree-default').evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      listStyle: s.listStyleType,
      margin: s.margin,
      padding: s.padding,
      position: s.position,
      zIndex: s.zIndex,
    };
  });
  expect(list.listStyle).toBe('none');
  expect(list.margin).toBe('0px');
  expect(list.padding).toBe('0px');
  // Stacking context: the rail pseudos (z-index -1) paint under the node
  // content but above anything outside the tree.
  expect(list.position).toBe('relative');
  expect(list.zIndex).toBe('0');

  const root = await page.locator('#tree-root-leaf').evaluate((el) => {
    const s = getComputedStyle(el);
    return { paddingInlineStart: s.paddingInlineStart, position: s.position };
  });
  expect(root.paddingInlineStart).toBe('16px');
  expect(root.position).toBe('relative');

  const next = await page
    .locator('#tree-default > li')
    .nth(1)
    .evaluate((el) => ({ paddingBlockStart: getComputedStyle(el).paddingBlockStart }));
  expect(next.paddingBlockStart).toBe('4px');
});

test('a root node has no incoming rail', async ({ page }) => {
  const pseudo = await page.locator('#tree-root-leaf').evaluate((el) => ({
    before: getComputedStyle(el, '::before').content,
    after: getComputedStyle(el, '::after').content,
  }));
  expect(pseudo.before).toBe('none');
  expect(pseudo.after).toBe('none');
});

test('the elbow is the incoming rail plus the branch, rounded at the corner', async ({ page }) => {
  const lh = await nodeLineHeight(page, '#tree-nested-leaf');
  const fs = await nodeFontSize(page, '#tree-nested-leaf');
  // The rail hangs from the marker's center: 0.5 * marker-size (0.625em),
  // minus half the line width for the pseudo's border inset.
  const center = 0.3125 * fs;
  const radius = parseFloat(await tokenLength(page, '--ui-radius-sm'));
  const elbow = await page.locator('#tree-nested-leaf').evaluate((el) => {
    const s = getComputedStyle(el, '::before');
    return {
      borderStyle: s.borderInlineStartStyle,
      borderWidth: s.borderInlineStartWidth,
      borderColor: s.borderInlineStartColor,
      inlineSize: s.inlineSize,
      blockSize: s.blockSize,
      radius: s.borderEndStartRadius,
      insetInlineStart: s.insetInlineStart,
      insetBlockStart: s.insetBlockStart,
      zIndex: s.zIndex,
    };
  });
  expect(elbow.borderStyle).toBe('solid');
  expect(elbow.borderWidth).toBe('2px');
  expect(elbow.borderColor).toBe(await token(page, '--ui-color-border'));
  // The stub reaches the node's content edge: indent − center + width/2.
  expect(elbow.inlineSize).toBe(`${16 - center + 1}px`);
  // The stub is centered on the node's first line: (1lh + width) / 2.
  expect(elbow.blockSize).toBe(`${lh / 2 + 1}px`);
  expect(elbow.radius).toBe(await tokenLength(page, '--ui-radius-sm'));
  expect(elbow.insetInlineStart).toBe(`${center - 1}px`);
  expect(elbow.insetBlockStart).toBe('0px');
  // The rails paint under the node content (the drop crosses the marker).
  expect(elbow.zIndex).toBe('-1');
});

test('the rail continues below the branch point, ends at the last elbow', async ({ page }) => {
  const lh = await nodeLineHeight(page, '#tree-nested-leaf');
  const radius = parseFloat(await tokenLength(page, '--ui-radius-sm'));
  const rail = await page.locator('#tree-nested-leaf').evaluate((el) => {
    const s = getComputedStyle(el, '::after');
    return {
      borderStyle: s.borderInlineStartStyle,
      borderWidth: s.borderInlineStartWidth,
      inlineSize: s.inlineSize,
      insetBlock: s.insetBlock,
      display: s.display,
    };
  });
  expect(rail.borderStyle).toBe('solid');
  expect(rail.borderWidth).toBe('2px');
  expect(rail.inlineSize).toBe('0px');
  // Starts inside the elbow's curve radius so the straight rail passes
  // through the junction.
  expect(rail.insetBlock).toBe(`${lh / 2 + 1 - radius}px 0px`);

  const last = await page
    .locator('#tree-default ul li')
    .last()
    .evaluate((el) => getComputedStyle(el, '::after').display);
  expect(last).toBe('none');
});

test('a node following a sibling keeps the rail through the gap', async ({ page }) => {
  const lh = await nodeLineHeight(page, '#tree-default ul li:nth-child(2)');
  const elbow = await page.locator('#tree-default ul li:nth-child(2)').evaluate((el) => {
    const s = getComputedStyle(el, '::before');
    return { insetBlockStart: s.insetBlockStart, blockSize: s.blockSize };
  });
  // The elbow still starts at the box top (the rail runs through the
  // top padding); the stub grows down to the first-line center.
  expect(elbow.insetBlockStart).toBe('0px');
  expect(elbow.blockSize).toBe(`${4 + lh / 2 + 1}px`);
});

test('the children rail hangs from the parent line center', async ({ page }) => {
  const lh = await nodeLineHeight(page, '#tree-branch-open > summary');
  const fs = await nodeFontSize(page, '#tree-branch-open > summary');
  const center = 0.3125 * fs;
  const drop = await page.locator('#tree-branch-open > ul').evaluate((el) => {
    const s = getComputedStyle(el, '::before');
    return {
      borderStyle: s.borderInlineStartStyle,
      borderWidth: s.borderInlineStartWidth,
      inlineSize: s.inlineSize,
      insetInlineStart: s.insetInlineStart,
      insetBlockStart: s.insetBlockStart,
      blockSize: s.blockSize,
      zIndex: s.zIndex,
    };
  });
  // The parent line is one line tall: its center is 0.5lh above the
  // list's top; the rail x is the marker's center.
  expect(drop.borderStyle).toBe('solid');
  expect(drop.borderWidth).toBe('2px');
  expect(drop.inlineSize).toBe('0px');
  expect(drop.insetInlineStart).toBe(`${center - 1}px`);
  expect(drop.insetBlockStart).toBe(`${-lh / 2}px`);
  expect(drop.blockSize).toBe(`${lh / 2}px`);
  expect(drop.zIndex).toBe('-1');
});

test('branch opens and closes via summary click (native disclosure)', async ({ page }) => {
  const closed = page.locator('#tree-branch-closed');
  await expect(closed).not.toHaveAttribute('open');

  await page.click('#tree-summary-closed');
  await expect(closed).toHaveAttribute('open');

  await page.click('#tree-summary-closed');
  await expect(closed).not.toHaveAttribute('open');
});

test('branch toggles via keyboard (Enter on summary)', async ({ page }) => {
  const closed = page.locator('#tree-branch-closed');

  await page.locator('#tree-summary-closed').focus();
  await page.keyboard.press('Enter');
  await expect(closed).toHaveAttribute('open');

  await page.keyboard.press('Enter');
  await expect(closed).not.toHaveAttribute('open');
});

test('a closed branch hides its subtree, an open one shows it', async ({ page }) => {
  const closedSubtree = page.locator('#tree-branch-closed > ul');
  await expect(closedSubtree).toBeHidden();

  await page.click('#tree-summary-closed');
  await expect(closedSubtree).toBeVisible();
});
