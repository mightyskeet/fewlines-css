/**
 * APCA token matrix check (PROJECT_SPEC.md, 8.1).
 *
 * Validates every declared fg/bg pair in token-pairs.mjs against role-based
 * APCA thresholds, separately for light and dark themes.
 *
 * Run: node tests/apca/check.mjs
 * Exit 0 = all pairs pass; exit 1 = failures listed.
 *
 * Note: apca-w3 expects sRGB hex/rgb colors. OKLCH values are converted to
 * sRGB via CSS Color 4 conversion implemented locally (no extra dependency).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APCAcontrast, sRGBtoY } from 'apca-w3';
import { semanticMap, tokenPairs, roleThresholds } from './token-pairs.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Palette parsed from the source of truth; "deg" is stripped so the values
// match the oklch(L% C H) format the local converter expects.
const paletteMap = Object.fromEntries(
  [
    ...readFileSync(
      join(repoRoot, 'packages', 'core', 'src', 'tokens', 'palette.css'),
      'utf8',
    ).matchAll(/--ui-palette-([\w-]+):\s*([^;]+);/g),
  ].map(([, name, value]) => [name, value.trim().replace(/(\d)deg\b/g, '$1')]),
);
if (Object.keys(paletteMap).length === 0) {
  throw new Error('No palette tokens parsed from palette.css — parser broken');
}

/**
 * Convert OKLCH string to sRGB {r,g,b} in 0..1 using CSS Color 4 math.
 * Handles the subset used by the palette: oklch(L% C H).
 */
function oklchToSrgb(oklch) {
  const match = oklch.match(/oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)\)/);
  if (!match) {
    throw new Error(`Unsupported color format: ${oklch}`);
  }
  const [, lPct, cStr, hStr] = match;
  const L = Number(lPct) / 100;
  const C = Number(cStr);
  const H = (Number(hStr) * Math.PI) / 180;

  // OKLCH -> OKLab
  const a = C * Math.cos(H);
  const b = C * Math.sin(H);

  // OKLab -> LMS (non-linear)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055633454 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  // LMS -> linear sRGB
  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  // Linear sRGB -> gamma-encoded sRGB
  const encode = (v) => {
    const clamped = Math.min(1, Math.max(0, v));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  };

  return { r: encode(r), g: encode(g), b: encode(bl) };
}

/** Convert {r,g,b} 0..1 to "rgb(r g b)" 0-255 string for apca-w3. */
function toRgbString({ r, g, b }) {
  const to255 = (v) => Math.round(v * 255);
  return `rgb(${to255(r)} ${to255(g)} ${to255(b)})`;
}

/**
 * Convert sRGB {r,g,b} 0..1 to APCA Y (luminance).
 * apca-w3's sRGBtoY expects 0-255 array input.
 */
function toY({ r, g, b }) {
  return sRGBtoY([r * 255, g * 255, b * 255]);
}

function resolveColor(semanticName, theme) {
  const paletteRef = semanticMap[semanticName];
  if (!paletteRef) {
    throw new Error(`Unknown semantic token: ${semanticName}`);
  }
  const paletteKey = paletteRef[theme];
  const oklch = paletteMap[paletteKey];
  if (!oklch) {
    throw new Error(`Unknown palette token: ${paletteKey}`);
  }
  return oklchToSrgb(oklch);
}

let failures = 0;
let checked = 0;

console.log('APCA token matrix check\n');

for (const theme of ['light', 'dark']) {
  console.log(`Theme: ${theme}`);
  for (const pair of tokenPairs) {
    const fg = toY(resolveColor(pair.fg, theme));
    const bg = toY(resolveColor(pair.bg, theme));
    const Lc = APCAcontrast(fg, bg);
    checked += 1;

    const threshold = roleThresholds[pair.role];
    // APCA polarity: positive = dark text on light bg, negative = light text
    // on dark bg (apca-w3 FAQ). Magnitude is the contrast value.
    const LcAbs = Math.abs(Lc);
    const pass = LcAbs >= threshold;
    const label = `${pair.fg} on ${pair.bg} [${pair.role}]`;

    if (!pass) {
      failures += 1;
      console.log(`  FAIL  ${label}: Lc=${Lc.toFixed(1)} < ${threshold}`);
    } else {
      console.log(`  pass  ${label}: Lc=${Lc.toFixed(1)}`);
    }
  }
  console.log('');
}

console.log(`Checked ${checked} pairs (${tokenPairs.length} x 2 themes)`);

if (failures > 0) {
  console.error(`\n${failures} pair(s) failed`);
  process.exit(1);
}
console.log('\nAll pairs pass');
