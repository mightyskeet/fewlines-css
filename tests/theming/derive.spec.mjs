// Derivation tests (tests/theming): the seed + formulas layer against the
// real engine, on the Colors page whose tables are the live measurement.
//
// The last test is the CI-abbreviated hue grid (step 30°) — the full
// 360-point sweep runs separately: node theming/sweep.mjs.
import { test, expect } from '@playwright/test';
import { runHueSweep } from './page-sweep.mjs';

test('derivation layer: default bases pass the token matrix', async ({ page, browserName }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto('/pages/colors.html');
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
    const failed = rows.filter((r) => r.status !== 'P');
    console.log(`[${browserName}] ${label}: pairs ${rows.length}, failing ${failed.length}`);
    for (const r of failed) console.log(`  ${r.pair.padEnd(34)} ${r.status}  Lc ${r.lc}`);
    return failed;
  };

  // Phase A: core defaults (the derivation now lives in core; the scope
  // attribute is removed explicitly so the run measures the pristine tree).
  // The table reports the CURRENT theme; the runner emulates light.
  await page.evaluate(() => document.documentElement.removeAttribute('data-palette'));
  const coreFailures = await report('core defaults / light', await readTable());
  expect(coreFailures, 'core defaults pass in light').toEqual([]);

  // Phase B: the same derived defaults with the session scope active.
  await page.evaluate(() => document.documentElement.setAttribute('data-palette', 'custom'));
  const deriveFailures = await report('derive defaults / light', await readTable());
  expect(deriveFailures, 'derive defaults pass in light').toEqual([]);

  // Phase B2: same in the dark theme — the table follows the page theme.
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const darkFailures = await report('derive defaults / dark', await readTable());
  expect(darkFailures, 'derive defaults pass in dark').toEqual([]);

  // Phase C: an out-of-gamut dark brand seed (l 0.94, c 0.32 is far outside
  // sRGB). The table must gamut-map like the browser paints — the old canvas
  // parser clipped the color and reported a false fail (~75 Lc where the
  // mapped pair measures ~94).
  await page.evaluate(() => {
    const root = document.documentElement;
    root.style.setProperty('--ui-base-brand-dark-l', '0.94');
    root.style.setProperty('--ui-base-brand-dark-c', '0.32');
    root.style.setProperty('--ui-base-brand-dark-h', '276');
  });
  const onBrand = (await readTable()).find((r) => r.pair === 'on-brand / brand');
  expect(Number(onBrand.lc), 'out-of-gamut pair is mapped, not clipped').toBeGreaterThan(85);
  expect(onBrand.status, 'dark on-brand/brand passes').toBe('P');

  expect(errors, 'no page errors').toEqual([]);
});

test('palette widget: slider, persistence, reset', async ({ page }) => {
  await page.goto('/pages/colors.html');

  const linkLightness = page
    .locator('site-palette-family[family="Link"] input[type="range"]')
    .first();
  await linkLightness.fill('0.3');

  // The Colors page runs the derivation scope always-on (head script).
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'custom');
  // The first drag seeds the FULL map from the layer's CSS defaults —
  // no empty-string entries that would poison the restored palette.
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('colors-bases')));
  expect(stored['--ui-base-link-light-l']).toBe('0.3');
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
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'custom');
  await expect(page.evaluate(() => localStorage.getItem('colors-bases'))).resolves.toBeNull();
});

test('derivation: tint and fill keep the family hue', async ({ page }) => {
  await page.goto('/pages/colors.html');
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
    root.style.setProperty('--ui-base-attention-light-h', '160');
  });

  for (const token of ['--ui-color-attention-tint', '--ui-color-attention']) {
    const hue = await hueOf(token);
    const drift = Math.abs(((hue - 160 + 540) % 360) - 180);
    expect(drift, `${token} keeps the family hue`).toBeLessThanOrEqual(2);
  }
});

test('derivation: colors are a pure function of the bases (no stickiness)', async ({ page }) => {
  // The sticky-prone configuration: data-theme set (token transitions armed).
  await page.addInitScript(() => localStorage.setItem('theme', 'light'));
  await page.goto('/pages/colors.html');

  const baseline = await readTintWithDefaults(page);
  // drag the hue away and back — the shades must land on the same values
  await page.evaluate(() => {
    const root = document.documentElement;
    root.setAttribute('data-palette', 'custom');
    root.style.setProperty('--ui-base-attention-light-h', '160');
  });
  await page.waitForTimeout(50);
  await page.evaluate(() =>
    document.documentElement.style.setProperty('--ui-base-attention-light-h', '28'),
  );
  await page.waitForTimeout(50);
  expect(await readTint(page), 'tint returns to the default value').toBe(baseline);
});

test('derivation: the fill polarity branch jumps the APCA dead zone', async ({ page }) => {
  await page.goto('/pages/colors.html');

  const lightnessOf = (token) =>
    page.evaluate(
      ({ token }) => {
        const probe = document.createElement('div');
        probe.style.cssText = 'position:absolute;visibility:hidden;';
        document.body.append(probe);
        probe.style.color = `oklch(from var(${token}) l c h)`;
        const m = getComputedStyle(probe).color.match(/oklch\(\s*([\d.]+)(%?)\s/);
        probe.remove();
        if (!m) throw new Error(`no oklch in ${getComputedStyle(probe).color}`);
        return m[2] === '%' ? Number(m[1]) / 100 : Number(m[1]);
      },
      { token },
    );

  const setSeedL = (l) =>
    page.evaluate((l) => {
      const root = document.documentElement;
      root.setAttribute('data-palette', 'custom');
      root.style.setProperty('--ui-base-attention-light-l', String(l));
    }, l);

  // vivid branch (seed L 0.69): the fill recalibrates to 0.28 + 0.37 * 0.69
  // and the on-* pole is white.
  await setSeedL(0.69);
  expect(await lightnessOf('--ui-color-attention'), 'vivid fill lightness').toBeCloseTo(0.5353, 2);
  expect(await lightnessOf('--ui-color-on-attention'), 'vivid pole is white').toBeGreaterThan(0.99);

  // pastel branch (seed L 0.71): the fill jumps to 0.8 + 0.38 * 0.01 — the
  // zone 0.54-0.8 is never entered — and the pole flips to near-black.
  await setSeedL(0.71);
  expect(await lightnessOf('--ui-color-attention'), 'pastel fill lightness').toBeCloseTo(0.8038, 2);
  expect(await lightnessOf('--ui-color-on-attention'), 'pastel pole is near-black').toBeLessThan(
    0.12,
  );
});

test('derivation sweep: the hue grid keeps the registry valid (CI, step 30°)', async ({ page }) => {
  await page.goto('/pages/colors.html');
  const { failures } = await page.evaluate(runHueSweep, 30);
  expect(failures, 'every hue point passes the registry thresholds').toEqual([]);
});

/** Activate the scope at default bases, then read the attention tint color. */
async function readTintWithDefaults(page) {
  await page.evaluate(() => {
    const root = document.documentElement;
    root.setAttribute('data-palette', 'custom');
    root.style.setProperty('--ui-base-attention-light-h', '28');
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
