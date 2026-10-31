# Stepper

## Purpose

Step-by-step progress of a process: steps in order with done/current/upcoming states. Often interactive (steps as links). One canonical element — `<ol>` with `role="list"`, no JS. Not a Timeline variant: Stepper is progress state, Timeline is static chronology.

## Native basis

- Elements `<ol>/<li>`: native list semantics (step sequence, item structure).
- Current step: native ARIA state `aria-current="step"` (announced by screen readers).
- Done step: the platform has no "completed" attribute — the host declares it with a boolean `data-done` attribute; upcoming step is the default (no attributes).
- Attributes sit on the `<li>` (static steps) or on the interactive step element — the link (CSS covers both via `:has(> …)` on the direct child).
- Opt-in styling: a bare `<ol>` is a native list; the class adds the visual vocabulary (state markers, connecting rail, orientation).
- No component states: no `:hover` (except links), no focus, no JS.

## Canonical markup

```html
<ol class="ui-stepper" role="list">
  <li data-done><a href="/cart">Cart</a></li>
  <li aria-current="step"><a href="/checkout">Checkout</a></li>
  <li>Review</li>
</ol>
```

- `role="list"` is part of the canon (guard against the `list-style: none` VoiceOver quirk).
- Interactive steps are `<a href>` inside `<li>`; static steps are text or any host element. Component styles do not touch content (base typography); link underlines are removed at rest and return on hover.
- Step content (label, number, description) is host content; the component only zeroes external margins of the first/last child.
- Step numbering is host content; the marker carries state, not a number.

## Variants and sizes

- `data-orientation="horizontal"` — horizontal orientation. Default is vertical (Timeline geometry). No other variants; density and colors go through local tokens.
- No state classes — states are host attributes only: `aria-current="step"` (current), `data-done` (done).
- Local tokens (host overrides, no variant classes):
  - `--ui-stepper-accent` (default `brand` — done disk, current ring and dot);
  - `--ui-stepper-marker-color` (default `border-strong` — upcoming ring);
  - `--ui-stepper-marker-fill` (default `surface`);
  - `--ui-stepper-rail-color` (default `border`);
  - `--ui-stepper-marker-size` (default `--ui-space-md`);
  - `--ui-stepper-indent` (default `--ui-space-xl`);
  - `--ui-stepper-line-width` (default `2px`);
  - `--ui-stepper-marker-offset` (default `--ui-space-2xs`);
  - `--ui-stepper-gap-block` (default `--ui-space-lg`);
  - `--ui-stepper-gap-inline` (default `--ui-space-sm`).
- Marker alignment (vertical): offset = `(1lh - size) / 2`, centered on the first content line; adjust via `--ui-stepper-marker-offset` if the first child has its own font metrics.

## States

- States are host attributes only: `aria-current="step"` (current), `data-done` (done); upcoming is the default.
- No hover, focus, or disabled states on the component itself; links keep native focus ring from the base layer and underline on hover.
- Forced colors: rail and rings are borders — the system recolors them natively; the dot gradient and disk fill fall back to system canvas, done gets an explicit CanvasText ring.

## Keyboard and accessibility

- Native `list`/`listitem` roles; step order is native list semantics; current step announced via `aria-current="step"`.
- "Done" is not announced by screen readers (no platform attribute) — the host may add its own visually hidden label.
- Color is not the only carrier of meaning (WCAG 1.4.1): marker shape distinguishes states — solid disk (done), ring with dot (current), empty ring (upcoming).
- Step links: native focus and ring from the base layer; underline returns on hover.
- No animations — reduced motion handling not required.

## Do not

- Do not replace `<ol>/<li>` with `<div>` grids — list semantics would be lost.
- Do not use Stepper for event chronology — that is Timeline.
- Do not set `data-done` and `aria-current="step"` on the same step.
- Do not create states with classes (`.is-done` etc.) — attributes only.
- Do not draw a done glyph (checkmark) — the marker shape itself carries the state.
- Do not set inter-step spacing via margin — inter-step rhythm belongs to the component.
- Do not reference `--ui-base-*` in host overrides — only semantic `--ui-*` tokens.
