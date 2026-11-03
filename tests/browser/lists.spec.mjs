import { expect, test } from '@playwright/test';

/**
 * Base lists: the behavior contract, not pixel values — the indent rides
 * the spacing scale, nested ol read as hierarchical counters() paths while
 * the top level keeps native markers, and the receipt dl pins dd to the
 * value column with a decorative dotted leader.
 */

const space = (page, token) =>
  page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.paddingInlineStart = `var(${name})`;
    document.body.append(probe);
    const size = getComputedStyle(probe).paddingInlineStart;
    probe.remove();
    return size;
  }, token);

test('list indent follows the spacing scale token', async ({ page }) => {
  await page.goto('/pages/lists.html');
  const ul = page.locator('.example ul').first();
  expect(await ul.evaluate((el) => getComputedStyle(el).paddingInlineStart)).toBe(
    await space(page, '--ui-space-lg'),
  );
});

test('nested ol renders the counters path, the top level stays native', async ({ page }) => {
  await page.goto('/pages/lists.html');
  const ol = page.locator('.example ol').first();

  // Top level: native marker box, no generated content.
  const topLi = ol.locator('> li').first();
  expect(await topLi.evaluate((el) => getComputedStyle(el, '::before').content)).toBe('none');
  expect(await topLi.evaluate((el) => getComputedStyle(el).listStyleType)).not.toBe('none');

  // Nested level: list-style dropped, the hanging ::before path present.
  const nestedLi = ol.locator('ol > li').first();
  expect(await nestedLi.evaluate((el) => getComputedStyle(el).listStyleType)).toBe('none');
  const before = await nestedLi.evaluate((el) => getComputedStyle(el, '::before'));
  expect(before.content).toContain('counters(');
  expect(before.position).toBe('absolute');
});

test('receipt dl pins dd to the value column and stacks extra values', async ({ page }) => {
  await page.goto('/pages/lists.html');
  const dl = page.locator('dl[data-variant="horizontal"]').first();

  expect(await dl.evaluate((el) => getComputedStyle(el).display)).toBe('grid');
  expect(await dl.evaluate((el) => getComputedStyle(el).gridTemplateColumns)).toMatch(/^\S+ \S+$/);

  const dd = dl.locator('dd').first();
  expect(await dd.evaluate((el) => getComputedStyle(el).gridColumnStart)).toBe('2');
  expect(await dd.evaluate((el) => getComputedStyle(el).marginInlineStart)).toBe('0px');

  // Extra values stack in the value column: every dd shares the same
  // column edge and the tops grow strictly down the list.
  const boxes = [];
  for (const el of await dl.locator('dd').all()) {
    boxes.push(await el.evaluate((node) => ({ left: node.offsetLeft, top: node.offsetTop })));
  }
  expect(boxes.every((b) => b.left === boxes[0].left)).toBe(true);
  expect(boxes.every((b, i) => i === 0 || b.top > boxes[i - 1].top)).toBe(true);
});

test('receipt leader is a dotted border-strong line', async ({ page }) => {
  await page.goto('/pages/lists.html');
  const after = await page
    .locator('dl[data-variant="horizontal"] dt')
    .first()
    .evaluate((el) => getComputedStyle(el, '::after'));
  expect(after.content).toBe('""');
  expect(after.borderBlockEndStyle).toBe('dotted');
  const strong = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--ui-color-border-strong)';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
  expect(after.borderBlockEndColor).toBe(strong);
});
