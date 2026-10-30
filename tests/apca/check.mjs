/**
 * APCA token matrix check (accessibility notes).
 *
 * Validates every declared fg/bg pair in token-pairs.mjs against role-based
 * APCA thresholds, separately for light and dark themes. The token values
 * are the DERIVED defaults: resolveColor() re-implements the core formula
 * system (tests/apca/derive-values.mjs mirrors tokens/derive.css) — no
 * static palette is parsed.
 *
 * Run: node tests/apca/check.mjs
 * Exit 0 = all pairs pass; exit 1 = failures listed.
 *
 * Note: apca-w3 expects sRGB hex/rgb colors; the derived oklch values are
 * converted to sRGB via CSS Color 4 math in derive-values.mjs.
 */
import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { resolveColor } from './derive-values.mjs';
import { tokenPairs, roleThresholds } from './token-pairs.mjs';

/** apca-w3 takes 0-255 channel arrays. */
const toY = ({ r, g, b }) => sRGBtoY([r * 255, g * 255, b * 255]);

let failures = 0;
let checked = 0;

console.log('APCA token matrix check (derived defaults)\n');

for (const theme of ['light', 'dark']) {
  console.log(`Theme: ${theme}`);
  for (const pair of tokenPairs) {
    const fg = toY(resolveColor(pair.fg, theme));
    const bg = toY(resolveColor(pair.bg, theme));
    const Lc = APCAcontrast(fg, bg);
    checked += 1;

    const threshold = pair.threshold ?? roleThresholds[pair.role];
    const pass = Math.abs(Lc) >= threshold;
    const label = `  ${pair.fg} / ${pair.bg} [${pair.role}${pair.threshold ? `, min ${pair.threshold}` : ''}]`;

    if (pass) {
      console.log(`  pass  ${label}  Lc=${Math.abs(Lc).toFixed(1)}`);
    } else {
      failures += 1;
      console.log(`  FAIL  ${label}  Lc=${Math.abs(Lc).toFixed(1)} < ${threshold}`);
    }
  }
}

console.log(`\n${checked} pairs checked, ${failures} failing`);
process.exit(failures > 0 ? 1 : 0);
