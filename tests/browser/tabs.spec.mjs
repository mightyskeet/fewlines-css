import { expect, test } from '@playwright/test';

/**
 * Tabs component tests.
 * The contract under test: fragment-driven switching (the link is its own
 * :target), exactly one open panel per group (default = first), the
 * adjacency mechanism (link → panel), the vertical grid geometry
 * (compact rail, top-aligned panel) and the native keyboard behavior.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
  // Deterministic color reads: the reduced-motion kill-switch (component)
  // removes the tab-link transitions, so computed colors are the final
  // values immediately after activation.
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

const token = async (page, name) =>
  page.evaluate((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);

const panelStates = (page, groupId) =>
  page.evaluate((id) => {
    const group = document.getElementById(id);
    return [...group.querySelectorAll('.ui-tabs-panel')].map((p) => getComputedStyle(p).display);
  }, groupId);

test('default state: first panel open, others hidden, first tab styled active', async ({
  page,
}) => {
  expect(await panelStates(page, 'tabs-default')).toEqual(['block', 'none', 'none']);

  const links = await page.evaluate(() =>
    [...document.querySelectorAll('#tabs-default .ui-tab')].map((el) => {
      const s = getComputedStyle(el);
      return { color: s.color, borderBottomColor: s.borderBottomColor };
    }),
  );
  expect(links[0].color).toBe(await token(page, '--ui-color-text'));
  expect(links[0].borderBottomColor).toBe(await token(page, '--ui-color-border-strong'));
  expect(links[1].color).toBe(await token(page, '--ui-color-text-muted'));
  expect(links[1].borderBottomColor).toBe('rgba(0, 0, 0, 0)');
});

test('clicking a tab switches the panel and the URL fragment', async ({ page }) => {
  await page.click('#tabs-two');
  expect(await page.evaluate(() => location.hash)).toBe('#tabs-panel-two');
  expect(await panelStates(page, 'tabs-default')).toEqual(['none', 'block', 'none']);

  const links = await page.evaluate(() =>
    [...document.querySelectorAll('#tabs-default .ui-tab')].map((el) => getComputedStyle(el).color),
  );
  expect(links[0]).toBe(await token(page, '--ui-color-text-muted'));
  expect(links[1]).toBe(await token(page, '--ui-color-text'));
});

test('deep link opens the targeted tab without interaction', async ({ page }) => {
  await page.goto('/fixture.html#tabs-panel-three');
  expect(await panelStates(page, 'tabs-default')).toEqual(['none', 'none', 'block']);
});

test('groups are independent: a fragment in one group leaves others on the default', async ({
  page,
}) => {
  await page.goto('/fixture.html#tabs-v-panel-two');
  expect(await panelStates(page, 'tabs-vertical')).toEqual(['none', 'block', 'none']);
  expect(await panelStates(page, 'tabs-default')).toEqual(['block', 'none', 'none']);
});

test('back returns to the previous tab', async ({ page }) => {
  await page.click('#tabs-two');
  await page.click('#tabs-three');
  await page.goBack();
  expect(await page.evaluate(() => location.hash)).toBe('#tabs-panel-two');
  expect(await panelStates(page, 'tabs-default')).toEqual(['none', 'block', 'none']);
});

test('vertical: the rail keeps link heights and the panel is top-aligned', async ({ page }) => {
  await page.click('#tabs-v-two');
  const geo = await page.evaluate(() => {
    const group = document.getElementById('tabs-vertical');
    const box = group.getBoundingClientRect();
    const links = [...group.querySelectorAll('.ui-tab')].map((a) => a.getBoundingClientRect());
    const open = [...group.querySelectorAll('.ui-tabs-panel')].find(
      (p) => getComputedStyle(p).display !== 'none',
    );
    const openBox = open.getBoundingClientRect();
    return {
      linkTops: links.map((r) => Math.round(r.top - box.top)),
      railBottom: Math.round(links[links.length - 1].bottom - box.top),
      panelTop: Math.round(openBox.top - box.top),
      panelLeft: Math.round(openBox.left),
      railRight: Math.round(links[0].right),
      tabsHeight: Math.round(box.height),
      panelHeight: Math.round(openBox.height),
    };
  });
  // The rail is compact: consecutive links sit one link-height apart, the
  // tall open panel does not spread them.
  const [first, second, third] = geo.linkTops;
  expect(second - first).toBeLessThan(60);
  expect(third - second).toBeLessThan(60);
  expect(geo.panelTop).toBe(0);
  expect(geo.panelLeft).toBeGreaterThanOrEqual(geo.railRight);
  // The container contains the taller of rail and panel.
  expect(geo.tabsHeight).toBeGreaterThanOrEqual(geo.panelHeight);
  expect(geo.tabsHeight).toBeGreaterThanOrEqual(geo.railBottom);
});

test('vertical: the indicator is the inline-start border of the active link', async ({ page }) => {
  await page.click('#tabs-v-two');
  const borders = await page.evaluate(() =>
    [...document.querySelectorAll('#tabs-vertical .ui-tab')].map((el) => {
      const s = getComputedStyle(el);
      return { borderLeftColor: s.borderLeftColor, borderBottomWidth: s.borderBottomWidth };
    }),
  );
  expect(borders[1].borderLeftColor).toBe(await token(page, '--ui-color-border-strong'));
  expect(borders[1].borderBottomWidth).toBe('0px');
  expect(borders[0].borderLeftColor).toBe('rgba(0, 0, 0, 0)');
});

test('keyboard: Enter activates the tab; the next Tab enters the panel content', async ({
  page,
}) => {
  await page.locator('#tabs-one').focus();
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => location.hash)).toBe('#tabs-panel-one');
  expect(await panelStates(page, 'tabs-default')).toEqual(['block', 'none', 'none']);

  // Fragment navigation moves the sequential focus navigation starting
  // point to the panel (the target) — native anchor-link behavior: the
  // next Tab enters the open panel's content, not the next tab link.
  await page.keyboard.press('Tab');
  await expect(page.locator('#tabs-panel-link')).toBeFocused();
});

test('forced colors: the inactive indicator is canvas, the active is painted', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.click('#tabs-two');
  const borders = await page.evaluate(() => {
    const canvas = getComputedStyle(document.documentElement).backgroundColor;
    return {
      canvas,
      links: [...document.querySelectorAll('#tabs-default .ui-tab')].map(
        (el) => getComputedStyle(el).borderBottomColor,
      ),
    };
  });
  // The transparent inactive border is remapped by forced colors; the
  // component pins it to canvas (invisible — every surface is canvas) and
  // the active one to canvastext (painted).
  expect(borders.links[1]).not.toBe(borders.canvas);
  expect(borders.links[0]).toBe(borders.canvas);
  expect(borders.links[2]).toBe(borders.canvas);
});

test('reduced motion: no transitions', async ({ page }) => {
  const t = await page.evaluate(
    () => getComputedStyle(document.querySelector('#tabs-one')).transitionDuration,
  );
  expect(t).toBe('0s');
});

test('normal motion: the tab link transitions color', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const t = await page.evaluate(
    () => getComputedStyle(document.querySelector('#tabs-one')).transitionDuration,
  );
  expect(t).toBe('0.12s, 0.12s');
});

test('the click lands with the bar in view (horizontal)', async ({ page }) => {
  await page.evaluate(() =>
    document.getElementById('tabs-default').scrollIntoView({ block: 'center' }),
  );
  await page.click('#tabs-two');
  const barBottom = await page.evaluate(
    () => document.getElementById('tabs-one').getBoundingClientRect().bottom,
  );
  // The panel's scroll margin keeps the bar above the landing panel top.
  expect(barBottom).toBeGreaterThan(0);
});

test('the click lands with the whole rail in view (vertical)', async ({ page }) => {
  await page.evaluate(() =>
    document.getElementById('tabs-vertical').scrollIntoView({ block: 'center' }),
  );
  await page.click('#tabs-v-three');
  const landing = await page.evaluate(() => {
    const first = document.getElementById('tabs-v-one').getBoundingClientRect();
    const rail = document.getElementById('tabs-vertical').getBoundingClientRect();
    return { firstLinkTop: first.top, containerTop: rail.top };
  });
  // The panel top equals the container top, so every tab lands on the same
  // position: the rail's first item stays below the viewport top (the
  // scroll margin) instead of the clicked link's own offset.
  expect(landing.containerTop).toBeCloseTo(landing.firstLinkTop, 0);
  expect(landing.firstLinkTop).toBeGreaterThan(0);
  expect(landing.firstLinkTop).toBeLessThan(80);
});
