/**
 * Node-side evaluation of the core color derivation — a JS mirror of
 * packages/core/src/tokens/derive.css (seed + formulas). The APCA gate
 * (check.mjs) validates the derived defaults without a CSS engine.
 *
 * The mirror follows the CSS file's structure: each theme's halves are
 * computed from that theme's seed tokens, and every semantic token is the
 * light-dark() pair (light half from the light seeds, dark half from the
 * dark seeds). One CONTRAST multiplier per family and theme scales every
 * derived step away from its contrast pole; 1 = the calibrated defaults.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* ---- Base seeds, parsed from the derive layer (source of truth) ---- */

const deriveCssPath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'packages',
  'core',
  'src',
  'tokens',
  'derive.css',
);

const bases = Object.fromEntries(
  [...readFileSync(deriveCssPath, 'utf8').matchAll(/--ui-base-([\w-]+):\s*([^;]+);/g)].map(
    ([, name, value]) => {
      const v = value.trim();
      return [name, v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v)];
    },
  ),
);

const base = (name) => {
  if (bases[name] === undefined) {
    throw new Error(`Missing base token: --ui-base-${name}`);
  }
  return bases[name];
};

/* ---- Color math (CSS Color 4) ---- */

const lerp = (a, b, w) => a + (b - a) * w;

/** Hue interpolation over the shortest arc. */
function shortestArc(h1, h2, w) {
  const d = ((h2 - h1 + 540) % 360) - 180 || 0;
  return (((h1 + d * w) % 360) + 360) % 360;
}

/** color-mix(in oklch, a, b w) — w is b's share. A chroma-0 endpoint
 * carries no hue (the other endpoint wins), matching CSS. */
function mixOklch(a, b, w) {
  return {
    L: lerp(a.L, b.L, w),
    C: lerp(a.C, b.C, w),
    H: a.C === 0 ? b.H : b.C === 0 ? a.H : shortestArc(a.H, b.H, w),
  };
}

/** oklch {L,C,H} -> OKLab {L,a,b}. */
function oklchToOkLab({ L, C, H }) {
  const h = (H * Math.PI) / 180;
  return { L, a: C * Math.cos(h), b: C * Math.sin(h) };
}

/** OKLab -> sRGB {r,g,b} 0..1, clamped (defaults are in gamut). */
function okLabToSrgb({ L, a, b }) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055633454 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const encode = (v) => {
    const clamped = Math.min(1, Math.max(0, v));
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
  };

  return {
    r: encode(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: encode(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: encode(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  };
}

const oklchToSrgb = (t) => okLabToSrgb(oklchToOkLab(t));

/** color-mix(in oklab, a, b w) — w is b's share. */
function mixOklabSrgb(a, b, w) {
  const A = oklchToOkLab(a);
  const B = oklchToOkLab(b);
  return okLabToSrgb({
    L: lerp(A.L, B.L, w),
    a: lerp(A.a, B.a, w),
    b: lerp(A.b, B.b, w),
  });
}

/* ---- The formula system ---- */

/** The fill polarity branch: vivid below the threshold, pastel above.
 * round() keeps the branch strictly binary in the CSS; the exact boundary
 * rounds up, like round(nearest) ties. */
const sel = (l) => (l >= 0.7 ? 1 : 0);

const WHITE = { L: 1, C: 0, H: 0 };
const BLACK9 = { L: 0.09, C: 0, H: 0 };

/** Chromatic family fill from the seed: vivid branch (seed L <= 0.70) or
 * saturated pastel above. The dark mapping lifts any seed into the light
 * band, so the dark branch is identical there. */
function familyFill(source, s, theme) {
  const { L: l, C: c, H } = source;
  const L =
    theme === 'light'
      ? (0.28 + 0.37 * l) * (1 - s) + (0.8 + 0.38 * (l - 0.7)) * s
      : (0.78 + 0.25 * l) * (1 - s) + (0.8 + 0.38 * (l - 0.7)) * s;
  const C =
    theme === 'light'
      ? Math.min(c, 0.32) * (1 - s) + Math.min(0.55 * c, 0.13) * s
      : Math.min(0.6 * c, 0.15) * (1 - s) + Math.min(0.55 * c, 0.13) * s;
  return { L, C, H };
}

/** Family tint: a pale deviation of the fill from the page pole (relative
 * oklch of the fill in the CSS). */
function tintOf(fill, k, theme) {
  const { L: l, C: c, H } = fill;
  const L = theme === 'light' ? 1 - k * 0.12 * (1 - l) : 0.09 + k * (0.033 + 0.12 * l);
  return { L, C: k * 0.12 * c, H };
}

/** One theme's derived half-values (the --ui-pl-* layer of the CSS). */
function half(theme) {
  const k = base(`n-${theme}-contrast`);
  const surface = {
    L: base(`n-${theme}-l`),
    C: base(`n-${theme}-c`),
    H: base(`n-${theme}-h`),
  };
  const text = { L: theme === 'light' ? 0.14 : 0.97, C: surface.C, H: surface.H };
  const raised = mixOklch(surface, text, k * (theme === 'light' ? 0.035 : 0.07));
  const soft = mixOklch(surface, text, k * 0.08);
  const muted = mixOklch(text, surface, 1 - k * (theme === 'light' ? 0.72 : 0.77));
  const border = mixOklch(surface, text, k * (theme === 'light' ? 0.15 : 0.17));
  const borderStrong = mixOklch(surface, text, k * (theme === 'light' ? 0.6 : 0.55));
  const poleDark = { L: 0.09, C: surface.C, H: surface.H };

  // brand: the fill IS the seed. attention/link: the family formulas
  // recalibrate the seed into the fill.
  const family = (name) => {
    const seed = {
      L: base(`${name}-${theme}-l`),
      C: base(`${name}-${theme}-c`),
      H: base(`${name}-${theme}-h`),
    };
    const kF = base(`${name}-${theme}-contrast`);
    const s = sel(seed.L);
    const fill = name === 'brand' ? seed : familyFill(seed, s, theme);
    const pole = mixOklch(WHITE, theme === 'light' ? BLACK9 : poleDark, s);
    const tint = tintOf(fill, kF, theme);
    return { seed, kF, fill, pole, tint };
  };

  return {
    surface,
    text,
    raised,
    soft,
    muted,
    border,
    borderStrong,
    poleDark,
    brand: family('brand'),
    attention: family('attention'),
    link: family('link'),
  };
}

const light = half('light');
const dark = half('dark');

/* ---- Semantic tokens: light-dark() pairs resolved to sRGB per theme ---- */

const tokens = {
  surface: { light: oklchToSrgb(light.surface), dark: oklchToSrgb(dark.surface) },
  'surface-raised': { light: oklchToSrgb(light.raised), dark: oklchToSrgb(dark.raised) },
  'surface-tint': { light: oklchToSrgb(light.soft), dark: oklchToSrgb(dark.raised) },
  hover: {
    light: oklchToSrgb(light.soft),
    dark: mixOklabSrgb(dark.raised, dark.border, 0.5),
  },
  text: { light: oklchToSrgb(light.text), dark: oklchToSrgb(dark.text) },
  'text-muted': { light: oklchToSrgb(light.muted), dark: oklchToSrgb(dark.muted) },
  border: { light: oklchToSrgb(light.border), dark: oklchToSrgb(dark.border) },
  'border-strong': {
    light: oklchToSrgb(light.borderStrong),
    dark: oklchToSrgb(dark.borderStrong),
  },
  'focus-ring': {
    light: oklchToSrgb(light.borderStrong),
    dark: oklchToSrgb(dark.borderStrong),
  },
  brand: { light: oklchToSrgb(light.brand.fill), dark: oklchToSrgb(dark.brand.fill) },
  'on-brand': {
    light: oklchToSrgb(light.brand.pole),
    dark: oklchToSrgb(dark.brand.pole),
  },
  'brand-hover': {
    light: mixOklabSrgb(light.brand.fill, light.brand.pole, light.brand.kF * 0.3),
    dark: mixOklabSrgb(dark.brand.fill, dark.brand.pole, dark.brand.kF * 0.14),
  },
  'brand-tint': {
    light: oklchToSrgb(light.brand.tint),
    dark: oklchToSrgb(dark.brand.tint),
  },
  'brand-tint-hover': {
    light: mixOklabSrgb(light.brand.fill, light.brand.tint, 0.92),
    dark: mixOklabSrgb(dark.brand.fill, dark.brand.tint, 0.92),
  },
  attention: {
    light: oklchToSrgb(light.attention.fill),
    dark: oklchToSrgb(dark.attention.fill),
  },
  'on-attention': {
    light: oklchToSrgb(light.attention.pole),
    dark: oklchToSrgb(dark.poleDark),
  },
  'attention-hover': {
    light: mixOklabSrgb(light.attention.fill, WHITE, light.attention.kF * 0.16),
    dark: mixOklabSrgb(dark.attention.fill, dark.poleDark, dark.attention.kF * 0.12),
  },
  'attention-tint': {
    light: oklchToSrgb(light.attention.tint),
    dark: oklchToSrgb(dark.attention.tint),
  },
  link: { light: oklchToSrgb(light.link.fill), dark: oklchToSrgb(dark.link.fill) },
  selection: { light: oklchToSrgb(light.link.tint), dark: oklchToSrgb(dark.link.tint) },
};

/** sRGB {r,g,b} 0..1 for a semantic token in a theme. */
export function resolveColor(name, theme) {
  const pair = tokens[name];
  if (!pair) {
    throw new Error(`Unknown semantic token: ${name}`);
  }
  return pair[theme];
}
