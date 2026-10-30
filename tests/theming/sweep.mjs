// Full 360-point hue sweep of the derivation — the separate run behind the
// CI abbreviated grid (tests/theming/derive.spec.mjs, step 30°).
//
// The sweep drives the palette widget's live tables across the seed hue grid
// at the calibrated L/C defaults and checks the APCA registry per point.
// Needs the static server (same as playwright.config.mjs):
//
//   npx -y serve -l 4173 ../apps/docs &
//   node theming/sweep.mjs
//
// Runs chromium AND firefox: the engines gamut-map out-of-sRGB seeds their
// own way — the report is the honest per-engine picture. Exit 1 on any
// failing pair.
import { chromium, firefox } from '@playwright/test';
import { runHueSweep } from './page-sweep.mjs';

const BASE = 'http://localhost:4173/colors';

try {
  await fetch(BASE);
} catch {
  console.error(
    'The static server is not running. Start it first:\n  npx -y serve -l 4173 ../apps/docs',
  );
  process.exit(1);
}

const sweep = async (browserName, type) => {
  const browser = await type.launch();
  const page = await (await browser.newContext()).newPage();
  await page.goto(BASE);
  const { failures, min } = await page.evaluate(runHueSweep, 1);
  await browser.close();

  console.log(`\n=== ${browserName} ===`);
  console.log('minimum |Lc| per pair across the sweep:');
  for (const [pair, v] of Object.entries(min).sort()) {
    console.log(`  ${pair.padEnd(34)} ${String(v.lc).padStart(6)}  at ${v.at}`);
  }
  if (failures.length) {
    console.log(`FAILING points: ${failures.length}`);
    for (const f of failures.slice(0, 40)) {
      console.log(`  ${f.theme} ${f.family} h ${f.hue} — ${f.pair} (${f.status}, Lc ${f.lc})`);
    }
  }
  return failures.length;
};

const failed = (await sweep('chromium', chromium)) + (await sweep('firefox', firefox));
process.exit(failed > 0 ? 1 : 0);
