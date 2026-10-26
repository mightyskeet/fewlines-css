// One-off smoke check for the Session-1 derivation layer (plan:
// docs/plans/2026-10-26-color-derivation.md). Loads /colors.html from the
// static server (playwright.config.mjs webServer), opens the palette widget's
// table on default bases and reports pass/fail per pair and theme for each
// engine. Not part of the regular suite — run manually from tests/:
//   node apca/derive-smoke.mjs
import { test, expect } from '@playwright/test';

const PAIRS = process.env.SMOKE_PAIRS_ONLY === '1';

test('derivation layer: default bases pass the token matrix', async ({ page, browserName }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto('/colors');
  await expect(page.locator('.palette-table tr')).not.toHaveCount(0);

  // Open the drawer via the FAB and wait for the live table to fill.
  const readTable = async () => {
    await page.click('.site-palette-fab');
    await page.waitForFunction(() => {
      const pills = document.querySelectorAll('.palette-pill');
      return pills.length > 0 && [...pills].every((p) => p.textContent !== '');
    });
    return page.evaluate(() =>
      [...document.querySelectorAll('.palette-table tbody tr')].map((row) => ({
        pair: row.querySelector('code').textContent,
        status: [...row.querySelectorAll('.palette-pill')]
          .map((p) => p.textContent[0].toUpperCase())
          .join(''),
        lc: row.children[3].textContent,
      })),
    );
  };
  const report = async (label, rows) => {
    const failed = rows.filter((r) => r.status !== 'PP');
    console.log(`[${browserName}] ${label}: pairs ${rows.length}, failing ${failed.length}`);
    for (const r of failed) console.log(`  ${r.pair.padEnd(34)} ${r.status}  Lc ${r.lc}`);
    return failed;
  };

  // Phase A: core defaults (derivation layer inert — no data-palette).
  const coreFailures = await report('core defaults', await readTable());
  expect(coreFailures, 'core defaults pass both themes').toEqual([]);

  // Phase B: derivation layer with its own default bases.
  await page.keyboard.press('Escape');
  await page.evaluate(() => document.documentElement.setAttribute('data-palette', 'custom'));
  const deriveFailures = await report('derive defaults', await readTable());
  expect(deriveFailures, 'derive-layer defaults pass both themes').toEqual([]);

  expect(errors, 'no page errors').toEqual([]);
});

test('palette widget: slider, persistence, reset', async ({ page }) => {
  await page.goto('/colors');
  await page.click('.site-palette-fab');

  // Opening the drawer must not disturb the theme (the measurement used to
  // restore it with the token transition re-enabled — a visible flash) and
  // must not scroll to the bottom (autofocus used to sit on the Close
  // button at the end of the panel).
  await expect(page.locator('#site-palette-drawer')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-theme'))).toBe(
    false,
  );
  expect(await page.evaluate(() => document.getElementById('site-palette-drawer').scrollTop)).toBe(
    0,
  );
  // The measurement must not leave inline residue on :root.
  expect(
    await page.evaluate(() => {
      const s = document.documentElement.style;
      return [s.colorScheme, s.transition].join('|');
    }),
  ).toBe('|');

  const accentLightness = page
    .locator('.palette-drawer fieldset', { hasText: 'Accent' })
    .locator('input[type="range"]')
    .first();
  await accentLightness.fill('0.3');

  // The first drag activates the derivation scope and saves the full map.
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'custom');
  // The first drag seeds the FULL map from the (scoped) CSS defaults —
  // no empty-string entries that would poison the restored palette.
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('colors-bases')));
  expect(stored['--ui-base-accent-l']).toBe('0.3');
  expect(Object.values(stored).every((v) => typeof v === 'string' && v.length > 0)).toBe(true);
  // Vivid branch: light fill L = 0.28 + 0.37 * 0.3 = 0.391.
  const accent = await page.evaluate(() => {
    const d = document.createElement('div');
    document.body.append(d);
    document.documentElement.setAttribute('data-theme', 'light');
    d.style.color = 'var(--ui-color-accent)';
    const value = getComputedStyle(d).color;
    d.remove();
    return value;
  });
  expect(accent).toContain('0.391');

  // Reset removes the scope, the storage and returns tokens to core values.
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-palette', 'custom');
  await expect(page.evaluate(() => localStorage.getItem('colors-bases'))).resolves.toBeNull();
});
