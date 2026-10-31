# @fewlines/css

Platform-native UI system: semantic HTML, modern CSS, **zero runtime JavaScript**.

The library does not invent a runtime on top of the browser — it uses what
HTML and CSS can already do, and adds a unified visual language, theming,
an accessibility contract and a predictable API. Built for plain HTML and for
applications developed by coding agents.

## Principles

- **Native first** — `<button>`, `<dialog>`, the Popover API, native forms
  and validation; no custom state machines.
- **Zero runtime JS** — the core ships CSS only (verified automatically).
- **One canonical markup** — one canonical structure per component.
- **Controlled regression** — one implementation, fallbacks via `@supports`.
- **Verifiable quality** — browser, accessibility and APCA tests are part
  of the component contract.

## Installation and usage

```sh
pnpm add @fewlines/css
```

```css
/* Vite / bundler: the whole package */
@import '@fewlines/css';

/* or tokens only */
@import '@fewlines/css/tokens';
```

Theming: the default follows the system preference (`light-dark()` +
`color-scheme`); an explicit override is `data-theme="light|dark"` on the root
element.

## Theme and branding: seed + formulas

All semantic colors are not a static palette but derived from seed tokens
(`--ui-base-*`, one OKLCH seed per family per theme). Recoloring the system
means overriding the seed tokens in your CSS: semantic tokens recompute on
their own, zero JS. A live seed-picker tool is the Colors page of the
documentation site; anything outside the calibrated defaults is the host's
responsibility (verified by the WCAG+APCA table on the same page). The
derivation is covered by theming tests (`tests/browser/theme.spec.mjs`;
CI runs a 30° hue-step grid, a full 360-point sweep runs separately).

## Components

| Component | Basis                               | Classes                                                                           |
| --------- | ----------------------------------- | --------------------------------------------------------------------------------- |
| Button    | `<button>`, `<a>`                   | `ui-button`, `data-variant`, `data-size`                                          |
| Field     | `<input>/<textarea>/<select>`       | `ui-field`, `ui-input`, `ui-textarea`, `ui-select`, `ui-field-error`, `data-size` |
| Dialog    | `<dialog>` (top-layer)              | `ui-dialog`                                                                       |
| Popover   | Popover API + anchor positioning    | `ui-popover`, `ui-popover-trigger`                                                |
| Drawer    | `<div popover>` (edge panel)        | `ui-drawer`, `data-variant` (the host sets the `popover` attribute)               |
| Accordion | `<details>/<summary>`               | `ui-accordion`, `ui-accordion-summary`                                            |
| Alert     | static message container            | `ui-alert`, `data-variant`, `ui-alert-title/body`                                 |
| Badge     | static inline status label          | `ui-badge`, `data-variant`                                                        |
| Switch    | `<input type="checkbox" switch>`    | `ui-switch`, `ui-switch-field`, `ui-switch-label`                                 |
| Table     | `<table>` + `<caption>`             | `ui-table`, `ui-table-wrap`, `data-zebra`, `data-sticky`, `data-align`            |
| Tooltip   | `popover="hint"` / interest invoker | `ui-tooltip`, `ui-tooltip-trigger`                                                |

Beyond the components, the base layer styles semantic text elements without
classes: `code`/`kbd`/`samp`, `pre`, `mark`, `abbr`, links, `blockquote`,
`hr`, `sub`/`sup`, `::selection`.

Canonical markup and live examples: `apps/docs/`.

## Using with AI assistants

The repository ships an agent skill: `skills/fewlines-css/` — a compact
`SKILL.md` (install, theming, component index, system rules) plus
per-component references with canonical markup, variants, states and
constraints. Point your coding agent at the raw `SKILL.md` URL, or copy the
folder into your skills directory.

## Development

```sh
pnpm install        # installs deps, builds core, copies assets — repo is ready
pnpm build          # Lightning CSS → packages/core/dist
pnpm lint           # stylelint
pnpm format:check   # prettier
```

The docs site (`apps/docs/`) is static HTML — open `index.html` directly in a
browser. After changing core CSS, refresh the site with `node tests/prepare.mjs`
(it rebuilds core if needed).

Tests (Playwright, APCA, purity): see `tests/README.md`.

## License

MIT
