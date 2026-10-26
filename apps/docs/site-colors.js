// Colors page: live theming playground for the docs site.
//
// Overrides semantic tokens on :root via inline style (inline wins over
// core.css, and light-dark() inside the override keeps the theme switch
// working). Persists to localStorage['colors']; every docs page restores
// the map before first paint with a tiny inline <head> script
// (fixture.html deliberately has no applier — browser tests rely on the
// default token values).
//
// This is host/tooling JS — the core package stays CSS-only
// (overview notes, «Не является целью»).

const KEY = 'colors';

const GROUPS = [
  {
    label: 'Surfaces & text',
    tokens: [
      '--ui-color-surface',
      '--ui-color-surface-raised',
      '--ui-color-text',
      '--ui-color-text-muted',
      '--ui-color-border',
      '--ui-color-border-strong',
    ],
  },
  {
    label: 'Accent',
    tokens: [
      '--ui-color-accent',
      '--ui-color-accent-strong',
      '--ui-color-accent-surface',
      '--ui-color-on-accent',
      '--ui-color-accent-tint',
    ],
  },
  {
    label: 'Success',
    tokens: [
      '--ui-color-success',
      '--ui-color-success-strong',
      '--ui-color-success-surface',
      '--ui-color-on-success',
      '--ui-color-success-tint',
    ],
  },
  {
    label: 'Warning',
    tokens: [
      '--ui-color-warning',
      '--ui-color-warning-strong',
      '--ui-color-on-warning',
      '--ui-color-warning-tint',
    ],
  },
  {
    label: 'Danger',
    tokens: [
      '--ui-color-danger',
      '--ui-color-danger-strong',
      '--ui-color-danger-surface',
      '--ui-color-on-danger',
      '--ui-color-danger-tint',
    ],
  },
  {
    label: 'Neutral action',
    tokens: [
      '--ui-color-neutral-surface',
      '--ui-color-neutral-hover',
      '--ui-color-neutral-strong',
      '--ui-color-on-neutral',
      '--ui-color-neutral-tint',
    ],
  },
  {
    label: 'Focus',
    tokens: ['--ui-focus-ring'],
  },
];

const ALL = GROUPS.flatMap((g) => g.tokens);

// state: { token: { light: '#rrggbb', dark: '#rrggbb' } }
let state = {};
// core defaults per theme, captured before any override is applied
const originals = {};

const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });

/** Any CSS color string -> '#rrggbb' via the canvas parser. */
function toHex(cssColor) {
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = '#000';
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  if (d[3] === 0) return null;
  const hex = (n) => n.toString(16).padStart(2, '0');
  return `#${hex(d[0])}${hex(d[1])}${hex(d[2])}`;
}

/** Read the core default of every token in both themes. */
function captureOriginals() {
  const root = document.documentElement;
  const savedTheme = root.getAttribute('data-theme');
  // Strip the overrides the head applier just restored, so the values
  // captured here are the core.css defaults, not the host's own choices.
  for (const token of ALL) root.style.removeProperty(token);
  for (const theme of ['light', 'dark']) {
    root.setAttribute('data-theme', theme);
    for (const token of ALL) {
      const value = toHex(getComputedStyle(root).getPropertyValue(token).trim());
      if (value) (originals[token] ??= {})[theme] = value;
    }
  }
  if (savedTheme) root.setAttribute('data-theme', savedTheme);
  else root.removeAttribute('data-theme');
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (const token of ALL) {
      const entry = raw[token];
      if (entry?.light && entry?.dark) state[token] = { light: entry.light, dark: entry.dark };
    }
  } catch {
    state = {};
  }
}

function save() {
  if (Object.keys(state).length === 0) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(state));
}

/** Push the current state onto :root as light-dark() overrides. */
function apply() {
  const root = document.documentElement;
  for (const token of ALL) {
    const value = state[token];
    if (value) root.style.setProperty(token, `light-dark(${value.light}, ${value.dark})`);
    else root.style.removeProperty(token);
  }
}

function buildUi() {
  const host = document.getElementById('color-groups');
  for (const group of GROUPS) {
    const fieldset = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = group.label;
    fieldset.append(legend);
    for (const token of group.tokens) {
      const row = document.createElement('div');
      row.className = 'color-row';
      const name = document.createElement('code');
      name.textContent = token;
      row.append(name);
      for (const theme of ['light', 'dark']) {
        const label = document.createElement('label');
        label.append(document.createTextNode(theme === 'light' ? 'Light ' : 'Dark '));
        const input = document.createElement('input');
        input.type = 'color';
        input.value = (state[token] ?? originals[token])[theme];
        input.dataset.token = token;
        input.dataset.theme = theme;
        input.setAttribute('aria-label', `${token} — ${theme} theme`);
        input.addEventListener('input', () => {
          (state[token] ??= { light: originals[token].light, dark: originals[token].dark })[theme] =
            input.value;
          save();
          apply();
          renderExport();
        });
        label.append(input);
        row.append(label);
      }
      fieldset.append(row);
    }
    host.append(fieldset);
  }
}

function renderExport() {
  const lines = Object.entries(state).map(
    ([token, v]) => `  ${token}: light-dark(${v.light}, ${v.dark});`,
  );
  document.getElementById('export-code').textContent =
    lines.length > 0 ? `:root {\n${lines.join('\n')}\n}` : '/* ничего не переопределено */';
}

function reset() {
  state = {};
  save();
  apply();
  renderExport();
  for (const input of document.querySelectorAll('input[type="color"]')) {
    input.value = originals[input.dataset.token][input.dataset.theme];
  }
}

async function copyExport() {
  const text = `:root {\n${Object.entries(state)
    .map(([token, v]) => `  ${token}: light-dark(${v.light}, ${v.dark});`)
    .join('\n')}\n}`;
  await navigator.clipboard.writeText(text);
  const button = document.getElementById('copy-button');
  button.textContent = 'Copied';
  setTimeout(() => {
    button.textContent = 'Copy CSS';
  }, 1200);
}

captureOriginals();
load();
apply();
buildUi();
renderExport();
document.getElementById('reset-button').addEventListener('click', reset);
document.getElementById('copy-button').addEventListener('click', copyExport);
