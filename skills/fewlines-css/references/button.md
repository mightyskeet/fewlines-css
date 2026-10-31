# Button

## Purpose

Button for actions: submitting forms, opening dialogs, running commands.

## Native basis

- `<button type="button|submit|reset">` — the primary element.
- `<a href>` — for navigation styled as a button (`role="button"` only if the behavior is truly button-like, not link-like).
- Native states: `:hover`, `:active`, `:disabled`, `:focus-visible` (base layer).
- Native form semantics: `type="submit"` submits the form without JS.

## Canonical markup

```html
<button class="ui-button" type="button">Label</button>
```

## Variants and sizes

One axis — `data-variant`; default without attribute.

| Variant                | Fill                                    | Text           | Hover / press                             |
| ---------------------- | --------------------------------------- | -------------- | ----------------------------------------- |
| default (no attribute) | `brand`                                 | `on-brand`     | `brand-hover` (press = hover + translate) |
| `secondary`            | `brand-tint`                            | `brand`        | `brand-tint-hover`                        |
| `outline`              | transparent                             | `text`         | `hover` + `border-strong`                 |
| `ghost`                | transparent                             | `text`         | `hover`                                   |
| `attention`            | `attention`                             | `on-attention` | `attention-hover`                         |
| `link`                 | transparent, no padding, `height: auto` | `text`         | underline                                 |

- Default is the brand family: by default an inverted gray (dark fill in light theme, near-white in dark). Branding is one override: `--ui-color-brand` (hover follows automatically).
- `secondary` — brand pastel: `brand-tint` + `brand`, follows the brand.
- Filled variants (default/secondary/attention) have no border: a 1px transparent border keeps the geometry aligned with outline.
- `outline` — resting border between `border` and `border-strong`; hover fills with `--ui-color-hover` and strengthens the border. `ghost` is outline without the border; hover is shared.
- `link` — plain text color, underline on hover; no background on hover/press.
- `attention` — solid fill of the urgency family (errors, destructive actions).

Sizes:

| Size                               | Attribute           | Height           |
| ---------------------------------- | ------------------- | ---------------- |
| md (default)                       | _(no attribute)_    | 2.25rem          |
| sm                                 | `data-size="sm"`    | 1.75rem          |
| lg                                 | `data-size="lg"`    | 2.75rem          |
| xs                                 | `data-size="xs"`    | 1.5rem           |
| icon / icon-sm / icon-lg / icon-xs | `data-size="icon*"` | square, = height |

- Heights match Field (sm 1.75 / md 2.25 / lg 2.75rem).
- `sm`/`xs` (and `icon-sm`/`icon-xs`) also drop the font to `--ui-font-size-sm`; `md` and up stay on the default step.
- Icons auto-size to 1rem (`pointer-events: none`); the square button is for icon-only actions.
- The button never shrinks narrower than its content as a flex/grid item — `min-inline-size: fit-content`.

## States

All states are native, no JS classes:

- hover / active — `:hover`, `:active` (both exclude disabled: hover is pointer-gated, active — WebKit matches `:active` on disabled buttons).
- focus — `:focus-visible` from the base layer (single `--ui-focus-ring`).
- disabled — `:disabled` for `<button>`, `aria-disabled="true"` for `<a>`.
- reduced motion — transitions disabled via media query.
- forced colors — `forced-color-adjust: auto`.

## Keyboard and accessibility

- Button text is the accessible name; icon-only buttons require `aria-label`, the icon gets `aria-hidden="true"`.
- `:focus-visible` ring from the base layer — do not override.
- Disabled via `:disabled` removes the button from tab order natively.
- `type="submit"` submits forms without JS.

## Do not

- Do not use `<div class="ui-button">` — only `<button>` or `<a>`.
- Do not add JS for hover/active/disabled states.
- Do not override `outline` — the focus ring is shared across the system.
- Do not ship an icon-only button without `aria-label`.
- Do not use `data-variant` for semantics (attention is visual; semantics come from context and text).
