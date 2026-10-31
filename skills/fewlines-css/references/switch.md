# Switch

## Purpose
Binary on/off choice: settings, consent, modes. Native checkbox behavior without JS; visual is track + thumb on `appearance: none`.

## Native basis
- `<input type="checkbox">` — native toggling, keyboard (Space), form participation, `:checked` / `:disabled`.
- `switch` attribute — progressive enhancement of semantics: supporting engines (Safari 17.4+) expose role `switch`; without it the control is a native checkbox with identical behavior and a valid on/off role (ARIA APG accepts checkbox as the switch pattern base). The host may add `role="switch"` for a uniform role today — native ARIA, no JS.
- Visual: `appearance: none`; track on the input itself, thumb as `::before` on the input.
- States — native selectors only: `:checked`, `:hover`, `:disabled`, `:user-invalid`.

## Canonical markup
```html
<label class="ui-switch-field">
  <input class="ui-switch" type="checkbox" switch />
  <span class="ui-switch-label">Email notifications</span>
</label>
```
- The `ui-switch-field` wrapper is an implicit label: clicking the text toggles.
- `.ui-switch-label` is required — it is the control's accessible name.
- Hint: host adds its own element and `aria-describedby` on the input.
- Stacked switches: adjacent `.ui-switch-field` elements get spacing automatically.

## Variants and sizes
- No variants and no sizes — one canonical look.
- No `data-*` attributes in the API.

## States
- checked — `:checked`: track `--ui-color-brand`, transparent border, thumb shifts by 0.875rem (`translate`, animated).
- hover — `:hover`: border `--ui-color-border-strong`.
- disabled — `:disabled`: opacity 0.5, `cursor: not-allowed` on the control and on the wrapper via `:has(.ui-switch:disabled)`.
- user-invalid — `:user-invalid` (only after interaction): border `--ui-color-attention`; for required consents.
- Reduced motion: transitions are disabled.
- Forced colors: `forced-color-adjust: auto`, checked track = `Highlight`.

## Keyboard and accessibility
- Role: `switch` where the attribute is supported, `checkbox` elsewhere — both valid.
- Accessible name: the `.ui-switch-label` text (implicit label).
- Keyboard: Space toggles natively; focus uses the base-layer ring (`:where(:focus-visible)`), outline follows the radius.
- On/off state is conveyed by thumb position, not color alone (WCAG 1.4.1).
- `accent-color` is not used — the visual is fully custom.

## Do not
- Do not emulate a switch on `<div>`/`<button role="switch">` + JS — native state, keyboard, and form participation would be lost.
- Do not add JS for toggling.
- Do not style `:invalid` without `:user-` (Field rule).
- Do not remove `ui-switch-label` — the control would be left without an accessible name.
- Do not add sizes/variants via classes — one canonical look.
- Do not rely on `accent-color` for switch — UA rendering is not used.
