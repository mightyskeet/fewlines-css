# Field / Input

## Purpose
Text input with a label, hint, and native validation. A family of controls (`ui-input`, `ui-textarea`, `ui-select`) with a single `ui-field` wrapper and one size scale aligned with Button.

## Native basis
- `<input>`, `<textarea>`, `<select>` — native controls.
- `<label>` — label association implicit via wrapping (no `for`/`id` needed).
- Native validation: `required`, `type="email"`, `pattern`, `min`/`max`.
- Native states: `:hover`, `:disabled`, `:read-only`, `:required`, `:valid`, `:invalid`, `:placeholder-shown`, `:user-invalid`, `:user-valid`.
- `accent-color` — native coloring of checkbox/radio/range.
- `:user-valid` is intentionally not styled.
- `::file-selector-button` — native button of `type="file"`.
- `field-sizing: content` — progressive enhancement.
- `appearance: none` on the closed `ui-select` — custom arrow; the dropdown, keyboard, and form semantics remain native.

## Canonical markup
```html
<label class="ui-field">
  <span class="ui-field-label">Email</span>
  <input class="ui-input" type="email" required placeholder="you@example.com" />
  <span class="ui-field-description">We never share your email.</span>
</label>
```

Hint linked explicitly when the control is outside the label:
```html
<label class="ui-field-label" for="email">Email</label>
<input class="ui-input" id="email" type="email" aria-describedby="email-hint" />
<span id="email-hint" class="ui-field-description">…</span>
```

Error:
```html
<input class="ui-input" type="email" id="email" aria-describedby="email-error" />
<span id="email-error" class="ui-field-error">Please enter a valid email.</span>
```

Read-only and file variants follow the same shape:
```html
<label class="ui-field">
  <span class="ui-field-label">API key</span>
  <input class="ui-input" type="text" readonly value="sk-…" />
  <span class="ui-field-description">Your API key is read-only.</span>
</label>
```

- Any element after a field gets an automatic gap (`.ui-field + *`) — next field, button, alert; hosts arrange nothing themselves.

## Variants and sizes
Controls: `ui-input`, `ui-textarea`, `ui-select`. Wrapper `ui-field` is shared.

`data-size="sm|lg"` (default md, attribute omitted) on the control:

| Value | Meaning |
|---|---|
| `sm` | Lower heights/paddings; also drops the control font to the `sm` step. |
| `lg` | Higher heights/paddings; font stays on the `default` step. |

- Height scale aligned with Button: sm `1.75rem` / md `2.25rem` / lg `2.75rem` — input, select, and button line up in one form row. `data-size` goes on each control (not the wrapper).
- `ui-input`/`ui-select` have a fixed `block-size`; `ui-textarea` size affects only paddings — height comes from `rows` (`3lh`).

Auto-sizing (progressive enhancement, only where `field-sizing` is supported):
- `ui-textarea` — auto-size **by default** inside `@supports`: `field-sizing: content`, bounds `min-block-size: 3lh` / `max-block-size: 50vh`. Without support — fixed size from `rows`. Opt-out: `data-field-sizing="fixed"`.
- `ui-input` — auto-size opt-in: `data-field-sizing="content"` (grows inline; block axis stays in the size scale).

Box model: `ui-input`/`ui-select` are `box-sizing: border-box` (UA defaults diverge between engines); `ui-textarea` stays content-box because its sizing is line-based.

## States
- Hover / disabled / read-only — `:hover`, `:disabled`, `:read-only`. Read-only (not disabled) is a flat page surface: the value is data, not an active control.
- Focus — `:focus-visible` ring from the base layer.
- Validation — `:user-invalid`: red border (attention family) and `attention-tint` background appear only after user interaction. Valid state is deliberately unstyled; in engines without `:user-invalid` no premature highlight — the native validation bubble remains.
- Placeholder — `::placeholder` with a muted color.
- File button — hover flips to the opposite surface (`surface-raised` → `surface`).

## Keyboard and accessibility
- Implicit label via wrapping — accessible name without `for`/`id`.
- `aria-describedby` for hints and errors (`ui-field-description`, `ui-field-error`).
- `:focus-visible` ring from the base layer.
- Disabled uses `:disabled` (removes from tab order natively).
- File input — name comes from the label, button is native.

## Do not
- Do not style `:invalid` without the `:user-` prefix — premature red before user interaction.
- Do not replace native validation with JS validation without need.
- Do not drop the `<label>` — a placeholder is not a label.
- Do not use `div` instead of `span` inside the label (label is an inline container).
- Do not add sizes via classes — only `data-size`.
- Do not shift the native select chevron with padding — position is set via `background-position` on `appearance: none`.
- Do not override the `block-size` of single-line controls with a host font larger than the scale — use `data-size="lg"` for large fonts.
