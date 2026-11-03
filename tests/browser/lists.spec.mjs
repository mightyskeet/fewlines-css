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

test('list indents follow the spacing scale tokens', async ({ page }) => {
  await page.goto('/pages/lists.html');
  const ul = page.locator('.example ul').first();
  expect(await ul.evaluate((el) => getComputedStyle(el).paddingInlineStart)).toBe(
    await space(page, '--ui-space-lg'),
  );
  // Numbers are narrower than bullets: the ordered list takes the next
  // step up.
  const ol = page.locator('.example ol').first();
  expect(await ol.evaluate((el) => getComputedStyle(el).paddingInlineStart)).toBe(
    await space(page, '--ui-space-xl'),
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

test('receipt dl lays groups out and stacks extra values', async ({ page }) => {
  await page.goto('/pages/lists.html');
  const dl = page.locator('dl[data-variant="horizontal"]').first();

  // The vertical dt carries the bold weight (the UA renders it normal).
  const vdt = page.locator('.example dl:not([data-variant]) dt').first();
  expect(await vdt.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('700');
  const vdd = page.locator('.example dl:not([data-variant]) dd').first();
  expect(await vdd.evaluate((el) => getComputedStyle(el).marginInlineStart)).toBe(
    await space(page, '--ui-space-md'),
  );

  // The dl stacks div-wrapped groups; each group is a wrapping row-reverse
  // flex row.
  expect(await dl.evaluate((el) => getComputedStyle(el).display)).toBe('grid');
  const group = dl.locator('> div').first();
  expect(await group.evaluate((el) => getComputedStyle(el).display)).toBe('flex');
  expect(await group.evaluate((el) => getComputedStyle(el).flexDirection)).toBe('row-reverse');
  expect(await group.evaluate((el) => getComputedStyle(el).flexWrap)).toBe('wrap');

  // The key is placed after the values (order) and grows over its line's
  // free space; middle dd take their own full lines, the last value stays
  // a normal item so the key can share its line.
  const contactsDt = dl.locator('dt', { hasText: 'Contacts' });
  expect(await contactsDt.evaluate((el) => getComputedStyle(el).order)).toBe('1');
  expect(await contactsDt.evaluate((el) => getComputedStyle(el).flexGrow)).toBe('1');
  const middle = dl.locator('dd', { hasText: '+1 555 0100' });
  expect(await middle.evaluate((el) => getComputedStyle(el).flexBasis)).toBe('100%');
  expect(await middle.evaluate((el) => getComputedStyle(el).justifyContent)).toBe('flex-end');
  const last = dl.locator('dd', { hasText: '@fewlines' });
  expect(await last.evaluate((el) => getComputedStyle(el).flexBasis)).toBe('auto');

  // The key sits on the last value's line, below the first one.
  const hello = dl.locator('dd', { hasText: 'hello@example.com' });
  expect(await contactsDt.evaluate((el) => el.offsetTop)).toBeGreaterThan(
    await hello.evaluate((el) => el.offsetTop),
  );

  // Values stack down the list, tops strictly increasing; every value's
  // TEXT ends at the same right edge (the receipt edge) — the element
  // rect of a full-width continuation box is the container edge, so the
  // text range is what proves the alignment.
  const edges = [];
  const tops = [];
  for (const el of await dl.locator('dd').all()) {
    const box = await el.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const text = range.getBoundingClientRect();
      return { right: Math.round(text.right), top: Math.round(node.offsetTop) };
    });
    edges.push(box.right);
    tops.push(box.top);
  }
  expect(edges.every((e) => Math.abs(e - edges[0]) <= 1)).toBe(true);
  expect(tops.every((t, i) => i === 0 || t > tops[i - 1])).toBe(true);
});

test('receipt leader is a dashed border-strong line reaching the value', async ({ page }) => {
  await page.goto('/pages/lists.html');
  const dt = page.locator('dl[data-variant="horizontal"] dt').first();
  const after = await dt.evaluate((el) => getComputedStyle(el, '::after'));
  expect(after.content).toBe('""');
  expect(after.borderBlockEndStyle).toBe('dashed');

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
