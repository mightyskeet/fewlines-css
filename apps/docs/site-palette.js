// Floating palette widget for the docs site (plan:
// docs/plans/2026-10-26-color-derivation.md, session 1).
//
// A fixed FAB opens our own Drawer (dogfooding: the widget is assembled from
// the components it recolors). Inside: base-token sliders per color family,
// Reset, Copy CSS (a host-ready snippet of the base tokens) and a live
// WCAG + APCA pass/fail table over the token-pair registry — copied to
// apps/docs/token-pairs.mjs by tests/prepare.mjs, the same mechanism as
// core.css. No manual duplication of the registry.
//
// Persisting: slider state goes to localStorage['colors-bases'] as a map of
// base-token -> value strings; restoring it before first paint is a tiny
// inline <head> script on every page (fixture.html deliberately has none —
// browser tests rely on the default token values). Applying the bases also
// sets data-palette="custom", which activates apps/docs/colors-derive.css.
//
// This is host/tooling JS — the core package stays CSS-only
// (overview notes, «Не является целью»).

import { tokenPairs, roleThresholds } from './token-pairs.mjs';
// The same apca-w3 build the CI gate (tests/apca/check.mjs) uses, vendored
// for the browser by tests/prepare.mjs — the widget's pass/fail must match
// CI, not a hand-rolled approximation.
import { APCAcontrast, sRGBtoY } from './vendor/apca-w3.mjs';

const KEY = 'colors-bases';

/** Slider layout per family. Lightness/color values are plain oklch numbers,
 * page lightnesses are percentages — the strings go into the CSS as-is. */
const FAMILIES = [
  {
    legend: 'Neutral',
    sliders: [
      { prop: '--ui-base-n-page', label: 'Page', min: 88, max: 100, step: 1, unit: '%' },
      { prop: '--ui-base-n-raised', label: 'Raised', min: 88, max: 100, step: 1, unit: '%' },
      { prop: '--ui-base-n-sunken', label: 'Sunken', min: 80, max: 100, step: 1, unit: '%' },
      { prop: '--ui-base-n-c', label: 'Chroma', min: 0, max: 0.12, step: 0.001 },
      { prop: '--ui-base-n-h', label: 'Hue', min: 0, max: 360, step: 1 },
    ],
  },
  {
    legend: 'Accent',
    sliders: [
      { prop: '--ui-base-accent-l', label: 'Lightness', min: 0.15, max: 0.95, step: 0.01 },
      { prop: '--ui-base-accent-c', label: 'Chroma', min: 0, max: 0.37, step: 0.01 },
      { prop: '--ui-base-accent-h', label: 'Hue', min: 0, max: 360, step: 1 },
    ],
  },
  {
    legend: 'Success',
    sliders: [
      { prop: '--ui-base-success-l', label: 'Lightness', min: 0.15, max: 0.95, step: 0.01 },
      { prop: '--ui-base-success-c', label: 'Chroma', min: 0, max: 0.37, step: 0.01 },
      { prop: '--ui-base-success-h', label: 'Hue', min: 0, max: 360, step: 1 },
    ],
  },
  {
    legend: 'Warning',
    sliders: [
      { prop: '--ui-base-warning-l', label: 'Lightness', min: 0.15, max: 0.95, step: 0.01 },
      { prop: '--ui-base-warning-c', label: 'Chroma', min: 0, max: 0.37, step: 0.01 },
      { prop: '--ui-base-warning-h', label: 'Hue', min: 0, max: 360, step: 1 },
    ],
  },
  {
    legend: 'Danger',
    sliders: [
      { prop: '--ui-base-danger-l', label: 'Lightness', min: 0.15, max: 0.95, step: 0.01 },
      { prop: '--ui-base-danger-c', label: 'Chroma', min: 0, max: 0.37, step: 0.01 },
      { prop: '--ui-base-danger-h', label: 'Hue', min: 0, max: 360, step: 1 },
    ],
  },
];

const PROPS = FAMILIES.flatMap((family) => family.sliders.map((slider) => slider.prop));

// state: { [base token]: value string } — empty means "core defaults".
let state = {};
const inputs = new Map(); // prop -> { input, output }

function valueOf(slider, raw) {
  return `${raw}${slider.unit ?? ''}`;
}

/** Base-token values as resolved right now (CSS defaults, or the restored
 * inline bases) — used to seed the full map on the first drag and after Reset. */
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

/** Push the state onto :root and toggle the derivation scope. */
function apply() {
  const root = document.documentElement;
  for (const prop of PROPS) {
    if (state[prop]) root.style.setProperty(prop, state[prop]);
    else root.style.removeProperty(prop);
  }
  if (Object.keys(state).length > 0) root.setAttribute('data-palette', 'custom');
  else root.removeAttribute('data-palette');
}

/* ---- Live contrast table (WCAG 2.1 + APCA via the vendored apca-w3) ---- */

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const probe = document.createElement('div');
probe.style.cssText = 'position:absolute;visibility:hidden;';

/** Any CSS color string -> [r, g, b] via the canvas parser (null if invalid). */
function toRgb(cssColor) {
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = '#000';
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return d[3] === 0 ? null : [d[0], d[1], d[2]];
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

// Pairs without a derived token stay out of the table (scrim is static and
// the disabled role is exempt from conformance — plan, "Ограничения").
const tablePairs = tokenPairs.filter((pair) => pair.role !== 'disabled');
const tableTokens = [...new Set(tablePairs.flatMap((pair) => [pair.fg, pair.bg]))];

/** Resolve every table token in both themes (synchronous style reads flip the
 * theme without an intermediate paint), then fill the table. */
function updateTable(rows) {
  const root = document.documentElement;
  const savedTheme = root.getAttribute('data-theme');
  // theme-transition.css animates the registered color tokens on theme
  // switch — reading right after the flip would return the starting values.
  // Suppress the transition for the measurement, restore afterwards.
  root.style.transition = 'none';
  const colors = {};
  for (const theme of ['light', 'dark']) {
    root.setAttribute('data-theme', theme);
    for (const name of tableTokens) {
      probe.style.color = `var(${cssVar(name)})`;
      colors[`${theme} ${name}`] = toRgb(getComputedStyle(probe).color);
    }
  }
  root.style.transition = '';
  if (savedTheme) root.setAttribute('data-theme', savedTheme);
  else root.removeAttribute('data-theme');

  for (const { pair, cells, pills } of rows) {
    const threshold = roleThresholds[pair.role];
    const values = ['light', 'dark'].map((theme) => {
      const fg = colors[`${theme} ${pair.fg}`];
      const bg = colors[`${theme} ${pair.bg}`];
      if (!fg || !bg) return null;
      return { w: wcag(fg, bg), lc: Math.abs(APCAcontrast(sRGBtoY(fg), sRGBtoY(bg))) };
    });
    cells.w.textContent = values.map((v) => (v ? v.w.toFixed(2) : '—')).join(' / ');
    cells.lc.textContent = values.map((v) => (v ? v.lc.toFixed(1) : '—')).join(' / ');
    for (const [index, pill] of pills.entries()) {
      const value = values[index];
      const status = value ? (value.lc >= threshold ? 'pass' : 'fail') : 'broken';
      pill.textContent = value ? status : 'n/a';
      pill.dataset.status = status;
    }
  }
}

/* ---- Widget UI ---- */

class SitePalette extends HTMLElement {
  /** Slider input hook, wired up in connectedCallback (private field must be
   * initialized so early events are a no-op). */
  #onInput = () => {};

  connectedCallback() {
    // Idempotent: connectedCallback re-runs whenever the element is moved.
    if (this.dataset.chrome) return;
    this.dataset.chrome = 'true';

    document.body.append(probe);
    const drawer = this.#buildDrawer();
    this.append(this.#buildFab(drawer), drawer);

    load();
    apply();
    this.#syncInputs();

    // Recompute the table when the drawer opens (values may have changed
    // elsewhere) and after every slider drag while it is open.
    let opened = false;
    this.#onInput = () => {
      if (opened) updateTable(this.rows);
    };
    drawer.addEventListener('toggle', () => {
      if (!drawer.matches(':popover-open')) return;
      opened = true;
      updateTable(this.rows);
    });
  }

  #buildFab(drawer) {
    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'site-palette-fab';
    fab.popoverTargetElement = drawer;
    fab.setAttribute('aria-label', 'Palette settings');
    fab.textContent = '◐';
    return fab;
  }

  #buildDrawer() {
    const drawer = document.createElement('aside');
    drawer.className = 'ui-drawer palette-drawer';
    drawer.id = 'site-palette-drawer';
    drawer.setAttribute('popover', '');
    drawer.dataset.variant = 'drawer-end';

    const title = document.createElement('h2');
    title.textContent = 'Palette';
    drawer.append(title);

    for (const family of FAMILIES) drawer.append(this.#buildFamily(family));

    const actions = document.createElement('div');
    actions.className = 'palette-actions';
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'ui-button';
    reset.textContent = 'Reset';
    reset.addEventListener('click', () => {
      state = {};
      save();
      apply();
      this.#syncInputs();
      updateTable(this.rows);
    });
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'ui-button';
    copy.textContent = 'Copy CSS';
    copy.addEventListener('click', async () => {
      await navigator.clipboard.writeText(this.#exportCss());
      copy.textContent = 'Copied';
      setTimeout(() => {
        copy.textContent = 'Copy CSS';
      }, 1200);
    });
    actions.append(reset, copy);
    drawer.append(actions);

    const contrastTitle = document.createElement('h2');
    contrastTitle.textContent = 'Contrast (live)';
    drawer.append(contrastTitle);
    drawer.append(this.#buildTable());

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'ui-button';
    close.popoverTargetElement = drawer;
    close.popoverTargetAction = 'hide';
    close.autofocus = true;
    close.textContent = 'Close';
    drawer.append(close);

    return drawer;
  }

  #buildFamily(family) {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = family.legend;
    fieldset.append(legend);
    for (const slider of family.sliders) {
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
      input.setAttribute('aria-label', `${family.legend} ${slider.label}`);
      input.addEventListener('input', () => {
        // The first drag seeds the full map so the saved snapshot stays
        // complete (the rest are the CSS defaults read at that moment).
        if (Object.keys(state).length === 0) state = readComputed();
        state[slider.prop] = valueOf(slider, input.value);
        save();
        apply();
        output.textContent = state[slider.prop];
        this.#onInput();
      });
      row.append(name, output, input);
      fieldset.append(row);
      inputs.set(slider.prop, { input, output, slider });
    }
    return fieldset;
  }

  #buildTable() {
    const table = document.createElement('table');
    table.className = 'palette-table';
    const head = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const label of ['Pair', 'Role', 'WCAG L/D', 'Lc L/D', 'Status']) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      headRow.append(th);
    }
    head.append(headRow);
    const body = document.createElement('tbody');
    this.rows = [];
    for (const pair of tablePairs) {
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
      const pills = [document.createElement('span'), document.createElement('span')];
      for (const pill of pills) {
        pill.className = 'palette-pill';
        status.append(pill);
      }
      row.append(name, role, w, lc, status);
      body.append(row);
      this.rows.push({ pair, cells: { w, lc }, pills });
    }
    table.append(head, body);
    return table;
  }

  /** Reflect the effective values (state, falling back to computed) into the
   * sliders and outputs. */
  #syncInputs() {
    const computed = readComputed();
    for (const [prop, { input, output, slider }] of inputs) {
      const value = state[prop] ?? computed[prop];
      if (value) {
        input.value = slider.unit ? value.replace('%', '') : value;
        output.textContent = value;
      }
    }
  }

  #exportCss() {
    const computed = readComputed();
    const lines = PROPS.map((prop) => `  ${prop}: ${state[prop] ?? computed[prop]};`);
    return [
      '/* Base tokens for the color derivation layer',
      ' * (docs/plans/2026-10-26-color-derivation.md).',
      ' * Activate with data-palette="custom" on :root.',
      ' */',
      ':root {',
      ...lines,
      '}',
    ].join('\n');
  }
}

customElements.define('site-palette', SitePalette);
