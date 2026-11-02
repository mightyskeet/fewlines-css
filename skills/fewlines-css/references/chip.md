# Chip

## Purpose

Compact interactive control with the Badge look: filters, tags-with-actions, small add/remove or toggle actions in dense toolbars. The Button state model (native hover/active/disabled/focus) at Badge's color model and pill geometry.

## Native basis

- `<button type="button|submit|reset">` — the primary element.
- `<a href>` — for navigation styled as a chip.
- Native states: `:hover`, `:active`, `:disabled`, `:focus-visible` (base layer) — no JS state classes.
- Native form semantics: `type="submit"` submits the form without JS.
- Theming: `light-dark()` in the derived tokens; the variant families follow `--ui-color-brand` / `--ui-color-attention`.
- forced colors — `forced-color-adjust: auto`.

## Canonical markup

```html
<button class="ui-chip" type="button">Label</button>
```

- The label never wraps (`white-space: nowrap`) — a chip is a short label by contract.
- Adjacent `.ui-chip` get a gap automatically (`.ui-chip + .ui-chip`).
- Icons auto-size to 1rem and never intercept the pointer; icon-only chips require `aria-label`.

## Variants and sizes

The attribute set mirrors Badge exactly — the same six looks:

| Attribute                     | Meaning                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| _(no attribute)_              | pastel default — brand pastel: `brand-tint` + `brand`, follows `--ui-color-brand`                                    |
| `data-variant="neutral"`      | gray member of the page palette (`surface-tint` + `text`), brand-independent                                         |
| `data-variant="attention"`    | urgency family (errors, destructive actions) — tint surface + bare tone text                                         |
| `data-solid` (alone)          | solid brand family: `on-brand` text on `brand` fill                                                                  |
| `data-variant="…" data-solid` | solid fill of the family's bare tone + `on-*` text; `neutral` + solid = inverted gray (fill `text`, label `surface`) |

Hover/press fill is the same family one step toward its contrast pole: `brand-tint-hover` / `hover` / `attention-tint-hover` (pastel), `brand-hover` / `inverse-hover` / `attention-hover` (solid). Press = the hover fill + a 1px translate (the Button model).

Sizes: `data-size="sm|lg"`; default is md, no attribute needed.

| Size         | Attribute        | Height  |
| ------------ | ---------------- | ------- |
| sm           | `data-size="sm"` | 1.5rem  |
| md (default) | _(no attribute)_ | 1.75rem |
| lg           | `data-size="lg"` | 2rem    |

Geometry scales; typography stays at `--ui-font-size-sm` on every size. Heights match Button's small steps (xs/sm) plus a 2rem top; `sm` (24px) already meets WCAG 2.5.8 target size.

## States

All states are native, no JS classes:

- hover / active — `:hover`, `:active` (both exclude disabled: hover is pointer-gated, active — WebKit matches `:active` on disabled buttons).
- focus — `:focus-visible` from the base layer (single `--ui-focus-ring`).
- disabled — `:disabled` for `<button>`, `aria-disabled="true"` for `<a>`.
- reduced motion — transitions disabled via media query.
- forced colors — `forced-color-adjust: auto`.

## Keyboard and accessibility

- Chip text is the accessible name; icon-only chips require `aria-label`, the icon gets `aria-hidden="true"`.
- `:focus-visible` ring from the base layer — do not override.
- WCAG 1.4.1 (Use of Color): the variant must be duplicated by text/icon; color is never the only carrier of meaning.

## Do not

- Do not use `<div class="ui-chip">` — only `<button>` or `<a>`; a static label is Badge, not Chip.
- Do not add JS for hover/active/disabled states.
- Do not style variants with extra classes — only `data-variant` / `data-solid`; sizes only via `data-size`.
- Do not turn a chip into a multi-line block — it is a short label (nowrap by contract).
- Do not reference `--ui-base-*` from host overrides — only semantic `--ui-*`.
