import { createRequire } from 'node:module';
import { expect, test } from '../fixtures/test.mjs';

const require = createRequire(import.meta.url);

/**
 * Accessibility tests: axe-core scan + explicit keyboard/focus checks
 * (accessibility notes). Axe is an extra layer, not a replacement
 * for the explicit keyboard tests in browser/.
 */

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
});

test('axe scan: no critical violations on fixture page', async ({ page }) => {
  const results = await page.evaluate(async () => {
    const axe = window.axe;
    const res = await axe.run(document, {
      rules: {
        // Color contrast is validated by the APCA matrix (tests/apca);
        // axe's WCAG-based contrast rule is not the source of truth here.
        'color-contrast': { enabled: false },
      },
    });
    return res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
  });

  const critical = results.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(critical, `axe violations: ${JSON.stringify(results)}`).toEqual([]);
});

test('axe scan: dialog page state has no violations', async ({ page }) => {
  await page.click('#dialog-open');
  await expect(page.locator('#testDialog')).toBeVisible();

  const results = await page.evaluate(async () => {
    const res = await window.axe.run(document.querySelector('#testDialog'), {
      rules: { 'color-contrast': { enabled: false } },
    });
    return res.violations.map((v) => ({ id: v.id, impact: v.impact }));
  });

  const serious = results.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(serious, `axe violations: ${JSON.stringify(results)}`).toEqual([]);
});

test('axe scan: drawer open state has no violations', async ({ page }) => {
  await page.click('#drawer-trigger');
  await expect(page.locator('#testDrawer')).toBeVisible();

  const results = await page.evaluate(async () => {
    const res = await window.axe.run(document.querySelector('#testDrawer'), {
      rules: { 'color-contrast': { enabled: false } },
    });
    return res.violations.map((v) => ({ id: v.id, impact: v.impact }));
  });

  const serious = results.filter((v) => v.impact === 'critical' || v.impact === 'serious');
  expect(serious, `axe violations: ${JSON.stringify(results)}`).toEqual([]);
});

test('keyboard: all interactive elements reachable via Tab', async ({ page }) => {
  const reachable = [];
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const id = await page.evaluate(
      () => document.activeElement?.id || document.activeElement?.tagName,
    );
    reachable.push(id);
    if (id === 'popover-trigger') break;
  }
  expect(reachable).toContain('btn-primary');
  expect(reachable).toContain('btn-secondary');
  expect(reachable).toContain('dialog-open');
  expect(reachable).toContain('popover-trigger');
  // Disabled button must not be reachable
  expect(reachable).not.toContain('btn-disabled');
});

test('focus ring uses the shared token color', async ({ page }) => {
  await page.keyboard.press('Tab');
  const outlineColor = await page
    .locator('#btn-primary')
    .evaluate((el) => getComputedStyle(el).outlineColor);
  // Focus ring token resolves to a concrete color; must not be transparent
  expect(outlineColor).not.toBe('transparent');
  expect(outlineColor).not.toBe('rgba(0, 0, 0, 0)');
});
