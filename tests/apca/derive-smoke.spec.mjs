// One-off smoke check for the Session-1 derivation layer (plan:
// docs/plans/2026-10-26-color-derivation.md). Loads /colors.html from the
// static server (playwright.config.mjs webServer), reads the always-visible
// live tables on default bases and reports pass/fail per pair and theme for
// each engine. Not part of the regular suite — run manually from tests/:
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

  // The tables are always visible; a scope flip does not schedule a recompute
  // (only sliders do), so each phase forces a synchronous refresh().
  const readTable = async () => {
    await page.evaluate(() => document.querySelector('site-palette-table').refresh());
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

  // Phase A: core defaults (the Colors page runs the layer always-on, so the
  // scope attribute is removed explicitly to expose the core values).
  await page.evaluate(() => document.documentElement.removeAttribute('data-palette'));
  const coreFailures = await report('core defaults', await readTable());
  expect(coreFailures, 'core defaults pass both themes').toEqual([]);

  // Phase B: derivation layer with its own default bases.
  await page.evaluate(() => document.documentElement.setAttribute('data-palette', 'custom'));
  const deriveFailures = await report('derive defaults', await readTable());
  expect(deriveFailures, 'derive-layer defaults pass both themes').toEqual([]);

  // Phase C: an out-of-gamut seed (l 0.94, c 0.32 is far outside sRGB). The
  // table must gamut-map like the browser paints — the old canvas parser
  // clipped the color and reported a false fail (~75 Lc where the mapped
  // pair measures ~94).
  await page.evaluate(() => {
    const root = document.documentElement;
    root.style.setProperty('--ui-base-brand-l', '0.94');
    root.style.setProperty('--ui-base-brand-c', '0.32');
    root.style.setProperty('--ui-base-brand-h', '276');
  });
  const onBrand = (await readTable()).find((r) => r.pair === 'on-brand / brand');
  expect(
    Number(onBrand.lc.split(' / ')[1]),
    'out-of-gamut pair is mapped, not clipped',
  ).toBeGreaterThan(85);
  expect(onBrand.status[1], 'dark on-brand/brand passes').toBe('P');

  expect(errors, 'no page errors').toEqual([]);
});

test('palette widget: slider, persistence, reset', async ({ page }) => {
  await page.goto('/colors');

  const linkLightness = page
    .locator('site-palette-family[family="Link"] input[type="range"]')
    .first();
  await linkLightness.fill('0.3');

  // The Colors page runs the derivation scope always-on (head script).
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'custom');
  // The first drag seeds the FULL map from the layer's CSS defaults —
  // no empty-string entries that would poison the restored palette.
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('colors-bases')));
  expect(stored['--ui-base-link-l']).toBe('0.3');
  expect(Object.values(stored).every((v) => typeof v === 'string' && v.length > 0)).toBe(true);
  // The measurement must not leave inline residue on :root.
  expect(
    await page.evaluate(() => {
      const s = document.documentElement.style;
      return [s.colorScheme, s.transition].join('|');
    }),
  ).toBe('|');
  // Vivid branch: light fill L = 0.28 + 0.37 * 0.3 = 0.391.
  const link = await page.evaluate(() => {
    const d = document.createElement('div');
    document.body.append(d);
    document.documentElement.setAttribute('data-theme', 'light');
    d.style.color = 'var(--ui-color-link)';
    const value = getComputedStyle(d).color;
    d.remove();
    return value;
  });
  expect(link).toContain('0.391');

  // Reset clears the storage and returns the sliders to the layer's defaults
  // (the scope attribute stays — the Colors page always runs the layer).
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.evaluate(() => localStorage.getItem('colors-bases'))).resolves.toBeNull();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'custom');
});

test('derivation: tint and fill keep the family hue', async ({ page }) => {
  await page.goto('/colors');
  const hueOf = (token) =>
    page.evaluate(
      ({ token }) => {
        const probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;visibility:hidden;';
        document.body.append(probe);
        // Project the token into explicit oklch channels so the hue is
        // readable regardless of the engine's computed-value serialization.
        probe.style.color = `oklch(from var(${token}) l c h)`;
        const m = getComputedStyle(probe).color.match(/oklch\(\s*[\d.]+%?\s+[\d.]+%?\s+(-?[\d.]+)/);
        probe.remove();
        if (!m) throw new Error(`no hue in ${getComputedStyle(probe).color}`);
        return Number(m[1]);
      },
      { token },
    );

  await page.evaluate(() => {
    const root = document.documentElement;
    root.setAttribute('data-palette', 'custom');
    root.style.setProperty('--ui-base-attention-h', '160');
  });

  for (const token of ['--ui-color-attention-tint', '--ui-color-attention']) {
    const hue = await hueOf(token);
    const drift = Math.abs(((hue - 160 + 540) % 360) - 180);
    expect(drift, `${token} keeps the family hue (got ${hue})`).toBeLessThanOrEqual(2);
  }
});

test('derivation: colors are a pure function of the bases (no stickiness)', async ({ page }) => {
  // The sticky-prone configuration: data-theme set (token transitions armed).
  await p_addInitThemeLight(page);
  await page.goto('/colors');

  const baseline = await readTintWithDefaults(page);
  // drag the hue away and back — the shades must land on the same values
  await page.evaluate(() => {
    const root = document.documentElement;
    root.setAttribute('data-palette', 'custom');
    root.style.setProperty('--ui-base-attention-h', '160');
  });
  await page.waitForTimeout(50);
  await page.evaluate(() =>
    document.documentElement.style.setProperty('--ui-base-attention-h', '28'),
  );
  await page.waitForTimeout(50);
  expect(await readTint(page), 'tint returns to the default value').toBe(baseline);
});

/** Set the sidebar-style saved theme before page load (data-theme present). */
async function p_addInitThemeLight(page) {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
}

/** Activate the scope at default bases, then read the attention tint color. */
async function readTintWithDefaults(page) {
  await page.evaluate(() => {
    const root = document.documentElement;
    root.setAttribute('data-palette', 'custom');
    root.style.setProperty('--ui-base-attention-h', '28');
  });
  return readTint(page);
}

async function readTint(page) {
  return page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:absolute;visibility:hidden;';
    document.body.append(probe);
    probe.style.color = 'var(--ui-color-attention-tint)';
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillStyle = getComputedStyle(probe).color;
    ctx.fillRect(0, 0, 1, 1);
    const rgb = [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3).join(',');
    probe.remove();
    return rgb;
  });
}
