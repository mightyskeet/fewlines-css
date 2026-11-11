# Rating

## Purpose

Whole-star rating input: product reviews, feedback forms, quality scores.
One canonical element — a native radio group in a `<fieldset>`. Zero JS.

## Native basis

- `<input type="radio">` ×5 in a `<fieldset>` — native radio group: one
  selection, arrow-key stepping, Space, form participation, native
  `fieldset[disabled]` group disabling — nothing to build.
- The group name comes from the `<legend>` (or `aria-label` on the
  fieldset); each control's name from `aria-label` on the input
  ("1 star" … "5 stars") — the stars are empty elements, the shape is
  paint.
- Whole steps only. Half steps would mean 10 radios — double keyboard
  stops and half-value accessible names; not part of the contract.
- The inputs are invisible but NOT removed from layout/hit-testing:
  `position: absolute; opacity: 0` over the star box — the shared base
  `:focus-visible` ring outlines the star natively (no `outline: none`,
  the base focus contract holds), the pointer always lands on the input.
- The fill logic is forward-looking `:has()` (direct use,
  `docs/compatibility.md` 2026-11-09): no `direction: rtl` trick, the DOM
  order is the visual order — LTR/RTL both come free from the logical
  properties.

## Canonical markup

```html
<fieldset class="ui-rating">
  <legend class="ui-rating-legend">Your rating</legend>
  <label class="ui-rating-star">
    <input type="radio" name="rating" value="1" aria-label="1 star" />
  </label>
  <label class="ui-rating-star">
    <input type="radio" name="rating" value="2" aria-label="2 stars" />
  </label>
  <!-- … up to value="5" / "5 stars" … -->
</fieldset>
```

- The label wraps its input (the implicit-label model of Choice): a click
  anywhere on the star toggles; no `for`/`id` wiring.
- Plain flow inside the fieldset — no flex/grid on `<fieldset>` (the
  fieldset layout trap, `docs/compatibility.md` 2026-10-29); the star row
  is inline boxes. The stars TOUCH — no gap: the hover path must stay
  continuous across the row (a gap between the boxes drops the preview
  mid-move). The component neutralizes the pretty-printed markup
  whitespace itself (`font-size: 0` on the fieldset — the legend carries
  its own font); do not rely on hand-stripped whitespace in the HTML.
- The rhythm is the neighbors' model: the legend keeps the Field
  label→control air (`--ui-space-3xs`), adjacent groups stack
  (`--ui-space-sm`, the Fieldset/Field model).
- Hover preview is pointer-gated (`@media (hover: hover) and
(pointer: fine)`, the Choice/Switch model) — sticky `:hover` of touch
  would latch the preview.

### The paint

Two SVG-mask data-URI layers on the label (the Choice precedent — the
shape belongs to the SVG, the color to the semantic token):

- `::before` — the OUTLINE star: the empty state, `surface-tint`;
- `::after` — the SOLID star: the filled state, `brand`, fades in on
  `:checked`/hover (opacity; reduced motion disables the fade).

The filled look = the checked star plus every star before it:

```css
.ui-rating-star:has(:checked)::after,
.ui-rating-star:has(~ .ui-rating-star :checked)::after {
  opacity: 1;
}
```

The hover preview is the same shape with `:hover`. It only ever ADDS
fill: hovering below the current selection changes nothing — un-filling
the checked stars on hover would need state CSS cannot see (the checked
input may sit anywhere around the hovered star).

## Variants and sizes

None. One density; the star box scales via the local token (default
`1.5rem` = 24px — the WCAG 2.5.8 minimum target size; do not shrink it
below that).

### Customization (local tokens)

| Token              | Default  | Meaning        |
| ------------------ | -------- | -------------- |
| `--ui-rating-size` | `1.5rem` | Star box size. |

The fill follows the brand family by default; hosts re-theme through
semantic tokens in place (`--ui-color-brand` seed or the local token on
the fieldset) — no variants, no classes.

## States

Native only: `:checked` (drives the fill), `:hover` (preview,
pointer-gated), `:disabled` (the state-model opacity via
`.ui-rating:disabled` / `:has(input:disabled)`, `cursor: not-allowed`),
`:focus-visible` (the shared base focus ring on the input — it outlines
the star box). There is no separate read-only display widget: a static
score renders as text or as a host-composed filled/empty star row, not
through this component's radios.

## Keyboard and accessibility

- Native radio semantics: arrows step through the stars, Space selects,
  the group name comes from the legend, each value is announced with its
  `aria-label`.
- The state is not carried by color alone (WCAG 1.4.1): the star shape
  changes from outline to solid — the filled star is a shape difference,
  not a tint swap.
- Filled star: brand/surface-tint — the registered Progress fill pair
  (nonText, tests/apca); the empty outline is surface-tint on the page
  surface (the Slider rail model). No new APCA pairs.
- Forced colors: the outline takes `CanvasText`, the fill `Highlight`
  (the Choice model).
- Reduced motion disables the fill fade.

## Do not

- Do not replace the radios with `div`-based stars — the selection,
  keyboard and form semantics come with the radio group.
- Do not hide the inputs with `display: none` — they must stay
  focusable; `opacity: 0` over the star box is the contract.
- Do not set half steps (10 radios) — outside the contract; revisit as a
  separate decision if a host case demands it.
- Do not rely on the hover preview to un-fill checked stars — it only
  adds fill (see above).
- Do not put flex/grid on the `<fieldset>` — the fieldset layout trap;
  plain flow renders identically across engines.
- Do not shrink `--ui-rating-size` below `1.5rem` — the minimum target
  size (WCAG 2.5.8).
- Do not reference `--ui-base-*` from host overrides — only semantic
  `--ui-*` tokens.
