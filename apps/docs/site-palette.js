// Inline palette widget for the Colors page.
//
// The page hosts one section per base family; the widget's pieces are
// embedded there as autonomous custom elements: <site-palette-family>
// (seed sliders for one family), <site-palette-table> (a live WCAG + APCA
// pass/fail table over that family's token pairs) and <site-palette-actions>
// (Reset, Copy CSS — a host-ready snippet of the base tokens). The token-pair
// registry is copied to apps/docs/token-pairs.mjs by tests/prepare.mjs, the
// same mechanism as core.css — no manual duplication.
//
// Themes are tuned independently: every family has a light and a dark seed.
// The sliders and the table follow the page theme (data-theme attribute,
// falling back to prefers-color-scheme) — you tune what you see; the page's
// theme toggle switches the edited theme. The table reports the current
// theme only.
//
// Persistence: slider state goes to localStorage['colors-bases'] as a map of
// base-token -> value strings; restoring it before first paint is a tiny
// inline <head> script on every page (fixture.html deliberately has none —
// browser tests rely on the default token values). The Colors page activates
// the session scope (data-palette="custom") unconditionally in its head
// script, so this widget never toggles the attribute: sliders only write the
// base tokens they cover, and Reset returns them to core's defaults.
//
// This is host/tooling JS — the core package stays CSS-only
// and is not a library goal.

import { tokenPairs, roleThresholds } from './token-pairs.mjs';
// The same apca-w3 build the CI gate (tests/apca/check.mjs) uses, vendored
// for the browser by tests/prepare.mjs — the widget's pass/fail must match
// CI, not a hand-rolled approximation.
import { APCAcontrast, sRGBtoY } from './vendor/apca-w3.mjs';

const KEY = 'colors-bases';

/** Slider layout per family, per theme — the same shape everywhere: the
 * seed's L/C/H plus one contrast multiplier. Lightness values are plain oklch
 * numbers, the neutral page lightness is a percentage, contrast is a bare
 * number (the strings go into the CSS as-is). */
const FAMILIES = [
  {
    name: 'Neutral',
    themes: {
      light: [
        { prop: '--ui-base-n-light-l', label: 'Page', min: 50, max: 100, step: 1, unit: '%' },
        { prop: '--ui-base-n-light-c', label: 'Chroma', min: 0, max: 0.12, step: 0.001 },
        { prop: '--ui-base-n-light-h', label: 'Hue', min: 0, max: 360, step: 1 },
        { prop: '--ui-base-n-light-contrast', label: 'Contrast', min: 0, max: 2, step: 0.05 },
      ],
      dark: [
        { prop: '--ui-base-n-dark-l', label: 'Page', min: 5, max: 50, step: 1, unit: '%' },
        { prop: '--ui-base-n-dark-c', label: 'Chroma', min: 0, max: 0.12, step: 0.001 },
        { prop: '--ui-base-n-dark-h', label: 'Hue', min: 0, max: 360, step: 1 },
        { prop: '--ui-base-n-dark-contrast', label: 'Contrast', min: 0, max: 2, step: 0.05 },
      ],
    },
  },
  {
    name: 'Brand',
    themes: {
      light: [
        { prop: '--ui-base-brand-light-l', label: 'Lightness', min: 0, max: 1, step: 0.01 },
        { prop: '--ui-base-brand-light-c', label: 'Chroma', min: 0, max: 0.37, step: 0.01 },
        { prop: '--ui-base-brand-light-h', label: 'Hue', min: 0, max: 360, step: 1 },
        { prop: '--ui-base-brand-light-contrast', label: 'Contrast', min: 0, max: 2, step: 0.05 },
      ],
      dark: [
        { prop: '--ui-base-brand-dark-l', label: 'Lightness', min: 0, max: 1, step: 0.01 },
        { prop: '--ui-base-brand-dark-c', label: 'Chroma', min: 0, max: 0.37, step: 0.01 },
        { prop: '--ui-base-brand-dark-h', label: 'Hue', min: 0, max: 360, step: 1 },
        { prop: '--ui-base-brand-dark-contrast', label: 'Contrast', min: 0, max: 2, step: 0.05 },
      ],
    },
  },
  {
    name: 'Link',
    themes: {
      light: [
        { prop: '--ui-base-link-light-l', label: 'Lightness', min: 0, max: 1, step: 0.01 },
        { prop: '--ui-base-link-light-c', label: 'Chroma', min: 0, max: 0.37, step: 0.01 },
        { prop: '--ui-base-link-light-h', label: 'Hue', min: 0, max: 360, step: 1 },
        { prop: '--ui-base-link-light-contrast', label: 'Contrast', min: 0, max: 2, step: 0.05 },
      ],
      dark: [
        { prop: '--ui-base-link-dark-l', label: 'Lightness', min: 0, max: 1, step: 0.01 },
        { prop: '--ui-base-link-dark-c', label: 'Chroma', min: 0, max: 0.37, step: 0.01 },
        { prop: '--ui-base-link-dark-h', label: 'Hue', min: 0, max: 360, step: 1 },
        { prop: '--ui-base-link-dark-contrast', label: 'Contrast', min: 0, max: 2, step: 0.05 },
      ],
    },
  },
  {
    name: 'Attention',
    themes: {
      light: [
        {
          prop: '--ui-base-attention-light-l',
          label: 'Lightness',
          min: 0.15,
          max: 0.95,
          step: 0.01,
        },
        { prop: '--ui-base-attention-light-c', label: 'Chroma', min: 0, max: 0.37, step: 0.01 },
        { prop: '--ui-base-attention-light-h', label: 'Hue', min: 0, max: 360, step: 1 },
        {
          prop: '--ui-base-attention-light-contrast',
          label: 'Contrast',
          min: 0,
          max: 2,
          step: 0.05,
        },
      ],
      dark: [
        {
          prop: '--ui-base-attention-dark-l',
          label: 'Lightness',
          min: 0.15,
          max: 0.95,
          step: 0.01,
        },
        { prop: '--ui-base-attention-dark-c', label: 'Chroma', min: 0, max: 0.37, step: 0.01 },
        { prop: '--ui-base-attention-dark-h', label: 'Hue', min: 0, max: 360, step: 1 },
        {
          prop: '--ui-base-attention-dark-contrast',
          label: 'Contrast',
          min: 0,
          max: 2,
          step: 0.05,
        },
      ],
    },
  },
];

const PROPS = FAMILIES.flatMap((family) =>
  Object.values(family.themes).flatMap((sliders) => sliders.map((slider) => slider.prop)),
);

/** The theme being viewed — and therefore edited and reported. */
const currentTheme = () =>
  document.documentElement.getAttribute('data-theme') ??
  (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

/** Semantic tokens owned by each family — determines which live table a
 * token pair belongs to. Neutral owns the shared surfaces/text, so it is the
 * fallback owner (a pair like attention/surface belongs to Attention but
 * still recomputes whenever any table updates). */
const FAMILY_TOKENS = {
  Neutral: [
    'text',
    'text-muted',
    'surface',
    'surface-raised',
    'surface-tint',
    'hover',
    'border',
    'border-strong',
    'focus-ring',
  ],
  Brand: ['brand', 'on-brand', 'brand-hover', 'brand-tint', 'brand-tint-hover'],
  Link: ['link', 'selection'],
  Attention: ['attention', 'on-attention', 'attention-hover', 'attention-tint'],
};

/** Pairs without a derived token stay out of the tables (scrim is static and
 * the disabled role is exempt from conformance — project constraints). */
const tablePairs = tokenPairs.filter((pair) => pair.role !== 'disabled');

const tokenFamily = new Map();
for (const [family, tokens] of Object.entries(FAMILY_TOKENS))
  for (const token of tokens) tokenFamily.set(token, family);

/** family -> pairs: the first non-Neutral owner across [fg, bg] wins. */
const pairsByFamily = Object.fromEntries(FAMILIES.map((family) => [family.name, []]));
for (const pair of tablePairs) {
  const [fgFamily, bgFamily] = [tokenFamily.get(pair.fg), tokenFamily.get(pair.bg)];
  pairsByFamily[fgFamily !== 'Neutral' ? fgFamily : (bgFamily ?? 'Neutral')].push(pair);
}

// state: { [base token]: value string } — empty means "the layer's defaults".
let state = {};
const inputs = new Map(); // prop -> { input, output, slider }

function valueOf(slider, raw) {
  return `${raw}${slider.unit ?? ''}`;
}

/** Base-token values as resolved right now (the derivation lives in core:
 * packages/core/src/tokens/derive.css). The Colors page activates the
 * session scope in its head script, so the defaults are always live and the
 * values read back complete (both themes' tokens exist). */
function readComputed() {
  const styles = getComputedStyle(document.documentElement);
  const values = {};
  for (const prop of PROPS) values[prop] = styles.getPropertyValue(prop).trim();
  return values;
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw) for (const prop of PROPS) if (raw[prop]) state[prop] = raw[prop];
  } catch {
    state = {};
  }
}

function save() {
  if (Object.keys(state).length === 0) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(state));
}

/** Push the state onto :root (the head script owns the scope attribute). */
function apply() {
  const root = document.documentElement;
  for (const prop of PROPS) {
    if (state[prop]) root.style.setProperty(prop, state[prop]);
    else root.style.removeProperty(prop);
  }
}

/* ---- Live contrast tables (WCAG 2.1 + APCA via the vendored apca-w3) ---- */

const probe = document.createElement('div');
probe.style.cssText = 'position:absolute;visibility:hidden;';

/* Colors are parsed and GAMUT-MAPPED in JS, not via canvas: a canvas
 * fillStyle silently clips out-of-gamut colors, while the browser gamut-maps
 * them at paint time (preserve OKLab L/H, reduce chroma) — a pastel seed
 * (l 0.94, c 0.32) measured ~75 Lc clipped vs ~94 mapped, a false fail.
 * Parser accepts the computed-value forms core tokens serialize to
 * (oklch/oklab, plus rgb()/color(srgb) for safety); anything else -> null
 * (the table shows n/a). */

const D2R = Math.PI / 180;

function oklabToLinearSrgb([L, a, b]) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3,
    m = m_ ** 3,
    s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function linearSrgbToOklab([r, g, b]) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l),
    m_ = Math.cbrt(m),
    s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

const IN_GAMUT_EPS = 0.00005;
const inGamut = (lin) => lin.every((c) => c >= -IN_GAMUT_EPS && c <= 1 + IN_GAMUT_EPS);

/** CSS Color 4 gamut mapping: keep L and H, binary-search the largest
 * in-gamut chroma (the spec's clip shortcut for near-gamut colors is
 * skipped — its effect is below the just-noticeable threshold). */
function gamutMap(L, a, b) {
  const lin = oklabToLinearSrgb([L, a, b]);
  if (inGamut(lin)) return lin;
  if (L >= 1) return [1, 1, 1];
  if (L <= 0) return [0, 0, 0];
  const C = Math.hypot(a, b);
  if (C === 0) return lin.map((c) => Math.min(Math.max(c, 0), 1));
  const cos = Math.cos(Math.atan2(b, a));
  const sin = Math.sin(Math.atan2(b, a));
  let min = 0,
    max = C;
  while (max - min > 0.0001) {
    const mid = (min + max) / 2;
    if (inGamut(oklabToLinearSrgb([L, mid * cos, mid * sin]))) min = mid;
    else max = mid;
  }
  return oklabToLinearSrgb([L, min * cos, min * sin]);
}

const gammaEncode = (lin) => {
  const c = Math.min(Math.max(lin, 0), 1);
  return Math.round((c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255);
};

const srgbLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

/** Computed color string -> [r, g, b] sRGB 0..255, gamut-mapped (null if the
 * string is not a color form this parser knows). Alpha is ignored — the
 * table compares opaque token colors. Computed values serialize channels as
 * plain numbers, so percentages and calc() are not handled. */
function toSrgb(cssColor) {
  const match = cssColor.match(/^(oklch|oklab|rgba?|color)\(([^)]*)\)$/);
  if (!match) return null;
  const [, kind, raw] = match;
  const parts = raw.split(/[,\s/]+/).filter((s) => s && s !== 'none');
  const values = parts.map(parseFloat).filter((n) => !Number.isNaN(n));
  let lin;
  if (kind === 'oklch') {
    const [L, C, H = 0] = values;
    lin = gamutMap(L, C * Math.cos(H * D2R), C * Math.sin(H * D2R));
  } else if (kind === 'oklab') {
    lin = gamutMap(...values);
  } else if (kind === 'color') {
    // parts[0] is the space: srgb (gamma) or srgb-linear (already linear);
    // its parseFloat is NaN and drops out of values.
    lin = parts[0] === 'srgb-linear' ? values.slice(0, 3) : values.slice(0, 3).map(srgbLinear);
    if (!inGamut(lin)) lin = gamutMap(...linearSrgbToOklab(lin));
  } else {
    lin = values.slice(0, 3).map((v) => srgbLinear(v / 255));
  }
  return lin.map(gammaEncode);
}

function wcag(fg, bg) {
  const a = sRGBtoY(fg);
  const b = sRGBtoY(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Semantic registry name -> CSS custom property on :root. */
function cssVar(name) {
  return name === 'focus-ring' ? '--ui-focus-ring' : `--ui-color-${name}`;
}

const tableTokens = [...new Set(tablePairs.flatMap((pair) => [pair.fg, pair.bg]))];

/** All live tables on the page; filled by <site-palette-table>. */
const registry = new Set();

/** Resolve every table token in the CURRENT theme, then fill every live
 * table. No color-scheme flipping is needed — the page itself is already in
 * the theme being reported. The token transition is still suppressed around
 * the measurement: right after a theme flip the registered tokens would
 * otherwise be read mid-transition. */
function updateAllTables() {
  const root = document.documentElement;
  root.style.transition = 'none';
  const colors = {};
  for (const name of tableTokens) {
    probe.style.color = `var(${cssVar(name)})`;
    colors[name] = toSrgb(getComputedStyle(probe).color);
  }
  // Land the restore in its own forced recalc so no transition can start
  // from the settled values.
  getComputedStyle(root).getPropertyValue('--ui-color-text');
  root.style.transition = '';

  for (const rows of registry) updateTable(rows, colors);
}

function updateTable(rows, colors) {
  for (const { pair, cells, pill } of rows) {
    const threshold = pair.threshold ?? roleThresholds[pair.role];
    const fg = colors[pair.fg];
    const bg = colors[pair.bg];
    const value =
      fg && bg ? { w: wcag(fg, bg), lc: Math.abs(APCAcontrast(sRGBtoY(fg), sRGBtoY(bg))) } : null;
    cells.w.textContent = value ? value.w.toFixed(2) : '—';
    cells.lc.textContent = value ? value.lc.toFixed(1) : '—';
    const status = value ? (value.lc >= threshold ? 'pass' : 'fail') : 'broken';
    pill.textContent = value ? status : 'n/a';
    pill.dataset.status = status;
  }
}

/** Debounced recompute — slider drags fire rapidly. */
let tableTimer = 0;
function scheduleUpdate() {
  clearTimeout(tableTimer);
  tableTimer = setTimeout(updateAllTables, 150);
}

/** Re-render callbacks (sliders, tables) run on a theme flip. */
const rerender = new Set();

/* ---- Widget pieces ---- */

function buildSlider(familyName, slider) {
  const row = document.createElement('label');
  row.className = 'palette-slider';
  const name = document.createElement('span');
  name.textContent = slider.label;
  const output = document.createElement('output');
  const input = document.createElement('input');
  input.type = 'range';
  input.min = slider.min;
  input.max = slider.max;
  input.step = slider.step;
  input.setAttribute('aria-label', `${familyName} ${slider.label}`);
  input.addEventListener('input', () => {
    // The first drag seeds the full map so the saved snapshot stays
    // complete (the rest are the layer's defaults read at that moment).
    if (Object.keys(state).length === 0) state = readComputed();
    state[slider.prop] = valueOf(slider, input.value);
    save();
    apply();
    output.textContent = state[slider.prop];
    scheduleUpdate();
  });
  row.append(name, output, input);
  inputs.set(slider.prop, { input, output, slider });
  return row;
}

class SitePaletteFamily extends HTMLElement {
  connectedCallback() {
    // Idempotent: connectedCallback re-runs whenever the element is moved.
    if (this.dataset.chrome) return;
    this.dataset.chrome = 'true';

    const family = FAMILIES.find((f) => f.name === this.getAttribute('family'));
    if (!family) return;
    const fieldset = document.createElement('fieldset');
    fieldset.className = 'palette-fieldset';
    this.append(fieldset);
    // The sliders edit the theme being viewed; a theme flip rebuilds them.
    const build = () => {
      fieldset.replaceChildren(
        ...family.themes[currentTheme()].map((s) => buildSlider(family.name, s)),
      );
    };
    build();
    rerender.add(build);
  }
}

class SitePaletteTable extends HTMLElement {
  connectedCallback() {
    if (this.dataset.chrome) return;
    this.dataset.chrome = 'true';

    const pairs = pairsByFamily[this.getAttribute('family')] ?? [];
    const build = () => {
      if (this.rows) registry.delete(this.rows);
      const table = document.createElement('table');
      table.className = 'palette-table';
      const head = document.createElement('thead');
      const headRow = document.createElement('tr');
      for (const label of ['Pair', 'Role', 'WCAG', 'Lc', 'Status']) {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = label;
        headRow.append(th);
      }
      head.append(headRow);
      const body = document.createElement('tbody');
      this.rows = [];
      for (const pair of pairs) {
        const row = document.createElement('tr');
        const name = document.createElement('td');
        const code = document.createElement('code');
        code.textContent = `${pair.fg} / ${pair.bg}`;
        name.append(code);
        const role = document.createElement('td');
        role.textContent = `${pair.role} ${roleThresholds[pair.role]}`;
        const w = document.createElement('td');
        const lc = document.createElement('td');
        const status = document.createElement('td');
        const pill = document.createElement('span');
        pill.className = 'palette-pill';
        status.append(pill);
        row.append(name, role, w, lc, status);
        body.append(row);
        this.rows.push({ pair, cells: { w, lc }, pill });
      }
      table.append(head, body);
      this.replaceChildren(table);
      registry.add(this.rows);
    };
    build();
    rerender.add(build);
  }

  /** Synchronous recompute (tests flip the scope attribute directly). */
  refresh() {
    updateAllTables();
  }
}

class SitePaletteActions extends HTMLElement {
  connectedCallback() {
    if (this.dataset.chrome) return;
    this.dataset.chrome = 'true';

    const actions = document.createElement('div');
    actions.className = 'palette-actions';
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'ui-button';
    reset.dataset.variant = 'attention';
    reset.textContent = 'Reset';
    reset.addEventListener('click', () => {
      state = {};
      save();
      apply();
      syncInputs();
      updateAllTables();
    });
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'ui-button';
    copy.textContent = 'Copy CSS';
    copy.addEventListener('click', async () => {
      await navigator.clipboard.writeText(exportCss());
      copy.textContent = 'Copied';
      setTimeout(() => {
        copy.textContent = 'Copy CSS';
      }, 1200);
    });
    actions.append(reset, copy);
    this.append(actions);
  }
}

/** Reflect the effective values (state, falling back to computed) into the
 * sliders and outputs. */
function syncInputs() {
  const computed = readComputed();
  for (const [prop, { input, output, slider }] of inputs) {
    const value = state[prop] ?? computed[prop];
    if (value) {
      input.value = slider.unit ? value.replace('%', '') : value;
      output.textContent = value;
    }
  }
}

function exportCss() {
  const computed = readComputed();
  const lines = PROPS.map((prop) => `  ${prop}: ${state[prop] ?? computed[prop]};`);
  return [
    '/* Base tokens for the color derivation (@fewlines/css, tokens/derive.css).',
    ' * Override these on :root — the whole palette re-derives.',
    ' */',
    ':root {',
    ...lines,
    '}',
  ].join('\n');
}

customElements.define('site-palette-family', SitePaletteFamily);
customElements.define('site-palette-table', SitePaletteTable);
customElements.define('site-palette-actions', SitePaletteActions);

// Module scripts are deferred: the DOM (and every embedded element) is fully
// parsed, the custom elements above upgraded synchronously — the registry is
// complete and the restored state (head script) is already applied.
document.body.append(probe);
load();
syncInputs();
updateAllTables();

/** A theme flip (page toggle or an OS-level change with no saved theme)
 * rebuilds the sliders and tables for the theme now being viewed. */
const onThemeFlip = () => {
  inputs.clear();
  for (const build of rerender) build();
  syncInputs();
  scheduleUpdate();
};
new MutationObserver(onThemeFlip).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onThemeFlip);
