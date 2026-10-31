# Badge

## Purpose

Compact status label: status ("Beta", "Active", "Failed"), counter ("3"), a marker next to headings, tabs, list items. Not interactive. Color variation via semantic tokens in two models: tint surfaces (feedback family, like Alert) and solid fill (default-button model), no JS.

## Native basis

- The platform has no native "badge" element — the component is static; the semantic layer belongs to the host application:
  - status — the text inside the badge is the value (color is not the only carrier of meaning, WCAG 1.4.1);
  - ambiguous counter — host adds `aria-label="3 unread messages"`.
- The element is a `<span>`: inline, no role, no focus, no states; interactive badges are forbidden (actions belong in Button).
- No states: no `:hover`, no focus, no JS.
- Theming: `light-dark()` in the `*-tint` / `*-fill` tokens.
- forced colors — `forced-color-adjust: auto`: the system removes the tint background, the label stays as system text.

## Canonical markup

```html
<span class="ui-badge">Beta</span> <span class="ui-badge" data-variant="attention">Failed</span>
```

- Text goes directly into `.ui-badge` (a single text node, or icon + text — host content is preserved via inline-flex + gap).
- The label never wraps (`white-space: nowrap`) — a badge is short by contract; multi-line pills are host styling.
- Integer line box: `line-height: 1`, the element is exactly 20px (12px font + 2xs padding). Host overrides of height/line-height must keep integer geometry — fractional height of an inline element puts all later document sections on fractional positions.
- Adjacent `.ui-badge` get a gap automatically (`.ui-badge + .ui-badge`).

## Variants and sizes

Two mirrored sets, families match Button (default/attention — the same "soft tint surface / bright solid fill" split):

| Attribute                     | Meaning                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| _(no attribute)_              | pastel default — brand pastel: `brand-tint` + `brand`, follows `--ui-color-brand`                                    |
| `data-variant="neutral"`      | gray member of the page palette (`surface-tint` + `text`), brand-independent                                         |
| `data-variant="attention"`    | urgency family (errors, destructive outcomes) — tint surface + bare tone text                                        |
| `data-solid` (alone)          | solid brand family: `on-brand` text on `brand` fill; follows `--ui-color-brand` when branded                         |
| `data-variant="…" data-solid` | solid fill of the family's bare tone + `on-*` text; `neutral` + solid = inverted gray (fill `text`, label `surface`) |

Sizes: `data-size="sm|lg"`; default is md, no attribute needed.

| Size         | Attribute        | Height | Padding |
| ------------ | ---------------- | ------ | ------- |
| sm           | `data-size="sm"` | 16px   | 3xs/2xs |
| md (default) | _(no attribute)_ | 20px   | 2xs/xs  |
| lg           | `data-size="lg"` | 28px   | xs/sm   |

Geometry scales; typography stays 0.75rem. All three heights are integer.

## States

No states (static container). Differences only via `data-variant` and `data-size`.

## Keyboard and accessibility

- Role is generic; accessible name is the label text; host sets `aria-label` for counters when needed.
- WCAG 1.4.1 (Use of Color): the variant must be duplicated by text/icon inside the badge; core does not impose icons.
- reduced motion — not required, there are no animations.

## Do not

- Do not make a badge interactive (`<button>`/`<a>` inside or instead of `.ui-badge`) — actions belong in Button.
- Do not style variants with extra classes (`.ui-badge-error`) — only `data-variant`; sizes only via `data-size`, not classes.
- Do not rely on color as the only variant signal (WCAG 1.4.1).
- Do not turn a badge into a multi-line block — it is a label (nowrap by contract).
- Do not set fractional height/line-height on top of the component — the pixel grid of the flow below breaks.
- Do not reference `--ui-base-*` from host overrides — only semantic `--ui-*`.
