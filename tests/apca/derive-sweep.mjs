/**
 * Base-grid sweep for the derivation layer (plan:
 * docs/plans/2026-10-26-color-derivation.md, session 1) — a DATA report,
 * no pass/fail gate: the formulas make no guarantees outside the calibrated
 * defaults, this shows where they degrade.
 *
 * Manual run (needs the static server, same as playwright.config.mjs):
 *   npx -y serve -l 4173 ../apps/docs &
 *   node apca/derive-sweep.mjs
 *
 * For each base combination the script drives the derive layer through its
 * own CSS (inline bases + data-palette), reads the semantic tokens per theme
 * and prints the minimum |Lc| per checked pair. apca-w3 — same math as CI.
 */
import { chromium, firefox } from '@playwright/test';

const BASE = 'http://localhost:4173/colors';

// [fg, bg, role threshold] — the pairs that constrain the derivation.
const NEUTRAL_PAIRS = [
  ['text', 'surface', 75],
  ['text-muted', 'surface', 60],
  ['text-muted', 'surface-raised', 60],
];
const FAMILY_PAIRS = [
  ['on', 'fill', 75], // on-X / X (fill)
  ['fill', 'surface', 75], // X as text on the page
  ['strong', 'surface', 75],
  ['strong', 'tint', 75],
];

// (The token-name mapping is mirrored inside the page script below —
// evaluate args must be serializable.)

const grid = async (browserName, type) => {
  const browser = await type.launch();
  const page = await (await browser.newContext()).newPage();
  await page.goto(BASE);
  await page.evaluate(() => document.documentElement.setAttribute('data-palette', 'custom'));

  const report = await page.evaluate(
    async ({ neutralPairs, familyPairs }) => {
      const mod = await import('/vendor/apca-w3.mjs');

      const root = document.documentElement;
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;visibility:hidden;';
      document.body.append(probe);
      const ctx = document.createElement('canvas').getContext('2d');

      const set = (prop, value) => root.style.setProperty(prop, String(value));
      const unset = (prop) => root.style.removeProperty(prop);
      const colorOf = (name) => {
        const cssVar = name === 'focus-ring' ? '--ui-focus-ring' : `--ui-color-${name}`;
        probe.style.color = `var(${cssVar})`;
        ctx.fillStyle = '#000';
        ctx.fillStyle = getComputedStyle(probe).color;
        ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data;
        return d[3] === 0 ? null : [...d].slice(0, 3);
      };

      const out = {};
      /** Registry token name from a family and a role: 'fill' = X (the bare
       * family token), 'on' = on-X; 'surface' is the global neutral surface;
       * everything else is the family-suffixed token (strong, tint). */
      const familyToken = (family, role) => {
        if (role === 'fill') return family;
        if (role === 'on') return `on-${family}`;
        if (role === 'surface') return 'surface';
        return `${family}-${role}`;
      };
      const measure = (pairs, getFg, getBg, min, at) => {
        root.style.transition = 'none';
        for (const theme of ['light', 'dark']) {
          root.setAttribute('data-theme', theme);
          for (const [suffix, bgRole, threshold] of pairs) {
            const fg = colorOf(getFg(suffix));
            const bg = colorOf(getBg(bgRole));
            if (fg.length === undefined || bg.length === undefined) continue;
            const lc = Math.abs(Number(mod.APCAcontrast(mod.sRGBtoY(fg), mod.sRGBtoY(bg))));
            const key = `${suffix || 'fill'}/${bgRole}`;
            min[key] ??= { lc: Infinity, threshold, themes: new Set() };
            if (lc < min[key].lc) {
              min[key].lc = lc;
              min[key].at = at + theme;
            }
            if (lc < threshold) min[key].themes.add(theme);
          }
        }
        root.removeAttribute('data-theme');
        root.style.transition = '';
      };

      // ---- neutral: chroma x hue x page lightness ----
      const neutral = {};
      for (const c of [0, 0.02, 0.06, 0.12]) {
        set('--ui-base-n-c', c);
        for (let h = 0; h < 360; h += 60) {
          set('--ui-base-n-h', h);
          for (const page of [0.9, 0.95, 1]) {
            set('--ui-base-n-page', `${page * 100}%`);
            measure(
              neutralPairs,
              (fg) => fg,
              (bg) => bg,
              neutral,
              `n-c ${c} h ${h} page ${page} — `,
            );
          }
        }
      }
      unset('--ui-base-n-c');
      unset('--ui-base-n-h');
      unset('--ui-base-n-page');
      out.neutral = neutral;

      // ---- chromatic families: lightness x chroma x hue ----
      for (const family of ['accent', 'success', 'warning', 'danger']) {
        const min = {};
        for (const l of [0.15, 0.3, 0.55, 0.7, 0.75, 0.95]) {
          set(`--ui-base-${family}-l`, l);
          for (const c of [0.05, 0.18, 0.3, 0.37]) {
            set(`--ui-base-${family}-c`, c);
            for (let h = 0; h < 360; h += 60) {
              set(`--ui-base-${family}-h`, h);
              measure(
                familyPairs,
                (fg) => familyToken(family, fg),
                (bg) => familyToken(family, bg),
                min,
                `l ${l} c ${c} h ${h} — `,
              );
            }
          }
        }
        for (const prop of ['-l', '-c', '-h']) unset(`--ui-base-${family}${prop}`);
        out[family] = min;
      }

      probe.remove();
      for (const key of Object.keys(out)) {
        out[key] = Object.fromEntries(
          Object.entries(out[key]).map(([pair, { lc, threshold, at, themes }]) => [
            pair,
            `min |Lc| ${lc.toFixed(1)} (threshold ${threshold}) at ${at ?? '?'}${
              themes.size ? ` — below in: ${[...themes].join('+')}` : ''
            }`,
          ]),
        );
      }
      return out;
    },
    { neutralPairs: NEUTRAL_PAIRS, familyPairs: FAMILY_PAIRS },
  );

  console.log(`\n=== ${browserName} ===`);
  for (const [group, pairs] of Object.entries(report)) {
    console.log(`-- ${group}`);
    for (const [pair, line] of Object.entries(pairs)) console.log(`   ${pair.padEnd(20)} ${line}`);
  }
  await browser.close();
};

await grid('chromium', chromium);
await grid('firefox', firefox);
