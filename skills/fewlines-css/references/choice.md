# Choice

## Purpose
Option selection: checkbox (binary choice with a label, independent items) and radio (pick one of a group). Native behavior without JS; visuals are a box and a dot on `appearance: none` (Switch model).

## Native basis
- `<input type="checkbox">` and `<input type="radio">` — native toggling and selection, native keyboard (Space / arrows), form participation, `:checked` / `:disabled` / `:user-invalid`.
- Checkbox `:indeterminate` — host sets it via `el.indeterminate = true` (no HTML attribute; host JS only, core has no JS). Rendered as a dash instead of a checkmark ("partially selected").
- Visuals: `appearance: none` — box/dot drawn on the input itself; the checkmark is an SVG path as a `mask-image` data-URI on a `::before` layer.
- The checkmark appears with a fade (`opacity`); reduced motion disables it.
- States — native selectors only: `:checked`, `:indeterminate`, `:hover`, `:disabled`, `:user-invalid` (`:user-valid` is not styled).

## Canonical markup
```html
<label class="ui-choice-field">
  <input class="ui-checkbox" type="checkbox" />
  <span class="ui-choice-label">Email notifications</span>
</label>

<label class="ui-choice-field">
  <input class="ui-radio" type="radio" name="speed" value="standard" checked />
  <span class="ui-choice-label">Standard</span>
</label>
```

- The `ui-choice-field` wrapper is an implicit label: clicking the text toggles.
- `.ui-choice-label` is required — the accessible name of the control.
- Radios of one group share `name`.
- Hint: the host adds its own element and `aria-describedby` on the input.
- Stacked members: adjacent `.ui-choice-field` get a gap automatically.
- Group — `ui-fieldset` + `ui-fieldset-legend`: native group semantics, accessible name, and group disabling; inside — a stack of `.ui-choice-field`.

## Variants and sizes
None. Checkbox and radio are two native types of one family (`type` sets the semantics); the class on the input distinguishes the visuals.

## States
- `:checked` — `brand` fill, transparent border, checkmark/dot in `on-brand`.
- `:indeterminate` (checkbox) — `on-brand` dash on `brand` fill.
- `:hover` — border `border-strong` (pointer-gated `hover/pointer`, before any interaction).
- `:disabled` — opacity 0.5, `cursor: not-allowed`; in a group — native disabling via `fieldset[disabled]`.
- `:user-invalid` (required not met after interaction) — border `attention`; before interaction the border is neutral.

## Keyboard and accessibility
- Native semantics: `checkbox`/`radio`, name from the label; a radio group under a legend replaces repeated labels.
- Checkbox state is read by the checkmark/dash, radio by the dot — marker shape, not color only (WCAG 1.4.1).
- Focus ring from the base layer (`--ui-focus-ring`) — not overridden.
- forced colors: checked fill — `Highlight`, checkmark/dash/dot — `HighlightText`; `forced-color-adjust: auto`.
- reduced motion disables transitions.

## Do not
- Do not emulate with `<div>`/`<span>` instead of `<input>` — semantics and keyboard are native.
- Do not remove `.ui-choice-label` — the accessible name is required.
- Do not style `:valid`/`:user-valid` or `:invalid` without the `:user-` prefix (Field contract).
- Do not set `indeterminate` from HTML or a class — only host JS via the property; no state classes (`.is-checked`) — native selectors only.
- Do not style variants via classes; checkbox/radio switching is the native `type`.
- Do not duplicate group disabling with a JS loop — it is native `fieldset[disabled]` behavior.
