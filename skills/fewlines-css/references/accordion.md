# Accordion

## Purpose

Expandable content block: FAQs, settings, grouped content. Opening and closing are native — no JS required.

## Native basis

- `<details>` / `<summary>` — native disclosure widget.
- `details[open]` — native state attribute.
- Keyboard behavior is native: Enter/Space on `<summary>` toggles.
- `::details-content` (Chrome 131+, FF 143+, Safari 18.4+) used only for animation, inside `@supports`.
- Grid track animation — interpolating `grid-template-rows` (baseline high in all engines) — basis of the expand animation.
- The native marker is replaced by a +/− indicator; `[open]` collapses the vertical bar (smooth morph). Forced colors fall back to a text glyph.

## Canonical markup

```html
<details class="ui-accordion">
  <summary class="ui-accordion-summary">Title</summary>
  <div class="ui-accordion-content">Content</div>
</details>
```

Stack accordions: several `<details class="ui-accordion">` in a row — separators and rounding are applied automatically via the adjacent sibling selector.

Exclusive accordion (close others when one opens) is the native `name` attribute; core adds nothing:

```html
<details class="ui-accordion" name="faq">…</details>
<details class="ui-accordion" name="faq">…</details>
```

## Variants and sizes

One canonical variant; no `data-variant` or `data-size` attributes. Exclusive grouping is via the native `name` attribute (see above).

## States

- open — `details[open]` (native attribute).
- hover — `:hover` on summary; fill is rounded to the element radius; in the open state the bottom corners are square (the bottom is content).
- focus — `:focus-visible` from the base layer.
- Expand/collapse animation — by default inside `@supports selector(::details-content)`: `grid-template-rows: minmax(0, 0fr) ↔ minmax(0, 1fr)` interpolates; `@starting-style` provides the from-state for opening; `content-visibility … allow-discrete` smooths the native discrete visibility transition. Without `::details-content` the content appears instantly (graceful degradation; the component remains fully usable).
- reduced motion — animations disabled via media query.
- forced colors — `forced-color-adjust: auto`.

## Keyboard and accessibility

- Disclosure role is native; accessible name is the `<summary>` content.
- Enter/Space — native toggling.
- `aria-expanded` is not needed — state is read from the native `open`.
- Accordion content is available to screen readers in both states.

## Do not

- Do not emulate an accordion with `div` + JS toggle — you lose native state, keyboard behavior, and accessibility.
- Do not add JS for opening/closing.
- Do not remove `<summary>` — without it, details cannot expand.
- Do not style `summary` as a button via `role` — the semantics are native.
